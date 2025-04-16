const fs = require("fs");
const path = require("path");

module.exports = {
  name: "setlogchannel",
  execute(message) {
    if (!message.member.permissions.has("Administrator")) {
      return message.reply("Only administrators can use this command.");
    }

    const configPath = path.join(__dirname, "../logchannel.json");
    fs.writeFileSync(configPath, JSON.stringify({ channelId: message.channel.id }, null, 2));

    message.reply(`✅ Log channel has been set to: ${message.channel}`);
  },
};
