require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events,
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel],
});

console.log("Bot is starting...");

client.once(Events.ClientReady, () => {
  console.log(`${client.user.tag} is online and ready!`);
});

client.on("error", (err) => {
  console.error("An error occurred:", err);
});

client
  .login(process.env.token)
  .then(() => {
    console.log("Bot logged in successfully!");
  })
  .catch((error) => {
    console.error("Error logging in:", error);
  });

const gameCodes = {}; // { gameName: code }

client.on(Events.MessageCreate, async (message) => {
  if (!message.content.startsWith("!") || message.author.bot) return;

  const [cmd, ...args] = message.content.slice(1).split(" ");

  switch (cmd.toLowerCase()) {
    case "addcode": {
      const [gameName, ...codeParts] = args;
      const code = codeParts.join(" ");
      if (!gameName || !code)
        return message.reply("Usage: `!addcode <GameName> <Code>`");
      gameCodes[gameName] = code;
      return message.reply(`Code for **${gameName}** added.`);
    }

    case "list": {
      if (Object.keys(gameCodes).length === 0) {
        return message.reply("No games currently available.");
      }
      const embed = new EmbedBuilder()
        .setTitle("Available Games")
        .setColor("Blue")
        .setDescription(
          Object.keys(gameCodes)
            .map((g, i) => `${i + 1}. **${g}**`)
            .join("\n"),
        );
      return message.reply({ embeds: [embed] });
    }

    case "drop": {
      const gameName = args.join(" ");
      if (!gameName || !gameCodes[gameName])
        return message.reply("That game is not available.");

      const embed = new EmbedBuilder()
        .setTitle(`🎮 ${gameName} Code Drop!`)
        .setDescription("Click the button below to claim this game code!")
        .setColor("Green");

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`claim_${gameName}`)
          .setLabel("Claim")
          .setStyle(ButtonStyle.Success),
      );

      return message.channel.send({ embeds: [embed], components: [row] });
    }

    case "help": {
      const embed = new EmbedBuilder()
        .setTitle("🎯 Giveaway Bot Commands")
        .setColor("Purple")
        .setDescription(
          [
            "`!addcode <GameName> <Code>` - Add a new game code",
            "`!list` - List available games (no codes shown)",
            "`!drop <GameName>` - Drop a code for claiming",
            "`!help` - Show this help message",
          ].join("\n"),
        );
      return message.reply({ embeds: [embed] });
    }
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  const [action, gameName] = interaction.customId.split("_");
  if (action !== "claim" || !gameCodes[gameName]) {
    return interaction.reply({
      content: "This code has already been claimed or is invalid.",
      ephemeral: true,
    });
  }

  const code = gameCodes[gameName];
  delete gameCodes[gameName]; // remove it after claim

  try {
    await interaction.user.send(
      `🎉 You claimed **${gameName}**!\nHere is your code: \`${code}\``,
    );
    await interaction.update({
      embeds: [
        new EmbedBuilder()
          .setTitle(`🎉 ${gameName} Claimed!`)
          .setDescription(`Claimed by: **${interaction.user.tag}**`)
          .setColor("Red"),
      ],
      components: [],
    });
  } catch (err) {
    console.error("Failed to DM the user:", err);
    interaction.reply({
      content: "Failed to DM you the code. Do you have DMs disabled?",
      ephemeral: true,
    });
  }
});
