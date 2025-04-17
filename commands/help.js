import { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "help",
  execute(message) {
    const embed = new EmbedBuilder()
      .setTitle("🎯 Giveaway Bot Commands")
      .setColor("Purple")
      .setDescription(
        [ "`!timer <hours> <minutes> <seconds>` - Set a timer to drop claimed codes after a set time",
          "`!host <GameName> <Code> <Platform>` - Host a new giveaway with a game code",
          "`!setdropchannel <channel> - Set channel as drop channel (admin only)",
          "`!setlogchannel` <channel> - Set current channel as the log channel (admin only)",
          "Claimed codes will be posted in the log channel.",
          "`!help` - Show this help message",
        ].join("\n")
      );
    return message.reply({ embeds: [embed] });
  },
};
