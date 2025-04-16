const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "help",
  execute(message) {
    const embed = new EmbedBuilder()
      .setTitle("🎯 Giveaway Bot Commands")
      .setColor("Purple")
      .setDescription(
        [
          "`!addcode <GameName> <Code>` - Add a new game code (authorized roles only)",
          "`!list` - List available games (authorized roles only)",
          "`!drop <GameName>` - Drop a code for claiming (authorized roles only)",
          "`!host <GameName> <Code> <Platform>` - Host a new giveaway with a game code",
          "`!setuprole <RoleName>` - Authorize a role to use code management commands (admin only)",
          "`!setlogchannel` - Set current channel as the log channel (admin only)",
          "Claimed codes will be posted in the log channel."
          "`!timer <hours> <minutes> <seconds>` - Set a timer to drop claimed codes after a set time",
          "`!help` - Show this help message",
        ].join("\n")
      );
    return message.reply({ embeds: [embed] });
  },
};
