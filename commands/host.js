const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
  name: "host",
  execute(message, args) {
    // Check if the correct number of arguments is provided
    if (args.length < 3) {
      return message.reply("Usage: `!host <GameName> <Code> <Platform>`");
    }

    const [gameName, ...codeParts] = args;
    const code = codeParts.slice(0, -1).join(" "); // All but the last part
    const platform = codeParts[codeParts.length - 1]; // Last part is the platform

    // Create the embed message
    const embed = new EmbedBuilder()
      .setTitle(`🎮 New Game Code Hosted!`)
      .setDescription(`**Hosted by:** ${message.author.tag}\n**Game Name:** ${gameName}\n**Platform:** ${platform}\n\nClick the button below to claim this code!`)
      .setColor("Blue");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`claim_host_${gameName}`)
        .setLabel("Claim Code")
        .setStyle(ButtonStyle.Success)
    );

    // Send the embed message with the claim button
    return message.channel.send({ embeds: [embed], components: [row] });
  },
};
