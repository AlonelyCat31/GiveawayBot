const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
  name: "host",
  execute(message, args, gameCodes) {
    const [gameName, ...codeParts] = args;
    const code = codeParts.join(" ");
    const platform = args[args.length - 1];

    if (!gameName || !code || !platform)
      return message.reply("Usage: `!host <GameName> <Code> <Platform>`");

    gameCodes[gameName] = code;
    const embed = new EmbedBuilder()
      .setTitle(`🎮 ${gameName} Code Hosted!`)
      .setDescription(
        `Hosted by: **${message.author.tag}**\nPlatform: **${platform}**\nClick the button below to claim this game code!`
      )
      .setColor("Blue");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`claim_${gameName}`)
        .setLabel("Claim")
        .setStyle(ButtonStyle.Primary)
    );

    return message.channel.send({ embeds: [embed], components: [row] });
  },
};
