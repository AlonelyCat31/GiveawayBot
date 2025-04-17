import fs = require("fs");
import path = require("path");

module.exports = {
  name: "setlogchannel",
  async execute(message, args) {
    if (!message.member.permissions.has("Administrator")) {
      return message.reply("❌ You need to be an administrator to use this command.");
    }

    const mentionedChannel = message.mentions.channels.first();
    const channelToSet = mentionedChannel || message.channel;

    const logPath = path.join(__dirname, "../logChannel.json");
    const data = { channelId: channelToSet.id };

    fs.writeFileSync(logPath, JSON.stringify(data, null, 2));
    return message.reply(`✅ Log channel set to <#${channelToSet.id}>`);
  },
};
