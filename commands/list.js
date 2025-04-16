const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "list",
  execute(message, args, gameCodes) {
    const allowedRoles = require("../roles.json");
    const userRoles = message.member.roles.cache;
    if (!Object.values(allowedRoles).some(roleId => userRoles.has(roleId))) {
      return message.reply("You don't have permission to use this command.");
    }

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
