const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder
} = require('discord.js');
const _ = require('lodash');
var fs = require('fs');
var moment = require('moment');
var mysql = require('mysql2');
const superagent = require('superagent');

module.exports = {
  fetchAreaNests: async function fetchAreaNests(client, options, config, master, shinies) {
    var minimumAverage = options['minAverage'] || config.defaultAverage;
    var areaQuery = `SELECT lat, lon, polygon, name, area_name, pokemon_id, pokemon_form, pokemon_avg FROM nests WHERE pokemon_id > 0 AND pokemon_avg >= ${minimumAverage}`
    if (options['areaName'] != undefined) {
      var areas = options['areaName'].split(',').map(area => `"${area}"`).join(',')
      areaQuery = areaQuery.concat(` AND area_name IN (${areas})`);
    }
    if (config.includeUnknown == false) {
      areaQuery = areaQuery.concat(` AND name != ${config.renameUnknownFrom}`);
    }
    areaQuery = areaQuery.concat(` ORDER BY ${config.nestBoardOrder.replace('pokemon_name', 'pokemon_id').replace('nest_name', 'name')} ASC;`);
    if (config.nestBoardOrder == 'pokemon_avg') {
      areaQuery = areaQuery.replace('ASC;', 'DESC;');
    }
    var areaResults = await this.runQuery(config, areaQuery);
    var areaNests = [];
    var markers = [];
    var points = [];
    var geofences = [];

    
    for (var a = 0; a < areaResults.length; a++) {
      var nestInfo = areaResults[a];
      //Pokemon name
      let pokeInfo = master.monsters[`${nestInfo['pokemon_id']}_${nestInfo['pokemon_form']}`];
      let pokeNameTranslation = master.translations[config.language ? config.language : 'en'].pokemon[`poke_${nestInfo['pokemon_id']}`];
      let pokeFormTranslation = master.translations[config.language ? config.language : 'en'].forms[`form_${nestInfo['pokemon_form']}`];
      var pokemonName = pokeNameTranslation;
      if (pokeInfo.form.name && !config.ignoredFormNames.includes(pokeInfo.form.name)) {
        pokemonName = pokemonName.concat(` ${pokeFormTranslation}`);
        //Remove any ending in form
        if (pokemonName.endsWith(' Form') || pokemonName.endsWith(' Forme')) {
          pokemonName = pokemonName.replace(' Forme', '').replace(' Form', '');
        }
      }
      nestInfo.pokemonName = pokemonName;

      //Rename
      if (nestInfo.name == config.renameUnknownFrom) {
        nestInfo.name = config.renameUnknownTo;
      }

      //Types
      nestInfo.type = config.emojis[`type-${pokeInfo.types[0]['name'].toLowerCase()}`];
      if (pokeInfo.types[1]) {
        nestInfo.type = nestInfo.type.concat(`/${config.emojis[`type-${pokeInfo.types[1]['name'].toLowerCase()}`]}`);
      }

      //Shiny
      nestInfo.shiny = '';
      if (nestInfo.pokemon_form == 0 || pokeInfo.form.name == 'Normal') {
        if (shinies[nestInfo.pokemon_id] == ' ✨') {
          nestInfo.shiny = '✨';
        }
      } else if (shinies[`${nestInfo.pokemon_id}_${nestInfo.pokemon_form}`] == ' ✨' || shinies[`${nestInfo.pokemon_id}_${nestInfo.pokemon_form}*`]) {
        nestInfo.shiny = '✨';
      }

      areaNests.push(nestInfo);
    } //End of a loop

    //Sort by Pokemon
    if (config.nestBoardOrder == 'pokemon_name') {
      areaNests = _.sortBy(areaNests, 'pokemonName');
    }

    //Create board entries
    var boardEntries = [];
    for (var n = 0; n < areaNests.length; n++) {
      var nestName = areaNests[n]['name'];

      //Links
      if (config.areaNameLink == true) {
        let nestLink = config.linkFormat.replace('{{lat}}', areaNests[n]['lat']).replace('{{lon}}', areaNests[n]['lon']);
        nestName = `[${areaNests[n]['name']}](${nestLink})`;
      }

      if (options['showDescription']) {
        let nestEntry = config.boardFormat.replace('{{dex}}', areaNests[n]['pokemon_id']).replace('{{pokemon}}', areaNests[n]['pokemonName']).replace('{{shiny}}', areaNests[n]['shiny']).replace('{{type}}', areaNests[n]['type']).replace('{{avg}}', areaNests[n]['pokemon_avg'].toFixed(config.averageToFixed)).replace('{{name}}', nestName);
        boardEntries.push(nestEntry);
      }

      //Check length
      if (boardEntries.join('\n').length > 4096) {
        boardEntries.pop();
        break;
      }

      var scalePokemon = options['scalePokemon'] != undefined ? options['scalePokemon'] : config.showGeofences;
      var markerSize = 30
      if (scalePokemon) {
        markerSize = Math.round(Math.max(Math.min(areaNests[n]['pokemon_avg'], config.scaleMaxSize), config.scaleMinSize));
      }

      markers.push([areaNests[n]['pokemon_id'], areaNests[n]['pokemon_form'], areaNests[n]['lat'], areaNests[n]['lon'], markerSize]);
      points.push({
        latitude: areaNests[n]['lat'],
        longitude: areaNests[n]['lon']
      });

      var showGeofences = options['showGeofences'] != undefined ? options['showGeofences'] : config.showGeofences;
      if (showGeofences && areaNests[n]['polygon'].length > 0) {
        for (const geofence of areaNests[n]['polygon']) {
          // single polygon
          if (geofence.length > 1 && geofence[0].x !== undefined) {
            var coords = geofence
            .filter(obj => obj.x !== undefined || obj.y !== undefined)
            .map(obj => [obj.y, obj.x])
            if (coords.length > 0) {
              geofences.push(coords)
            }
          }
          // multi polygon
          else {
            for (const polygon of geofence) {
              var coords = polygon
              .filter(obj => obj.x !== undefined || obj.y !== undefined)
              .map(obj => [obj.y, obj.x])
              if (coords.length > 0) {
                geofences.push(coords)
              }                
            }
          }
        }
      }      
    } //End of n loop

    //Create title
    let titleString = options['displayName'] || options['areaName'];
    var title = config.titleFormat.replace('{{area}}', titleString);
    if (config.replaceUnderscores == true) {
      var title = title.replaceAll('_', ' ');
    }

    //Find center/zoom
    let tileData = await this.findCenterZoom(points, config.tileWidth, config.tileHeight);
    var miniMapLink = '';

    //Create embed
    if (boardEntries.length > 0) {
      nestEmbed = new EmbedBuilder().setTitle(title).setDescription(''+boardEntries.join('\n')).setTimestamp();
    }
    else {
      nestEmbed = new EmbedBuilder().setTitle(title).setTimestamp();
    }

    //No nests
    if (areaResults.length == 0) {
      nestEmbed.setDescription(config.noNestsFound ? config.noNestsFound : 'No nests found.');
      return nestEmbed;
    }
    //Nests with map
    else if (config.tileServerURL) {
      try {
        const res = await superagent.post(`${config.tileServerURL}/staticmap/nest-bot?pregenerate=true&regeneratable=true`)
          .send({
            "height": config.tileHeight,
            "width": config.tileWidth,
            "lat": tileData.latitude,
            "lon": tileData.longitude,
            "zoom": tileData.zoom,
            "nestjson": markers,
            "poly_path": geofences
          });
        nestEmbed.setImage(`${config.tileServerURL}/staticmap/pregenerated/${res.text}`);
      } catch (err) {
        console.error(`Map error for area ${areas}`);
        console.error(err);
      }
      return nestEmbed;
    }
    //Nests without map
    else {
      return nestEmbed;
    }
  }, //End of fetchAreaNests()


  //Find center/zoom
  findCenterZoom: async function findCenterZoom(points, width, height, margin = 1.25, defaultZoom = 17.5) {
    width /= margin
    height /= margin

    const objs = []
    if (points) {
      objs.push(...points.map((x) => [x.latitude, x.longitude]))
    }
    if (!objs.length) return
    const lats = objs.map(([lat]) => lat)
    const lons = objs.map(([, lon]) => lon)
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLon = Math.min(...lons)
    const maxLon = Math.max(...lons)
    const latitude = minLat + ((maxLat - minLat) / 2.0)
    const longitude = minLon + ((maxLon - minLon) / 2.0)
    const ne = [maxLat, maxLon]
    const sw = [minLat, minLon]
    if (ne[0] === sw[0] && ne[1] === sw[1]) {
      return {
        zoom: defaultZoom,
        latitude: lats[0],
        longitude: lons[0],
      }
    }

    function latRad(lat) {
      const sin = Math.sin(lat * Math.PI / 180.0)
      const rad = Math.log((1.0 + sin) / (1.0 - sin)) / 2.0 
      return Math.max(Math.min(rad, Math.PI), -Math.PI) / 2.0
    }

    function roundToTwo(num) {
      return +(`${Math.round(`${num}e+2`)}e-2`)
    }

    function zoom(px, fraction) {
      return roundToTwo(Math.log2(px / 256.0 / fraction))
    }
    const latFraction = (latRad(ne[0]) - latRad(sw[0])) / Math.PI
    let angle = ne[1] - sw[1]
    if (angle < 0.0) angle += 360.0
    const lonFraction = angle / 360.0
    return {
      zoom: Math.min(zoom(height, latFraction), zoom(width, lonFraction)),
      latitude,
      longitude,
    }
  }, //End of findCenterZoom()

  //Run query
  runQuery: async function runQuery(config, query) {
    let connection = mysql.createConnection(config.nest_db);
    return new Promise((resolve, reject) => {
      connection.query(query, (error, results) => {
        if (error) {
          connection.end();
          console.log(error)
          return resolve(`ERROR`);
        } else {
          connection.end();
          return resolve(results);
        }
      });
    });
  } //End of runQuery()
}
