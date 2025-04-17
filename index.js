import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Client, GatewayIntentBits, Partials, Events } from 'discord.js';

dotenv.config();

// Replicating __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
  const command = await import(`./commands/${file}`).then(module => module.default);
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

client.on(Events.MessageCreate, async (message) => {
  if (!message.content.startsWith("!") || message.author.bot) return;

  const [cmd, ...args] = message.content.slice(1).split(" ");
  const commandFn = commands.get(cmd.toLowerCase());
  if (commandFn) {
    commandFn(message, args, gameCodes);
  }
});

const handleClaim = await import("./interactions/claim.js").then(module => module.default);

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;
  await handleClaim(interaction, gameCodes);
});
