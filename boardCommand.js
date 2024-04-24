const {
    SlashCommandBuilder
} = require('discord.js');
const fs = require('fs');
const config = require('./config.json');
const Boards = require('./boards.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName((config.nestBoardCommand).toLowerCase().replaceAll(/[^a-z0-9]/gi, '_'))
        .setDescription('Create nest board')
        .addStringOption(option =>
            option.setName('area')
            .setDescription('Select nest area')
            .setAutocomplete(true))
        .addStringOption(option =>
            option.setName('display-name')
            .setDescription('Display name of an area'))
        .addStringOption(option =>
            option.setName('min-average')
            .setDescription('Minumum average of spawns per hour'))
        .addBooleanOption(option =>
            option.setName("show-geofences")
            .setDescription("Draw geofence around nests"))
        .addBooleanOption(option =>
            option.setName("scale-pokemon")
            .setDescription("Scale pokemon by nest spawn frequency"))
        .addBooleanOption(option =>
            option.setName("show-description")
            .setDescription("Show description")),

    async execute(client, interaction, config, master, shinies) {
        await interaction.reply({
            content: 'Generating nest board...'
        }).catch(console.error);
        options = {
            areaName: interaction.options.getString('area'),
            displayName: interaction.options.getString('display-name'),
            minAverage: interaction.options.getString('min-average'),
            showGeofences: interaction.options.getBoolean('show-geofences'),
            scalePokemon: interaction.options.getBoolean('scale-pokemon'),
            showDescription: interaction.options.getBoolean('show-description')
        }
        let nestEmbedInfo = await Boards.fetchAreaNests(client, options, config, master, shinies);
        await interaction.deleteReply().catch(console.error);
        await interaction.channel.send({
                embeds: [nestEmbedInfo]
            })
            .then(msg => {
                var nestBoards = JSON.parse(fs.readFileSync('./nestBoards.json'));
                options.channelId = msg.channelId
                nestBoards[msg.id] = options
                fs.writeFileSync('./nestBoards.json', JSON.stringify(nestBoards));
            }).catch(console.error);
    }, //End of execute()  
};
