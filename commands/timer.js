const { EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
  name: "timer",
  execute(message, args, gameCodes) {
    const allowedRoles = require("../roles.json");
    const userRoles = message.member.roles.cache;
    if (!Object.values(allowedRoles).some(roleId => userRoles.has(roleId))) {
      return message.reply("You don't have permission to use this command.");
    }

    if (args.length !== 3) {
      return message.reply("Usage: `!timer <hours> <minutes> <seconds>`");
    }

    const [hours, minutes, seconds] = args.map(arg => parseInt(arg));

    // Validate input
    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
      return message.reply("Please provide valid numbers for hours, minutes, and seconds.");
    }

    // Calculate the total delay time in milliseconds
    const delay = (hours * 60 * 60 * 1000) + (minutes * 60 * 1000) + (seconds * 1000);
    if (delay <= 0) {
      return message.reply("The timer must be a positive duration.");
    }

    // Store the timer duration for later use
    const timerDataPath = path.join(__dirname, "../timerData.json");
    const timerData = {
      delay,
      setBy: message.author.tag,
      timestamp: Date.now(),
    };

    fs.writeFileSync(timerDataPath, JSON.stringify(timerData, null, 2));

    return message.reply(`Timer set for ${hours} hours, ${minutes} minutes, and ${seconds} seconds. Claimed codes will be logged after the set duration.`);
  },

  // This function is meant to be called periodically (e.g., every minute) to check for expired timers
  checkTimers(client) {
    const timerDataPath = path.join(__dirname, "../timerData.json");
    if (!fs.existsSync(timerDataPath)) return;

    const timerData = require(timerDataPath);
    const now = Date.now();
    const elapsed = now - timerData.timestamp;

    if (elapsed >= timerData.delay) {
      // Timer has expired, log the claimed codes
      const claimedPath = path.join(__dirname, "../claimedCodes.json");
      const logConfigPath = path.join(__dirname, "../logchannel.json");

      if (!fs.existsSync(claimedPath) || !fs.existsSync(logConfigPath)) return;

      const claimed = JSON.parse(fs.readFileSync(claimedPath));
      const { channelId } = JSON.parse(fs.readFileSync(logConfigPath));
      const channel = client.channels.cache.get(channelId);

      if (!channel) return;

      Object.entries(claimed).forEach(([game, info]) => {
        channel.send(
          `🕓 **${game}** was claimed by **${info.claimedBy}** at ${new Date(info.claimedAt).toLocaleString()}. Code: \`${info.code}\``
        );
      });

      // Reset timer after posting the claimed codes
      fs.unlinkSync(timerDataPath);
    }
  }
};
