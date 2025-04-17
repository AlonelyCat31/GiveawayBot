const fs = require("fs");
const path = require("path");

module.exports = {
  name: "timer",
  execute(message, args) {
    if (!message.member.permissions.has("Administrator")) {
      return message.reply("❌ Only administrators can set the drop timer.");
    }

    const [h, m, s] = args.map(Number);
    if (isNaN(h) || isNaN(m) || isNaN(s)) {
      return message.reply("Usage: `!timer <hours> <minutes> <seconds>`");
    }

    const configPath = path.join(__dirname, "../config.json");
    const config = JSON.parse(fs.readFileSync(configPath));

    config.dropDelay = { hours: h, minutes: m, seconds: s };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    message.reply(`⏳ Drop delay set to ${h}h ${m}m ${s}s`);
  },
};
