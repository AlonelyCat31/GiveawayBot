const fs = require("fs");
const path = require("path");

module.exports = {
  name: "settimer",
  execute(message, args) {
    if (!message.member.permissions.has("Administrator")) {
      return message.reply("Only administrators can use this command.");
    }

    if (args.length !== 1 || isNaN(args[0])) {
      return message.reply("Usage: `!settimer <hours>` - Set the timer for posting claimed codes in hours.");
    }

    const hours = parseInt(args[0], 10);
    if (hours <= 0) {
      return message.reply("Please provide a positive number of hours.");
    }

    const configPath = path.join(__dirname, "../timer.json");
    fs.writeFileSync(configPath, JSON.stringify({ timer: hours }, null, 2));

    message.reply(`✅ Timer has been set to ${hours} hour(s) for posting claimed codes.`);
  },
};
