const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  name: "drop",
  execute(message, args, gameCodes) {
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
        .setStyle(ButtonStyle.Success)
    );

    return message.channel.send({ embeds: [embed], components: [row] });
  },
};
