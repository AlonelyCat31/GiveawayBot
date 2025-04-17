module.exports = {
    name: 'help',
    description: 'Lists all available commands.',
    execute(message, commands) {
        const commandList = Object.keys(commands)
            .map(cmd => `!${cmd} - ${commands[cmd].description}`)
            .join('\n');
        message.channel.send(`Available commands:\n${commandList}`);
    },
};