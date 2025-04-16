module.exports = {
  name: "addcode",
  execute(message, args, gameCodes) {
    const [gameName, ...codeParts] = args;
    const code = codeParts.join(" ");
    if (!gameName || !code)
      return message.reply("Usage: `!addcode <GameName> <Code>`");
    gameCodes[gameName] = code;
    return message.reply(`Code for **${gameName}** added.`);
  },
};
