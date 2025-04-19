// Override process.stderr.write to filter out the ephemeral deprecation warning
const originalStderrWrite = process.stderr.write;
process.stderr.write = function (chunk, encoding, callback) {
    if (typeof chunk === 'string' && chunk.includes('Supplying "ephemeral" for interaction response options is deprecated')) {
        return true; // Skip writing the warning to stderr
    }
    return originalStderrWrite.apply(process.stderr, arguments); // Write other messages
};

const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    Partials,
    InteractionType
} = require('discord.js');
const { DiscordAPIError } = require('discord.js');

// Suppress specific deprecated warnings
process.on('warning', (warning) => {
    if (warning.name === 'DeprecationWarning' && warning.message.includes('Supplying "ephemeral" for interaction response options is deprecated')) {
        return; // Ignore the specific ephemeral deprecation warning
    }
    console.warn(warning); // Log other warnings
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel]
});

const giveaways = {};
const prizeHistory = [];
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

    // Host a giveaway via button and modal
    if (message.content.startsWith('!host')) {
        const button = new ButtonBuilder()
            .setCustomId(`open_giveaway_modal_${message.id}`)
            .setLabel('🎁 Host a Giveaway')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(button);

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('Host a Giveaway')
            .setDescription('Click the button below to open the giveaway form!');

        // Send the embed and store the message ID for later deletion
        const hostMessage = await message.reply({ embeds: [embed], components: [row] });
        giveaways[`host_${message.id}`] = { hostMessageId: hostMessage.id, userMessageId: message.id };

        // Add a collector to expire the embed after 60 seconds if no interaction
        const filter = i => i.customId === `open_giveaway_modal_${message.id}` && i.user.id === message.author.id;
        const collector = hostMessage.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('end', async (collected) => {
            if (collected.size === 0) {
                try {
                    const channel = await client.channels.fetch(message.channelId);
                    await channel.messages.delete(hostMessage.id);
                    await channel.messages.delete(message.id);
                    delete giveaways[`host_${message.id}`];
                } catch (err) {
                    console.error('Failed to delete expired host messages:', err);
                }
            }
        });
    }

    // View all active giveaways
    if (message.content.startsWith('!list')) {
        const activeGiveaways = Object.entries(giveaways)
            .filter(([id, giveaway]) => !id.startsWith('host_') && !giveaway.claimed)
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

        const giveawayEntries = Object.entries(giveaways).filter(([id, g]) => !id.startsWith('host_') && !g.claimed);
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

        const giveawayEntries = Object.entries(giveaways).filter(([id, g]) => !id.startsWith('host_') && !g.claimed);
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
            .setTitle('Giveaway Bot Commands')
            .setDescription('Available commands:\n\n' +
                '**!host** - Opens a form to host a giveaway.\n' +
                '**!list** - Shows all active giveaways.\n' +
                '**!remove <number>** - Remove a giveaway you hosted.\n' +
                '**!end <number>** - End a giveaway early.\n' +
                '**!history** - View past giveaways and winners.')
            .setFooter({ text: 'Use !host to start a giveaway!' });

        await message.reply({ embeds: [embed] });
    }

    // History command
    if (message.content.startsWith('!history')) {
        if (prizeHistory.length === 0) {
            return message.reply('No giveaways have ended yet.');
        }

        const totalPages = Math.ceil(prizeHistory.length / entriesPerPage);
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
                    value: `Winner: **${entry.winner}**\nHost: ${entry.host}`,
                    inline: false
                }))
            )
            .setFooter({ text: `Page ${currentPage} of ${totalPages}` });

        const row = new ActionRowBuilder();
        if (currentPage > 1) {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId('prev_page')
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Primary)
            );
        }
        if (currentPage < totalPages) {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId('next_page')
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Primary)
            );
        }

        const historyMessage = await message.reply({ embeds: [historyEmbed], components: row.components.length ? [row] : [] });

        const filter = i => i.user.id === message.author.id;
        const collector = historyMessage.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'prev_page' && currentPage > 1) {
                currentPage--;
            } else if (interaction.customId === 'next_page' && currentPage < totalPages) {
                currentPage++;
            }

            const updatedEmbed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('Giveaway Prizes History')
                .setDescription('Here are the past giveaways and their winners:')
                .addFields(
                    ...prizeHistory.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage).map((entry, index) => ({
                        name: `${(currentPage - 1) * entriesPerPage + index + 1}. ${entry.gameName} [${entry.platform}]`,
                        value: `Winner: **${entry.winner}**\nHost: ${entry.host}`,
                        inline: false
                    }))
                )
                .setFooter({ text: `Page ${currentPage} of ${totalPages}` });

            const updatedRow = new ActionRowBuilder();
            if (currentPage > 1) {
                updatedRow.addComponents(
                    new ButtonBuilder()
                        .setCustomId('prev_page')
                        .setLabel('Previous')
                        .setStyle(ButtonStyle.Primary)
                );
            }
            if (currentPage < totalPages) {
                updatedRow.addComponents(
                    new ButtonBuilder()
                        .setCustomId('next_page')
                        .setLabel('Next')
                        .setStyle(ButtonStyle.Primary)
                );
            }

            try {
                await interaction.update({ embeds: [updatedEmbed], components: updatedRow.components.length ? [updatedRow] : [] });
            } catch (err) {
                if (err instanceof DiscordAPIError && err.code === 10062) {
                    return;
                }
                console.error('Failed to update history interaction:', err);
            }
        });

        collector.on('end', async () => {
            try {
                await historyMessage.edit({ components: [] });
            } catch (err) {
                console.error('Failed to disable history buttons:', err);
            }
        });
    }
});

