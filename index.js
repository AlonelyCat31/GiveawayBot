require('dotenv').config();
const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel] // Required to receive DMs (even if we block command handling there)
});

const token = process.env.token;

// Store game codes in memory
let gameCodes = {};

client.once('ready', () => {
  console.log(`✅ Bot is online as ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.guild) {
    return interaction.reply({ content: 'Commands cannot be used in DMs.', ephemeral: true });
  }

  if (interaction.isChatInputCommand()) {
    const { commandName } = interaction;

    if (commandName === 'addcode') {
      const game = interaction.options.getString('game');
      const code = interaction.options.getString('code');

      if (!gameCodes[game]) {
        gameCodes[game] = [];
      }

      gameCodes[game].push(code);
      await interaction.reply(`✅ Code added for **${game}**.`);
    }

    if (commandName === 'list') {
      const embed = new EmbedBuilder()
        .setTitle('🎮 Available Games')
        .setDescription(Object.keys(gameCodes).length > 0 ? Object.keys(gameCodes).join('\n') : 'No games currently available.')
        .setColor('Blue');
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (commandName === 'giveaway') {
      const game = interaction.options.getString('game');

      if (!gameCodes[game] || gameCodes[game].length === 0) {
        return interaction.reply(`❌ No codes available for **${game}**.`);
      }

      const embed = new EmbedBuilder()
        .setTitle(`🎁 Code Giveaway: ${game}`)
        .setDescription(`Click the button below to claim a code for **${game}**!`)
        .setColor('Green');

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`claim_${game}`)
          .setLabel('Claim')
          .setStyle(ButtonStyle.Primary)
      );

      await interaction.reply({ embeds: [embed], components: [row] });
    }
  }

  if (interaction.isButton()) {
    const [action, game] = interaction.customId.split('_');
    if (action === 'claim') {
      if (!gameCodes[game] || gameCodes[game].length === 0) {
        return interaction.reply({ content: '❌ Sorry, all codes have been claimed.', ephemeral: true });
      }

      const code = gameCodes[game].shift();

      try {
        await interaction.user.send(`🎮 Here is your code for **${game}**: \`${code}\``);
        await interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle(`🎁 Code Claimed: ${game}`)
              .setDescription(`✅ Claimed by <@${interaction.user.id}>`)
              .setColor('Green')
          ],
          components: []
        });
      } catch (err) {
        await interaction.reply({ content: '❌ Unable to DM you. Please make sure your DMs are open.', ephemeral: true });
        gameCodes[game].unshift(code); // push it back if DM fails
      }
    }
  }
});

client.on(Events.MessageCreate, message => {
  if (!message.guild) return; // Ignore DMs
  if (message.content === '!ping') {
    message.reply('Pong!');
  }
});

client.login(token);
