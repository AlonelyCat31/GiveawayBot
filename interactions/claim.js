const { EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = async function handleClaim(interaction, gameCodes) {
  const [action, type, gameName] = interaction.customId.split("_");
  
  // Check if the action is valid
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

    // Store claim for delayed logging
    const claimedPath = path.join(__dirname, "../claimedCodes.json");
    const claimedCodes = fs.existsSync(claimedPath)
      ? JSON.parse(fs.readFileSync(claimedPath))
      : {};

    claimedCodes[gameName] = {
      code,
      claimedBy: interaction.user.tag,
      claimedAt: new Date().toISOString(),
      type: type === "host" ? "hosted" : "added", // Track the type of claim
    };

    fs.writeFileSync(claimedPath, JSON.stringify(claimedCodes, null, 2));

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
