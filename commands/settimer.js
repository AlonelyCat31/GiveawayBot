const fs = require("fs");
const path = require("path");

module.exports = {
  name: "settimer",
  execute(message, args) {
    if (!message.member.permissions.has("Administrator")) {
      return message.reply("Only administrators can use this command.");
    }

    if (args.length !== 3 || args.some(arg => isNaN(arg))) {
      return message.reply("Usage: `!settimer <hours> <minutes> <seconds>` - Set the timer for posting claimed codes.");
    }

    const hours = parseInt(args[0], 10);
    const minutes = parseInt(args[1], 10);
    const seconds = parseInt(args[2], 10);

    if (hours < 0 || minutes < 0 || seconds < 0) {
      return message.reply("Please provide non-negative values for hours, minutes, and seconds.");
    }

    const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;

    const configPath = path.join(__dirname, "../timer.json");
    fs.writeFileSync(configPath, JSON.stringify({ timer: totalSeconds }, null, 2));

    message.reply(`✅ Timer has been set to ${hours} hour(s), ${minutes} minute(s), and ${seconds} second(s) for posting claimed codes.`);
  },
};
