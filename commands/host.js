const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');

let claimedUsers = new Set(); // To track users who have claimed the key

module.exports = {
    name: 'host',
    description: 'Hosts a giveaway for a game key.',
    async execute(message, args) {
        if (args.length < 3) {
            return message.channel.send('Usage: !host <game name> <key> <platform>');
        }

        const gameName = args[0];
        const key = args[1];
        const platform = args[2];

        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle(`Giveaway: ${gameName}`)
            .addField('Platform', platform, true)
            .addField('Hosted by', message.author.username, true)
            .setTimestamp();

        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('claim_key')
                    .setLabel('Claim Key')
                    .setStyle('PRIMARY')
            );

        const giveawayMessage = await message.channel.send({ embeds: [embed], components: [row] });

        const filter = i => i.customId === 'claim_key' && !i.user.bot;
        const collector = message.channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            if (claimedUsers.has(i.user.id)) {
                await i.reply({ content: 'This key has already been claimed!', ephemeral: true });
            } else {
                claimedUsers.add(i.user.id);
                await i.reply({ content: `You have claimed the key: ${key}`, ephemeral: true });
                await i.user.send(`Here is your game key for ${gameName}: ${key}`);

                // Update the embed to show who claimed the key
                embed.addField('Claimed by', i.user.username, true);
                await giveawayMessage.edit({ embeds: [embed] });

                collector.stop(); // Stop the collector after the key is claimed
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                message.channel.send('No one claimed the key in time!');
            }
            // Optionally, disable the button after the time expires
            row.components[0].setDisabled(true);
            giveawayMessage.edit({ components: [row] });
        });
    },
};