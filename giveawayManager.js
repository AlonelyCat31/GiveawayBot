const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'giveaways.json');

// Load giveaways from the file
function loadGiveaways() {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
    } catch (err) {
        console.error('Error loading giveaways:', err);
    }
    return {}; // Return an empty object if file doesn't exist or can't be read
}

// Save giveaways to the file
function saveGiveaways(giveaways) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(giveaways, null, 2), 'utf8');
    } catch (err) {
        console.error('Error saving giveaways:', err);
    }
}

module.exports = { saveGiveaways, loadGiveaways };
