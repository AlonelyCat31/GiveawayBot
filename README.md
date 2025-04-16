# Discord Giveaway Bot

This bot allows you to distribute game codes through giveaways.

## Features

- List available game codes
- Claim a game code by pressing a button
- Add new game codes manually by the bot owner

## Setup

1. Clone this repository.
2. Install dependencies:  
   `npm install`
3. Add your Discord bot token to the `.env` file:  
   `DISCORD_BOT_TOKEN=your-bot-token-here`
4. Run the bot:  
   `npm start`

## Commands

- `!giveaway` - Start a giveaway.
- `!list` - List the available game codes.
- `!addcode <game_name> <code>` - Add a new game code (bot owner only).
   