const { Client, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { DiscordAPIError } = require('discord.js'); 
const { keepAlive } = require('./keep_alive.js'); 

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const giveaways = {};
const prizeHistory = [];  // Array to store giveaway history

let currentPage = 1;
const entriesPerPage = 10;

client.once('ready', () => {
    console.log(`${client.user.tag} is now online!`);
});

function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [
        days > 0 ? `${days}d` : null,
        hours > 0 ? `${hours}h` : null,
        minutes > 0 ? `${minutes}m` : null,
        seconds > 0 ? `${seconds}s` : null
    ].filter(Boolean).join(' ');
}

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const args = message.content.trim().split(/\s+/);

    // Host a giveaway
    if (message.content.startsWith('!host')) {
        if (args.length < 4) {
            return message.reply('Usage: !host <game name> <code> <platform> [days hours minutes seconds]');
        }

        let hasTimer = args.slice(-4).every(arg => /^\d+$/.test(arg));
        let timeArgs = hasTimer ? args.slice(-4) : ['1', '0', '0', '0'];

        let platform = hasTimer ? args[args.length - 5] : args[args.length - 1];
        let code = hasTimer ? args[args.length - 6] : args[args.length - 2];
        let gameNameEndIndex = hasTimer ? args.length - 6 : args.length - 2;
        let gameName = args.slice(1, gameNameEndIndex).join(' ');

        const [days, hours, minutes, seconds] = timeArgs.map(Number);
        const timeInMs = ((days * 24 * 60 * 60) + (hours * 60 * 60) + (minutes * 60) + seconds) * 1000;

        const giveawayId = `${gameName}-${Date.now()}`;

        // Duplicate code check
        const duplicateCode = Object.values(giveaways).some(giveaway => giveaway.code === code);
        if (duplicateCode) {
            await message.delete(); // Delete the host's message if code is duplicate
            return message.reply('❌ This code has already been used in another giveaway. Please use a unique code.');
        }

        const endsAt = Date.now() + timeInMs;

        giveaways[giveawayId] = {
            host: message.author,
            gameName,
            code,
            platform,
            claimed: false,
            messageId: null,
            timeout: null,
            endsAt
        };

        const claimButton = new ButtonBuilder()
            .setCustomId(`claim_button_${giveawayId}`)
            .setLabel('Claim Key')
            .setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder().addComponents(claimButton);

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(`Game Giveaway: ${gameName}`)
            .setDescription(`Hosted by: ${message.author.tag}\nPlatform: ${platform}\n\n`) // Added space below Platform
            .setFooter({ text: 'Click the button to claim the key!' });

        const giveawayMessage = await message.channel.send({ embeds: [embed], components: [row] });

        giveaways[giveawayId].messageId = giveawayMessage.id;

        giveaways[giveawayId].timeout = setTimeout(async () => {
            if (!giveaways[giveawayId].claimed) {
                const expiredEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle(`Game Giveaway: ${gameName}`)
                    .setDescription(`\n\nThe giveaway has ended! Unfortunately, no one claimed the key in time.`);  // Added space above "The giveaway has ended!"

                try {
                    await giveawayMessage.edit({ embeds: [expiredEmbed], components: [] });
                    await giveaways[giveawayId].host.send(`Your giveaway for **${gameName}** has expired. No one claimed the code.`);
                } catch (err) {
                    console.error('Failed to notify host:', err);
                }
                delete giveaways[giveawayId];
            }
        }, timeInMs);

        await message.delete(); // Delete the original message even after successful hosting
    }



    // View all active giveaways
    if (message.content.startsWith('!list')) {
        const activeGiveaways = Object.entries(giveaways)
            .filter(([_, giveaway]) => !giveaway.claimed)
            .map(([id, giveaway], index) => {
                const timeLeft = Math.max(0, giveaway.endsAt - Date.now());
                const timeString = formatTime(timeLeft);
                return `${index + 1}. ${giveaway.gameName} [${giveaway.platform}] | ${giveaway.host.tag} | ⏰ ${timeString}`;
            });

        if (activeGiveaways.length === 0) {
            return message.reply('There are no active giveaways at the moment.');
        }

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('Active Giveaways')
            .setDescription(activeGiveaways.join('\n'));

        await message.reply({ embeds: [embed] });
    }

    // Remove a giveaway
    if (message.content.startsWith('!remove')) {
        const index = parseInt(args[1]);
        if (isNaN(index)) return message.reply('Please provide a valid giveaway number.');

        const giveawayEntries = Object.entries(giveaways).filter(([_, g]) => !g.claimed);
        const [id, giveaway] = giveawayEntries[index - 1] || [];

        if (!id) return message.reply('Giveaway not found.');
        if (giveaway.host.id !== message.author.id) return message.reply('You can only remove your own giveaways.');

        clearTimeout(giveaway.timeout);

        const removedEmbed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle(`Game Giveaway: ${giveaway.gameName}`)
            .setDescription(`This giveaway was manually ended by the host.`);

        try {
            const channel = await client.channels.fetch(message.channelId);
            const msg = await channel.messages.fetch(giveaway.messageId);
            await msg.edit({ embeds: [removedEmbed], components: [] });
        } catch (err) {
            console.error('Failed to update giveaway message:', err);
        }

        delete giveaways[id];
        message.reply(`✅ Giveaway #${index} has been removed.`);
    }

    // End a giveaway early
    if (message.content.startsWith('!end')) {
        const index = parseInt(args[1]);
        if (isNaN(index)) return message.reply('Please provide a valid giveaway number.');

        const giveawayEntries = Object.entries(giveaways).filter(([_, g]) => !g.claimed);
        const [id, giveaway] = giveawayEntries[index - 1] || [];

        if (!id) return message.reply('Giveaway not found.');
        if (giveaway.host.id !== message.author.id) return message.reply('You can only end your own giveaways.');

        clearTimeout(giveaway.timeout);

        const expiredEmbed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle(`Game Giveaway: ${giveaway.gameName}`)
            .setDescription(`${giveaway.gameName}'s code was manually ended by the host.`);

        try {
            const channel = await client.channels.fetch(message.channelId);
            const msg = await channel.messages.fetch(giveaway.messageId);
            await msg.edit({ embeds: [expiredEmbed], components: [] });
        } catch (err) {
            console.error('Failed to update giveaway message:', err);
        }

        await message.reply(`✅ Giveaway #${index} has been ended.`);
        delete giveaways[id];
    }

    // Help command
    if (message.content.startsWith('!help')) {
        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('Available Commands')
            .setDescription('Here are the available commands for this bot:')
            .addFields(
                { name: '!host <game name> <code> <platform> [days hours minutes seconds]', value: 'Host a giveaway. Time is optional (defaults to 1 day).' },
                { name: '!list', value: 'Shows a list of all active giveaways.' },
                { name: '!remove <number>', value: 'Remove a giveaway you hosted using its number from the list.' },
                { name: '!end <number>', value: 'End a giveaway early that you hosted.' },
                { name: '!help', value: 'Displays this help message.' },
                { name: '!history', value: 'Displays the history of all past giveaways and their winners.' }
            );

        await message.reply({ embeds: [embed] });
    }

    // History command for everyone to see past winners
    if (message.content.startsWith('!history')) {
        if (prizeHistory.length === 0) {
            return message.reply('No giveaways have ended yet.');
        }

        // Calculate total pages
        const totalPages = Math.ceil(prizeHistory.length / entriesPerPage);

        // Get the entries for the current page
        const startIdx = (currentPage - 1) * entriesPerPage;
        const endIdx = currentPage * entriesPerPage;
        const entriesToShow = prizeHistory.slice(startIdx, endIdx);

        const historyEmbed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('Giveaway Prizes History')
            .setDescription('Here are the past giveaways and their winners:')
            .addFields(
                ...entriesToShow.map((entry, index) => ({
                    name: `${startIdx + index + 1}. ${entry.gameName} [${entry.platform}]`,
                    value: `Winner: ${entry.winner}\nHost: ${entry.host}`,
                    inline: false
                }))
            )
            .setFooter({ text: `Page ${currentPage} of ${totalPages}` });

        // Create pagination buttons
        const row = new ActionRowBuilder();

        // Previous button
        if (currentPage > 1) {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId('prev_page')
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Primary)
            );
        }

        // Next button
        if (currentPage < totalPages) {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId('next_page')
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Primary)
            );
        }

        const historyMessage = await message.reply({ embeds: [historyEmbed], components: [row] });

        // Handle button interactions for pagination
        const filter = i => i.user.id === message.author.id; // Only allow the command author to interact
        const collector = historyMessage.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'prev_page' && currentPage > 1) {
                currentPage--;
            } else if (interaction.customId === 'next_page' && currentPage < totalPages) {
                currentPage++;
            }

            // Recreate the embed with updated page number and content
            const updatedEmbed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('Giveaway Prizes History')
                .setDescription('Here are the past giveaways and their winners:')
                .addFields(
                    ...prizeHistory.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage).map((entry, index) => ({
                        name: `${(currentPage - 1) * entriesPerPage + index + 1}. ${entry.gameName} [${entry.platform}]`,
                        value: `Winner: **${entry.winner}**`,  // Bold winner name
                        inline: false
                    }))
                )
                .setFooter({ text: `Page ${currentPage} of ${totalPages}` });

            // Update the message with the new embed and buttons
            await interaction.update({ embeds: [updatedEmbed], components: [row] });
        });

        collector.on('end', async () => {
            // Disable the buttons after timeout
            await historyMessage.edit({ components: [] });
        });
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    const giveawayId = interaction.customId.split('_').slice(2).join('_');

    if (!giveaways[giveawayId]) return;

    const giveaway = giveaways[giveawayId];

    if (giveaway.claimed) {
        if (!interaction.replied) {
            await interaction.reply({
                content: '❌ This key has already been claimed!',
                flags: 64 // flags: 64 makes it ephemeral
            });
        }
        return;
    }

    try {
        await interaction.user.send(`🎉 You've claimed **${giveaway.gameName}** on **${giveaway.platform}**!\nHere’s your key: **${giveaway.code}**`);
        await giveaway.host.send(`✅ **${interaction.user.tag}** has claimed the giveaway for **${giveaway.gameName}**.`);
    } catch (err) {
        if (err instanceof DiscordAPIError && err.code === 50007) {
            // User has DMs closed — notify them privately (ephemeral), do not log error
            await interaction.reply({
                content: '⚠️ I couldn’t DM you the key. Please enable DMs and try again.',
                flags: 64
            });
        } else {
            console.error('Unexpected error when trying to send DM:', err);
        }
        return;
    }

    // ✅ DM worked — proceed with ending the giveaway
    giveaway.claimed = true;
    clearTimeout(giveaway.timeout);

    const claimedEmbed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`Game Giveaway: ${giveaway.gameName}`)
        .setDescription(`Hosted by: ${giveaway.host.tag}\nPlatform: ${giveaway.platform}`)
        .addFields({
            name: 'Claimed by:',
            value: `${interaction.user.tag}`,
            inline: true
        })
        .setFooter({ text: 'The giveaway has ended!' });

    try {
        await interaction.message.edit({ embeds: [claimedEmbed], components: [] });
    } catch (err) {
        console.error('Failed to update giveaway message:', err);
    }

    if (interaction.user.id !== giveaway.host.id) {
        prizeHistory.push({
            gameName: giveaway.gameName,
            platform: giveaway.platform,
            winner: interaction.user.tag,
            host: giveaway.host.tag,
        });
    }

    delete giveaways[giveawayId];
});

client.login(process.env.token);
