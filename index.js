const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder
} = require('discord.js');

// Removed the token from config.json
// const { token } = require('./config.json'); 
const { keepAlive } = require('./keep_alive.js'); 

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const giveaways = {};

client.once('ready', () => {
    console.log(${client.user.tag} is now online!);
});

// Auto-leave unauthorized servers

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // !host <game name> <code> <platform> [days hours minutes seconds]
    if (message.content.startsWith('!host')) {
        const args = message.content.trim().split(/\s+/);

        if (args.length < 4) {
            return message.reply('Usage: !host <game name> <code> <platform> [days hours minutes seconds]');
        }

        const timeArgs = args.slice(-4).every(arg => /^\d+$/.test(arg)) ? args.slice(-4) : ['1', '0', '0', '0'];
        const [days, hours, minutes, seconds] = timeArgs.map(Number);
        const timeInMs = ((days * 24 * 60 * 60) + (hours * 60 * 60) + (minutes * 60) + seconds) * 1000;

        const baseArgs = timeArgs === ['1', '0', '0', '0'] ? args : args.slice(0, -4);

        const platform = baseArgs[baseArgs.length - 1];
        const code = baseArgs[baseArgs.length - 2];
        const gameName = baseArgs.slice(1, baseArgs.length - 2).join(' ');

        const giveawayId = ${gameName}-${Date.now()};

        giveaways[giveawayId] = {
            host: message.author,
            gameName,
            code,
            platform,
            claimed: false,
            messageId: null,
            timeout: null
        };

        const claimButton = new ButtonBuilder()
            .setCustomId(claim_button_${giveawayId})
            .setLabel('Claim Key')
            .setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder().addComponents(claimButton);

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(Game Giveaway: ${gameName})
            .setDescription(Hosted by: ${message.author.tag}\nPlatform: ${platform})
            .setFooter({ text: 'Click the button to claim the key!' });

        const giveawayMessage = await message.channel.send({ embeds: [embed], components: [row] });

        giveaways[giveawayId].messageId = giveawayMessage.id;

        giveaways[giveawayId].timeout = setTimeout(async () => {
            if (!giveaways[giveawayId].claimed) {
                const expiredEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle(Game Giveaway: ${gameName})
                    .setDescription(${gameName}'s code has expired. No one claimed it in time.);

                try {
                    await giveawayMessage.edit({ embeds: [expiredEmbed], components: [] });
                    await giveaways[giveawayId].host.send(Your giveaway for **${gameName}** has expired. No one claimed the code.);
                } catch (err) {
                    console.error('Failed to notify host:', err);
                }
                delete giveaways[giveawayId];
            }
        }, timeInMs);

        await message.delete();
    }

    // !list - Shows active giveaways
    if (message.content.startsWith('!list')) {
        const activeGiveaways = Object.values(giveaways)
            .filter(giveaway => !giveaway.claimed)
            .map(giveaway => **${giveaway.gameName}** hosted by ${giveaway.host.tag} [Platform: ${giveaway.platform}]);

        if (activeGiveaways.length === 0) {
            return message.reply('There are no active giveaways at the moment.');
        }

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('Active Giveaways')
            .setDescription(activeGiveaways.join('\n'));

        await message.reply({ embeds: [embed] });
    }

    if (message.content.startsWith('!help')) {
        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('Available Commands')
            .setDescription('Here are the available commands for this bot:')
            .addFields(
                { name: '!help', value: 'Displays this help message.' },
                { name: '!host <game name> <code> <platform> [days hours minutes seconds]', value: 'Host a giveaway. Time is optional (defaults to 1 day).' },
                { name: '!list', value: 'Shows a list of all active giveaways.' }
            );

        await message.reply({ embeds: [embed] });
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    const giveawayId = interaction.customId.split('_').slice(2).join('_');

    if (!giveaways[giveawayId]) return;

    const giveaway = giveaways[giveawayId];

    if (giveaway.claimed) {
        if (!interaction.replied) {
            await interaction.reply({ content: 'This key has already been claimed!', ephemeral: true });
        }
    } else {
        giveaway.claimed = true;
        clearTimeout(giveaway.timeout);

        try {
            await interaction.user.send(🎉 You've claimed **${giveaway.gameName}** on **${giveaway.platform}**!\nHere’s your key: **${giveaway.code}**);
        } catch (err) {
            console.error('Failed to send DM:', err);
        }

        const claimedEmbed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(Game Giveaway: ${giveaway.gameName})
            .setDescription(Hosted by: ${giveaway.host.tag}\nPlatform: ${giveaway.platform})
            .addFields({
                name: 'Claimed by:',
                value: ${interaction.user.tag},
                inline: true
            })
            .setFooter({ text: 'The giveaway has ended!' });

        await interaction.update({ embeds: [claimedEmbed], components: [] });

        if (!interaction.replied) {
            await interaction.followUp({ content: 'You have successfully claimed the key!', ephemeral: true });
        }

        delete giveaways[giveawayId];
    }
});

client.login(process.env.token);
