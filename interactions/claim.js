const { EmbedBuilder } = require("discord.js");

module.exports = async function handleClaim(interaction, gameCodes) {
  const [action, gameName] = interaction.customId.split("_");
  if (action !== "claim" || !gameCodes[gameName]) {
    return interaction.reply({
      content: "This code has already been claimed or is invalid.",
      ephemeral: true,
    });
  }

  const code = gameCodes[gameName];
  delete gameCodes[gameName];

  try {
    await interaction.user.send(
      `🎉 You claimed **${gameName}**!\nHere is your code: \`${code}\``
    );
    await interaction.update({
      embeds: [
        new EmbedBuilder()
          .setTitle(`🎉 ${gameName} Claimed!`)
          .setDescription(`Claimed by: **${interaction.user.tag}**`)
          .setColor("Red"),
      ],
      components: [],
    });
  } catch (err) {
    console.error("Failed to DM the user:", err);
    interaction.reply({
      content: "Failed to DM you the code. Do you have DMs disabled?",
      ephemeral: true,
    });
  }
};
