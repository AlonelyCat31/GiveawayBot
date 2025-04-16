require("dotenv").config();
const fs = require("fs");
const path = require("path");
const {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel],
});

const gameCodes = {};
const commands = new Map();

// Load commands dynamically
const commandFiles = fs.readdirSync(path.join(__dirname, "commands"));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.set(command.name, command.execute);
}

console.log("Bot is starting...");

client.once(Events.ClientReady, () => {
  console.log(`${client.user.tag} is online and ready!`);
});

client.on("error", (err) => {
  console.error("An error occurred:", err);
});

client.login(process.env.token).then(() => {
  console.log("Bot logged in successfully!");
}).catch(console.error);

// Handle message commands
client.on(Events.MessageCreate, async (message) => {
  if (!message.content.startsWith("!") || message.author.bot) return;

  const [cmd, ...args] = message.content.slice(1).split(" ");
  const commandFn = commands.get(cmd.toLowerCase());
  if (commandFn) {
    commandFn(message, args, gameCodes);
  }
});

// Handle interactions
const handleClaim = require("./interactions/claim.js");

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;
  await handleClaim(interaction, gameCodes);
});


// Background task: post claimed codes after the specified interval
setInterval(() => {
  const claimedPath = path.join(__dirname, "claimedCodes.json");
  const logConfigPath = path.join(__dirname, "logchannel.json");
  const timerConfigPath = path.join(__dirname, "timer.json");

  if (!fs.existsSync(claimedPath) || !fs.existsSync(logConfigPath)) return;

  const claimed = JSON.parse(fs.readFileSync(claimedPath));
  const { channelId } = JSON.parse(fs.readFileSync(logConfigPath));
  const channel = client.channels.cache.get(channelId);
  if (!channel) return;

  const now = Date.now();
  const timer = fs.existsSync(timerConfigPath) ? JSON.parse(fs.readFileSync(timerConfigPath)).timer : 24; // Default to 24 hours
  const intervalMs = timer * 60 * 60 * 1000; // Convert hours to milliseconds

  for (const [game, info] of Object.entries(claimed)) {
    const claimedAt = new Date(info.claimedAt).getTime();
    if (now - claimedAt >= intervalMs) {
      channel.send(`🕓 **${game}** was claimed by **${info.claimedBy}** at ${new Date(info.claimedAt).toLocaleString()}. Code: \`${info.code}\``);
      delete claimed[game];
    }
  }

  fs.writeFileSync(claimedPath, JSON.stringify(claimed, null, 2));
}, 60 * 60 * 1000); // Check every hour
