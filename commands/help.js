const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "help",
  execute(message) {
    const embed = new EmbedBuilder()
      .setTitle("🎯 Giveaway Bot Commands")
      .setColor("Purple")
      .setDescription(
        [
          "`!host <GameName> <Code> <Platform>` - Host a new giveaway with a game code",
          "`!help` - Show this help message",
        ].join("\n")
      );
    return message.reply({ embeds: [embed] });
  },
};