client.on('interactionCreate', async (interaction) => {
    // Modal button for giveaway creation
    if (interaction.isButton() && interaction.customId.startsWith('open_giveaway_modal_')) {
        const messageId = interaction.customId.split('_').pop();
        const modal = new ModalBuilder()
            .setCustomId(`giveaway_form_${messageId}`)
            .setTitle('Host a Giveaway');

        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('gameName')
                    .setLabel('Game Name')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('code')
                    .setLabel('Key / Code')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('platform')
                    .setLabel('Platform (Steam, Epic, etc)')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('optionalFields')
                    .setLabel('Optional: Duration, Expiry Date, Region Locks')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('e.g.\nDuration: 1d 2h 30m\nExpiry: 2025-12-31\nRegion: NA, EU\n(Short forms: Dur:, Exp:, Reg:)')
                    .setRequired(false)
            )
        );

        try {
            await interaction.showModal(modal);
        } catch (err) {
            if (err instanceof DiscordAPIError && err.code === 10062) {
                return;
            }
            console.error('Failed to show modal:', err);
        }
    }

    // Handle modal submission
    if (interaction.type === InteractionType.ModalSubmit && interaction.customId.startsWith('giveaway_form_')) {
        const messageId = interaction.customId.split('_').pop();
        const hostData = giveaways[`host_${messageId}`];
        if (!hostData) {
            try {
                return interaction.reply({ content: '❌ Host data not found.', ephemeral: true });
            } catch (err) {
                if (err instanceof DiscordAPIError && err.code === 10062) {
                    return;
                }
                console.error('Failed to send host data error reply:', err);
            }
            return;
        }

        const gameName = interaction.fields.getTextInputValue('gameName');
        const code = interaction.fields.getTextInputValue('code');
        const platform = interaction.fields.getTextInputValue('platform');
        const optionalFields = interaction.fields.getTextInputValue('optionalFields') || '';

        // Parse optional fields with flexible formats
        let durationInput = '';
        let expiryDate = 'Never';
        let regionLocks = 'Global';

        const lines = optionalFields.split('\n').map(line => line.trim());
        const fieldRegex = /^(duration|dur|expiry date|expiry|exp|region locks|region|reg)\s*:+\s*(.*)$/i;

        for (const line of lines) {
            const match = line.match(fieldRegex);
            if (match) {
                const field = match[1].toLowerCase();
                const value = match[2].trim() || '';

                if (['duration', 'dur'].includes(field)) {
                    durationInput = value;
                } else if (['expiry date', 'expiry', 'exp'].includes(field)) {
                    expiryDate = value || 'Never';
                } else if (['region locks', 'region', 'reg'].includes(field)) {
                    regionLocks = value || 'Global';
                }
            }
        }

        if (Object.values(giveaways).some(g => !g.hostMessageId && g.code === code)) {
            try {
                return interaction.reply({ content: '❌ This code is already used in another giveaway.', ephemeral: true });
            } catch (err) {
                if (err instanceof DiscordAPIError && err.code === 10062) {
                    return;
                }
                console.error('Failed to send duplicate code error reply:', err);
            }
            return;
        }

        let timeInMs = 86400000; // Default 1 day
        if (durationInput) {
            const regex = /(?:(\d+)d)?\s*(?:(\d+)h)?\s*(?:(\d+)m)?/;
            const match = durationInput.match(regex);
            if (match) {
                const [, d = 0, h = 0, m = 0] = match.map(n => parseInt(n) || 0);
                timeInMs = ((d * 24 + h) * 60 + m) * 60 * 1000;
            }
        }

        const giveawayId = `${gameName}-${Date.now()}`;
        const endsAt = Date.now() + timeInMs;

        const claimButton = new ButtonBuilder()
            .setCustomId(`claim_button_${giveawayId}`)
            .setLabel('Claim Key')
            .setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder().addComponents(claimButton);

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(`Game Giveaway: ${gameName}`)
            .setDescription(`Hosted by: ${interaction.user.tag}\n` +
                            `Platform: ${platform}\n` +
                            `Expiry Date: ${expiryDate}\n` +
                            `Region Locks: ${regionLocks}`)
            .setFooter({ text: 'Click the button to claim the key!' });

        const giveawayMessage = await interaction.channel.send({ embeds: [embed], components: [row] });

        giveaways[giveawayId] = {
            host: interaction.user,
            gameName,
            code,
            platform,
            expiryDate,
            regionLocks,
            claimed: false,
            messageId: giveawayMessage.id,
            timeout: null,
            endsAt
        };

        giveaways[giveawayId].timeout = setTimeout(async () => {
            if (!giveaways[giveawayId].claimed) {
                const expiredEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle(`Game Giveaway: ${gameName}`)
                    .setDescription(`This giveaway has expired. No one claimed the key.`);
                await giveawayMessage.edit({ embeds: [expiredEmbed], components: [] });
                delete giveaways[giveawayId];
            }
        }, timeInMs);

        // Delete the user's !host message and the bot's embed
        try {
            const channel = await client.channels.fetch(interaction.channelId);
            await channel.messages.delete(hostData.userMessageId);
            await channel.messages.delete(hostData.hostMessageId);
        } catch (err) {
            console.error('Failed to delete host messages:', err);
        }

        // Clean up host data
        delete giveaways[`host_${messageId}`];

        try {
            await interaction.reply({ content: '✅ Giveaway successfully created!', ephemeral: true });
        } catch (err) {
            if (err instanceof DiscordAPIError && err.code === 10062) {
                return;
            }
            console.error('Failed to send success reply:', err);
        }
    }

    // Handle claim button
    if (interaction.isButton() && interaction.customId.startsWith('claim_button_')) {
        const giveawayId = interaction.customId.replace('claim_button_', '');
        const giveaway = giveaways[giveawayId];

        if (!giveaway || giveaway.claimed) {
            try {
                return interaction.reply({ content: '❌ This key has already been claimed or does not exist.', ephemeral: true });
            } catch (err) {
                if (err instanceof DiscordAPIError && err.code === 10062) {
                    return;
                }
                console.error('Failed to send claim error reply:', err);
            }
            return;
        }

        try {
            await interaction.user.send(`🎉 You've claimed **${giveaway.gameName}** on **${giveaway.platform}**!\nHere’s your key: **${giveaway.code}**`);
            await giveaway.host.send(`✅ **${interaction.user.tag}** has claimed the giveaway for **${giveaway.gameName}**.`);
        } catch (err) {
            if (err instanceof DiscordAPIError && err.code === 50007) {
                try {
                    return interaction.reply({
                        content: '⚠️ I couldn’t DM you the key. Please enable DMs and try again.',
                        ephemeral: true
                    });
                } catch (replyErr) {
                    if (replyErr instanceof DiscordAPIError && replyErr.code === 10062) {
                        return;
                    }
                    console.error('Failed to send DM error reply:', replyErr);
                }
            } else {
                console.error('Unexpected error when trying to send DM:', err);
                try {
                    return interaction.reply({ content: '⚠️ An unexpected error occurred. Please try again.', ephemeral: true });
                } catch (replyErr) {
                    if (replyErr instanceof DiscordAPIError && replyErr.code === 10062) {
                        return;
                    }
                    console.error('Failed to send unexpected error reply:', replyErr);
                }
            }
            return;
        }

        giveaway.claimed = true;
        clearTimeout(giveaway.timeout);

        const claimedEmbed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(`Game Giveaway: ${giveaway.gameName}`)
            .setDescription(`Hosted by: ${giveaway.host.tag}\n` +
                            `Platform: ${giveaway.platform}\n` +
                            `Expiry Date: ${giveaway.expiryDate}\n` +
                            `Region Locks: ${giveaway.regionLocks}`)
            .addFields({ name: 'Claimed by', value: interaction.user.tag })
            .setFooter({ text: 'The giveaway has ended!' });

        try {
            const channel = await client.channels.fetch(interaction.channelId);
            const msg = await channel.messages.fetch(giveaway.messageId);
            await msg.edit({ embeds: [claimedEmbed], components: [] });
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
        try {
            await interaction.reply({ content: '🎉 You have successfully claimed the giveaway!', ephemeral: true });
        } catch (err) {
            if (err instanceof DiscordAPIError && err.code === 10062) {
                return;
            }
            console.error('Failed to send claim success reply:', err);
        }
    }
});

client.login(process.env.token);
