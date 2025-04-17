const fs = require("fs");
const path = require("path");

module.exports = {
  name: "setdropchannel",
  async execute(message, args) {
    if (!message.member.permissions.has("Administrator")) {
      return message.reply("❌ You need to be an administrator to use this command.");
    }

    const mentionedChannel = message.mentions.channels.first();
    if (!mentionedChannel) {
      return message.reply("Please tag a channel like this: `!setdropchannel #channel`");
    }

    const configPath = path.join(__dirname, "../config.json");
    const config = fs.existsSync(configPath)
      ? JSON.parse(fs.readFileSync(configPath))
      : {};

    config.claimedDropChannelId = mentionedChannel.id;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    return message.reply(`✅ Drop channel set to <#${mentionedChannel.id}>`);
  },
};
