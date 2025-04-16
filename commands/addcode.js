module.exports = {
  name: "addcode",
  execute(message, args, gameCodes) {
    const allowedRoles = require("../roles.json");
    const userRoles = message.member.roles.cache;
    if (!Object.values(allowedRoles).some(roleId => userRoles.has(roleId))) {
      return message.reply("You don't have permission to use this command.");
    }

    const [gameName, ...codeParts] = args;
    const code = codeParts.join(" ");
    if (!gameName || !code)
      return message.reply("Usage: `!addcode <GameName> <Code>`");
    gameCodes[gameName] = code;
    return message.reply(`Code for **${gameName}** added.`);
  },
};
