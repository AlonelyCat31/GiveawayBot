const fs = require('fs');
const path = require('path');

const giveawaysFilePath = path.join(__dirname, 'giveaways.json');

// Load giveaways from the JSON file
function loadGiveaways() {
    try {
        const data = fs.readFileSync(giveawaysFilePath, 'utf8');
        const giveaways = JSON.parse(data);
        
        // Clean the giveaways by removing the timeout and other non-serializable properties
        for (const giveawayId in giveaways) {
            delete giveaways[giveawayId].timeout;
        }
        
        return giveaways;
    } catch (err) {
        console.error('Error loading giveaways:', err);
        return {};
    }
}

// Save giveaways to the JSON file
function saveGiveaways(giveaways) {
    try {
        // Create a copy of the giveaways object and remove the timeout property from each giveaway
        const sanitizedGiveaways = {};
        for (const [giveawayId, giveaway] of Object.entries(giveaways)) {
            sanitizedGiveaways[giveawayId] = { ...giveaway };
            delete sanitizedGiveaways[giveawayId].timeout; // Remove the timeout before saving
        }
        
        // Write the sanitized giveaways to the file
        fs.writeFileSync(giveawaysFilePath, JSON.stringify(sanitizedGiveaways, null, 2), 'utf8');
    } catch (err) {
        console.error('Error saving giveaways:', err);
    }
}

module.exports = { saveGiveaways, loadGiveaways };
