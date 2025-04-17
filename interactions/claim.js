import { EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = async function handleClaim(interaction, gameCodes) {
  const [action, gameName] = interaction.customId.split("_");
  const gameData = gameCodes[gameName];

  if (action !== "claim" || !gameData) {
    return interaction.reply({
      content: "This code has already been claimed or is invalid.",
      ephemeral: true,
    });
  }

  const { code, host } = gameData;
  delete gameCodes[gameName];

  try {
    await interaction.user.send(
      `🎉 You claimed **${gameName}**!\nHere is your code: \`${code}\`\nHosted by: **${host}**`
    );

    const claimedPath = path.join(__dirname, "../logs/claimedCodes.json");
    const claimedCodes = fs.existsSync(claimedPath)
      ? JSON.parse(fs.readFileSync(claimedPath))
      : {};

    claimedCodes[gameName] = {
      code,
      claimedBy: interaction.user.tag,
      claimedAt: new Date().toISOString(),
      hostedBy: host,
    };

    fs.writeFileSync(claimedPath, JSON.stringify(claimedCodes, null, 2));

    await interaction.update({
      embeds: [
        new EmbedBuilder()
          .setTitle(`🎉 ${gameName} Claimed!`)
          .setDescription(
            `Claimed by: **${interaction.user.tag}**\nHosted by: **${host}**`
          )
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

// Logging
try {
  const logData = JSON.parse(fs.readFileSync(path.join(__dirname, "../logChannel.json")));
  const logChannel = await interaction.guild.channels.fetch(logData.channelId);
  if (logChannel) {
    logChannel.send(
      `✅ **${gameName}** code claimed by ${interaction.user} (hosted by **${host}**)`
    );
  }
} catch (err) {
  console.error("Log channel not set or not found:", err);
}
