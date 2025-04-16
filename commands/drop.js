const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  name: "drop",
  execute(message, args, gameCodes) {
    const allowedRoles = require("../roles.json");
    const userRoles = message.member.roles.cache;
    if (!Object.values(allowedRoles).some(roleId => userRoles.has(roleId))) {
      return message.reply("You don't have permission to use this command.");
    }

    const gameName = args.join(" ");
    if (!gameName || !gameCodes[gameName]) {
      return message.reply("That game is not available.");
    }

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

    // Send the embed message with the claim button
    return message.channel.send({ embeds: [embed], components: [row] });
  },
};
