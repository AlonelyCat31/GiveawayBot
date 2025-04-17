const { Client, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const giveaways = {};  // Object to store giveaways

client.once('ready', () => {
    console.log(`${client.user.tag} is now online!`);
});

client.on('messageCreate', async (message) => {
    // Ignore messages from bots
    if (message.author.bot) return;

    // Command to host a giveaway
    if (message.content.startsWith('!host')) {
        const args = message.content.split(' ');

        // Make sure there are at least 4 parts (command, game name, code, platform)
        if (args.length < 4) {
            return message.reply('Usage: !host <game name> <code> <platform>');
        }

        // Get the platform (last element) and the code (second to last)
        const platform = args[args.length - 1];
        const code = args[args.length - 2];
        
        // Everything before the last two arguments is the game name
        const gameName = args.slice(1, args.length - 2).join(' ');

        // Check if the giveaway already exists
        if (giveaways[gameName] && giveaways[gameName].claimed) {
            return message.reply(`The giveaway for ${gameName} has already been claimed!`);
        }

        // Create a button for claiming the game key
        const claimButton = new ButtonBuilder()
            .setCustomId('claim_button')
            .setLabel('Claim Key')
            .setStyle(ButtonStyle.Success);

        // Create an ActionRow to hold the button
        const row = new ActionRowBuilder().addComponents(claimButton);

        // Create an embed for the giveaway message
        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(`Game Giveaway: ${gameName}`)
            .setDescription(`Hosted by: ${message.author.tag}\nPlatform: ${platform}`)
            .setFooter({ text: 'Click the button to claim the key!' });

        // Send the embed with the claim button
        const giveawayMessage = await message.channel.send({ embeds: [embed], components: [row] });

        // Store giveaway details in the `giveaways` object
        giveaways[gameName] = {
            host: message.author.tag,
            code: code,
            platform: platform,
            claimed: false,
            messageId: giveawayMessage.id
        };

        // Delete the original command message
        await message.delete();
    }

    // Command to show help
    if (message.content.startsWith('!help')) {
        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('Available Commands')
            .setDescription('Here are the available commands for this bot:')
            .addFields(
                { name: '!help', value: 'Displays this help message with available commands.' },
                { name: '!host <game name> <code> <platform>', value: 'Host a giveaway for a game key. Example: `!host Fortnite 12345 PC`' },
                { name: '!claim', value: 'Claim a key (button interaction only, shown when available).' }
            )
            .setFooter({ text: 'For more information, type !help.' });

        await message.reply({ embeds: [embed] });
    }
});

// Interaction listener for the claim button
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    const gameName = Object.keys(giveaways).find((key) => giveaways[key].messageId === interaction.message.id);
    
    if (!gameName) return;

    const giveaway = giveaways[gameName];

    if (giveaway.claimed) {
        // If the key has already been claimed, inform the user
        if (!interaction.replied) {
            await interaction.reply({ content: 'This key has already been claimed!', ephemeral: true });
        }
    } else {
        // Mark the giveaway as claimed
        giveaway.claimed = true;

        // Send the game code to the user via DM
        try {
            await interaction.user.send(`Congratulations! You've claimed the key for **${gameName}** (${giveaway.platform}): **${giveaway.code}**`);
        } catch (error) {
            console.error('Could not send DM to user:', error);
        }

        // Update the giveaway message to show who claimed it
        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(`Game Giveaway: ${gameName}`)
            .setDescription(`Hosted by: ${giveaway.host}\nPlatform: ${giveaway.platform}`)
            .addFields({
                name: 'Claimed by:',
                value: `${interaction.user.tag}`,
                inline: true
            })
            .setFooter({ text: 'The giveaway has ended!' });

        // Use update() to modify the original message
        await interaction.update({ embeds: [embed], components: [] });

        // Optionally, send a confirmation message to the user
        if (!interaction.replied) {
            await interaction.followUp({ content: `You have successfully claimed the key for **${gameName}**!`, ephemeral: true });
        }
    }
});

// Log the bot in
client.login(process.env.token);
