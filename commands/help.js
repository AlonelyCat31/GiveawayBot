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
          "`!setlogchannel <#channel>` - Set log channel for claimed codes (admin only)",
          "`!timer <hours> <minutes> <seconds>` - Set how long after a code is claimed it should be posted (authorized roles only)",
          "`!host <GameName> <Code> <Platform>` - Let users host their own giveaways with code and platform details",
          "`!help` - Show this help message",
        ].join("\n")
      );
    return message.reply({ embeds: [embed] });
  },
};
