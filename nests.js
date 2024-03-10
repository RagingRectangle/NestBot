const {
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
  InteractionType
} = require('discord.js');
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildEmojisAndStickers, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildScheduledEvents, GatewayIntentBits.DirectMessages],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});
const _ = require('lodash');
var fs = require('fs');
var mysql = require('mysql2');
var request = require('request');
var schedule = require('node-schedule');

var config = require('./config.json');
var Boards = require('./boards.js');
var areaNames = [];
var master = {};
var shinies = {};

//Nest board check
if (!fs.existsSync('./nestBoards.json')) {
  fs.writeFileSync('./nestBoards.json', '{}');
}

client.on('ready', async () => {
  console.log("NestBot Logged In");
  registerCommands(client, config);

  //Update areas
  var areas = await updateAreas(config);
  if (areas != 'ERROR') {
    areaNames = areas;
  }

  //Update master
  request("https://raw.githubusercontent.com/WatWowMap/Masterfile-Generator/master/master-latest-poracle.json", {
    json: true
  }, (error, res, body) => {
    if (!error && res.statusCode == 200) {
      master = body.monsters;
      updateShinies();
    } else {
      console.log('Error updating master:', error);
      process.exit();
    }
  });

  //Update shinies
  async function updateShinies() {
    request("https://raw.githubusercontent.com/jms412/PkmnShinyMap/main/shinyPossible.json", {
      json: true
    }, (error, res, body) => {
      if (!error && res.statusCode == 200) {
        shinies = body.map;
      } else {
        console.log('Error updating shiny list:', error);
      }
      //Update boards
      cronUpdates();
    });
  } //End of updateShinies()

  //Auto update cron
  try {
    const updateNestsJob = schedule.scheduleJob('updateNestsJob', config.refreshCron, function () {
      cronUpdates();
    });
  } catch (err) {
    console.log(err);
  }
}); //End of ready()


//Cron updates
async function cronUpdates() {
  var nestBoards = JSON.parse(fs.readFileSync('./nestBoards.json'));
  for (const [msgID, msgInfo] of Object.entries(nestBoards)) {
    try {
      let nestEmbedInfo = await Boards.fetchAreaNests(client, msgInfo.areaName, config, master, shinies);
      let channel = await client.channels.fetch(msgInfo.channelId).catch(console.error);
      let message = await channel.messages.fetch(msgID);
      await message.edit({
        embeds: [nestEmbedInfo[0]],
      }).catch(console.error);
    } catch (err) {
      console.log(err);
    }
  } //End of message loop
} //End of cronUpdates()


//AutoComplete
client.on('interactionCreate', async interaction => {
  if (!interaction.isAutocomplete()) return;
  let focusedValue = await interaction.options.getFocused().toLowerCase();
  for (var i in interaction.options._hoistedOptions) {
    if (!interaction.options._hoistedOptions[i]['focused'] == true) {
      continue;
    }
    let optionName = interaction.options._hoistedOptions[i]['name'];
    try {
      //Area names
      if (optionName == 'area') {
        let filteredList = areaNames.filter(choice => choice.toLowerCase().includes(focusedValue)).slice(0, 25);
        sendAutoResponse(filteredList);
      }
    } catch (err) {
      console.log(`Error generating area names: ${err}`);
    }
  } //End of i loop

  async function sendAutoResponse(filteredList) {
    await interaction.respond(
      filteredList.map(choice => ({
        name: choice.toString(),
        value: choice.toString()
      }))
    ).catch(console.error);
  } //End of sendAutoResponse()
}); //End of autoComplete


//Update area names
async function updateAreas(query) {
  let connection = mysql.createConnection(config.nest_db);
  let areaQuery = `SELECT area_name FROM nests GROUP BY area_name;`;
  return new Promise((resolve, reject) => {
    connection.query(areaQuery, (error, results) => {
      if (error) {
        connection.end();
        console.log(error)
        return resolve(`ERROR`);
      } else {
        connection.end();
        var areas = [];
        for (var r in results) {
          areas.push(results[r]['area_name']);
        }
        return resolve(areas);
      }
    });
  });
} //End of updateAreas()


//Slash commands
client.on('interactionCreate', async interaction => {
  if (interaction.type !== InteractionType.ApplicationCommand) {
    return;
  }
  let user = interaction.user;
  if (user.bot == true) {
    return;
  }
  if (interaction.guildId == null) {
    await interaction.reply({
      content: 'Commands only available in guilds.',
      ephemeral: true
    }).catch(console.error);
    return;
  }
  //Verify user
  if (!config.adminIDs.includes(user.id)) {
    console.log(`User ${user.id} tried running ${interaction.commandName} command.`);
    await interaction.reply({
      content: 'User not authorized to run this command.',
      ephemeral: true
    }).catch(console.error);
    return;
  }
  const command = await interaction.client.commands.get(interaction.commandName);
  if (!command) {
    return;
  }
  try {
    let slashReturn = await command.execute(client, interaction, config, master, shinies);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: 'There was an error while executing this command!',
      ephemeral: true
    }).catch(console.error);
  }
}); //End of slash commands


async function registerCommands(client, config) {
  var commands = [];
  const {
    REST
  } = require('@discordjs/rest');
  const {
    Routes
  } = require('discord-api-types/v10');
  client.commands = new Collection();

  //Nest board
  let boardCommand = require(`./boardCommand.js`);
  commands.push(boardCommand.data.toJSON());
  client.commands.set(boardCommand.data.name, boardCommand);

  const rest = new REST({
    version: '10'
  }).setToken(config.token);
  await rest.put(
      Routes.applicationCommands(client.user.id), {
        body: commands
      },
    ).then(() => console.log(`Registered commands`))
    .catch(console.error);
} //End of registerCommands()


client.on("error", (e) => console.error(e));
client.on("warn", (e) => console.warn(e));
client.login(config.token);
