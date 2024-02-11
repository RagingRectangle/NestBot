# PoGO Nest Bot

## About
A Discord bot for displaying current PoGO nests in areas.

Join the Discord server for any help and to keep up with updates: https://discord.gg/USxvyB9QTz


## Requirements
 - **New Discord bot with token** (If using an old bot that also uses /slash commands those will be overridden)
 - **Nest generator** (Nest tool such as Fletchling/Nestwatcher/Nestcollector)


## Install
```
git clone https://github.com/RagingRectangle/NestBot.git
cd NestBot
cp config.json.example config.json
npm install
```


## Optional TileServer
 - Used for generating minimaps of nest locations.
 - [Install info](https://github.com/123FLO321/SwiftTileserverCache).
 - Create new `nest-bot` template using info from `nest-bot.json`.
 

## Config Setup
**token:** Discord token for bot.

**nest_db:** Database info where nest data is stored.

**adminIDs:** Discord user IDs who are allowed to use commands. Additional command settings can be found in the servers *Integrations* tab.

**refreshCron:** [Cron schedule](https://crontab-generator.org/) for refreshing nest boards.

**nestBoardCommand:** Slash command name. Use only lowercase.

**nestBoardOrder:** Display order of nests. Options: `pokemon_id`, `pokemon_name`, `nest_name`, `pokemon_avg`.

**includeUnknown:** Whether or not to include nests with unknown names.

**renameUnknownFrom/renameUnknownTo:** Use these options to rename the default unknown nest names.

**minimumAverage:** The minimum hourly average to display in boards.

**averageToFixed:** How many decimals to include in averages.

**areaNameLink:** Whether or not to convert area names to map links (Will decrease max number of nests shown).

**linkFormat:** Format for links. Use: `{{lat}}` and `{{lon}}`.

**titleFormat:** Format for board embed title. Use `{{area}}` for area name.

**boardFormat:** Format for each nest entry in embed. Options: `{{dex}}`, `{{pokemon}}`, `{{shiny}}`, `{{type}}`, `{{avg}}`, `{{name}}`.

**ignoredFormNames:** List of form names to ignore.

**replaceUnderscores:** Whether or not to replace underscores in area names with spaces.

**footerFormat:** Date/time [format](https://momentjs.com/docs/#/displaying/format/) in footer.

**footerOffset:** Hours to offset in footer.

**tileServerURL:** Enter link to TileServer (Without trailing /).

**tileWidth/tileHeight:** Size of generated map in pixels.

**emojis:** Same format as Poracle if you'd like to copy custom emojis over for types (Will decrease max number of nests shown).


## Usage
- Start the bot in a console with `node nests.js`.
- Can (*should*) use PM2 to run instead with `pm2 start nests.js --name NestBot`.
- Boards will refresh at set cron schedule.
- For now if you need to remove a board you can delete it from `nestBoards.json`.
- Restart to manually refresh nests, update game master, or update available shinies.


![Example](https://i.imgur.com/SJ8pWCv.gif)