const fs = require("fs");
const path = require("path");

module.exports = {
  name: "setlogchannel",
  execute(message, args) {
    if (!message.member.permissions.has("Administrator")) {
      return message.reply("Only administrators can use this command.");
    }

    // Check if a channel ID or mention is provided
    const channelId = args[0]?.replace(/[<@!>]/g, ""); // Remove <#>, @, or ! from mention
    const channel = message.guild.channels.cache.get(channelId) || message.mentions.channels.first();

    if (!channel) {
      return message.reply("Please specify a valid channel by mentioning it or providing the channel ID.");
    }

    const configPath = path.join(__dirname, "../logchannel.json");
    fs.writeFileSync(configPath, JSON.stringify({ channelId: channel.id }, null, 2));

    message.reply(`✅ Log channel has been set to: ${channel}`);
  },
};
