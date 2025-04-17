const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config(); // Load environment variables
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent // ✅ Required to read message content
    ]
});

client.commands = new Map();

// Load commands
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));

const commands = {}; // Object to hold command descriptions

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
    commands[command.name] = { description: command.description }; // Store command descriptions
}

console.log('Loaded commands:', [...client.commands.keys()]); // ✅ Confirm commands are loaded

// Event: When the bot is ready
// Event: When the bot is ready
client.once('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}!`);
});
