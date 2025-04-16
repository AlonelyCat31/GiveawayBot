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
