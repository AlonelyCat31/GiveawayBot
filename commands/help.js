const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "help",
  execute(message) {
    const embed = new EmbedBuilder()
      .setTitle("🎯 Giveaway Bot Commands")
      .setColor("Purple")
      .setDescription(
        [
          "`!addcode <GameName> <Code>` - Add a new game code",
          "`!list` - List available games (no codes shown)",
          "`!drop <GameName>` - Drop a code for claiming",
          "`!help` - Show this help message",
        ].join("\n")
      );
    return message.reply({ embeds: [embed] });
  },
};
