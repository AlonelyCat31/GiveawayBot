const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "list",
  execute(message, args, gameCodes) {
    if (Object.keys(gameCodes).length === 0)
      return message.reply("No games currently available.");
    const embed = new EmbedBuilder()
      .setTitle("Available Games")
      .setColor("Blue")
      .setDescription(
        Object.keys(gameCodes)
          .map((g, i) => `${i + 1}. **${g}**`)
          .join("\n")
      );
    return message.reply({ embeds: [embed] });
  },
};
