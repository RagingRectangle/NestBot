# PoGO Nest Bot

## About
A Discord bot for displaying current PoGO nests in areas.

Join the Discord server for any help and to keep up with updates: https://discord.gg/USxvyB9QTz


## Requirements
 - **New Discord bot with token** (If using an old bot that also uses /slash commands those will be overridden)
 - **Nest generator** (Nest tool such as Fletchling/Nestwatcher/Nestcollector)


## Install Normal
```
git clone https://github.com/RagingRectangle/NestBot.git
cd NestBot
cp config.json.example config.json
npm install
```
## Install Docker
```
git clone https://github.com/RagingRectangle/NestBot.git
cd NestBot
cp config.json.example config.json
add content from docker-compose.example.yml into your docker-compose.yml
docker-compose build nestbot
docker-compose up -d nestbot

Logs with:
docker-compose logs -f -t --tail="1000" nestbot
```

## Optional TileServer
 - Used for generating minimaps of nest locations.
 - [Install info](https://github.com/123FLO321/SwiftTileserverCache).
 - Create new `nest-bot` template using info from `nest-bot.json`.
 - Shout out to Malte for the centering/zoom calculations
 

## Config Setup
**token:** Discord token for bot.

**nest_db:** Database info where nest data is stored.

**adminIDs:** Discord user IDs who are allowed to use commands. Additional command settings can be found in the servers *Integrations* tab.

**updateCron:** [Cron schedule](https://crontab-generator.org/) for refreshing nest boards.

**nestBoardCommand:** Slash command name. Use only lowercase.

**nestBoardOrder:** Display order of nests. Options: `pokemon_id`, `pokemon_name`, `nest_name`, `pokemon_avg`.

**includeUnknown:** Whether or not to include nests with unknown names.

**renameUnknownFrom/renameUnknownTo:** Use these options to rename the default unknown nest names.

**defaultAverage:** The minimum hourly average to display in boards.

**averageToFixed:** How many decimals to include in averages.

**areaNameLink:** Whether or not to convert area names to map links (Will decrease max number of nests shown).

**linkFormat:** Format for links. Use: `{{lat}}` and `{{lon}}`.

**titleFormat:** Format for board embed title. Use `{{area}}` for area name.

**boardFormat:** Format for each nest entry in embed. Options: `{{dex}}`, `{{pokemon}}`, `{{shiny}}`, `{{type}}`, `{{avg}}`, `{{name}}`.

**ignoredFormNames:** List of form names to ignore.

**replaceUnderscores:** Whether or not to replace underscores in area names with spaces.

**language:** Pokemon name and form translations - possible: `en` / `de` / `es` / `fr` / `it` / `ru`

**footerFormat:** Date/time [format](https://momentjs.com/docs/#/displaying/format/) in footer.

**footerOffset:** Hours to offset in footer.

**tileServerURL:** Enter link to TileServer (Without trailing /).

**tileWidth/tileHeight:** Size of generated map in pixels.

**showGeofences:** Option to draw geofences around nests (true/false).

**scalePokemon:** Option to scale pokemon size on the board depending on average spawn count (true/false).

**scaleMinSize:** Minimum scale of pokemon markers (default 30).

**scaleMaxSize:** Maximum scale of pokemon markers (default 60).

**noNestsFound:** "No nests found.",

**emojis:** Same format as Poracle if you'd like to copy custom emojis over for types (Will decrease max number of nests shown).

## Commands

- **area** - Select the area of the nest. Multiple areas can be selected by comma separation. Leave empty for all areas.
- **display-name** - Overwrites the display name in the title. Useful for multi-area boards.
- **min-average** - Overwrites the `defaultAverage` option in the config. Useful for if boards of various scale are used.
- **show-geofence** - Overwrites the `showGeofences` option in the config. Useful for large areas with many nests to reduce Tileserver load.
- **scale-pokemon** - Overwrites the `scalePokemon` option in the config. Useful to disable scaling on small areas.

## Usage Normal
- Start the bot in a console with `node nests.js`.
- Can (*should*) use PM2 to run instead with `pm2 start nests.js --name NestBot`.
- Boards will refresh at set cron schedule.
- For now if you need to remove a board you can delete it from `nestBoards.json`.
- Restart to manually refresh nests, update game master, or update available shinies.


![Example](https://i.imgur.com/SJ8pWCv.gif)
