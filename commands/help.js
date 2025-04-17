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
          "`!setuprole <RoleName>` - Authorize a role to use code management commands (admin only)",
          "`!setlogchannel` - Set current channel as the log channel (admin only)",
          "Claimed codes will be posted here 24 hours after being claimed.",
          "`!help` - Show this help message",
        ].join("\n")
      );
    return message.reply({ embeds: [embed] });
  },
};
