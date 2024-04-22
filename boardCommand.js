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
            .setRequired(true)
            .setAutocomplete(true))
        .addStringOption(option =>
            option.setName('display-name')
            .setDescription('Display name of an area')),

    async execute(client, interaction, config, master, shinies) {
        await interaction.reply({
            content: 'Generating nest board...'
        }).catch(console.error);
        let nestEmbedInfo = await Boards.fetchAreaNests(client, interaction.options.getString('area'), config, master, shinies);
        await interaction.deleteReply().catch(console.error);
        await interaction.channel.send({
                embeds: [nestEmbedInfo[0]]
            })
            .then(msg => {
                var nestBoards = JSON.parse(fs.readFileSync('./nestBoards.json'));
                nestBoards[msg.id] = {
                    channelId: msg.channelId,
                    areaName: interaction.options.getString('area')
                }
                fs.writeFileSync('./nestBoards.json', JSON.stringify(nestBoards));
            }).catch(console.error);
    }, //End of execute()  
};
