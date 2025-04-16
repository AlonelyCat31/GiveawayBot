const fs = require("fs");
const path = require("path");

module.exports = {
  name: "setlogchannel",
  execute(message) {
    // Check if the user has Administrator permissions
    if (!message.member.permissions.has("Administrator")) {
      return message.reply("Only administrators can use this command.");
    }

    // Get the mentioned channel from the message
    const channel = message.mentions.channels.first();

    // If no channel is mentioned, reply with an error
    if (!channel) {
      return message.reply("Please mention a valid channel to set as the log channel.");
    }

    // Save the channel ID to the logchannel.json file
    const configPath = path.join(__dirname, "../logchannel.json");

    // Write the channel ID to the file
    fs.writeFileSync(configPath, JSON.stringify({ channelId: channel.id }, null, 2));

    // Confirm the channel has been set
    message.reply(`✅ Log channel has been set to: ${channel}`);
  },
};
