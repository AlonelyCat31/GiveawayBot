const fs = require("fs");
const path = require("path");

module.exports = {
  name: "setuprole",
  execute(message, args) {
    if (!message.member.permissions.has("Administrator")) {
      return message.reply("Only administrators can use this command.");
    }

    if (args.length === 0) {
      return message.reply("Usage: `!setuprole <RoleName>`");
    }

    const roleName = args.join(" ");
    const role = message.guild.roles.cache.find(r => r.name === roleName);

    if (!role) {
      return message.reply(`Role "${roleName}" not found.`);
    }

    const rolesPath = path.join(__dirname, "../logs/roles.json");
    const roles = fs.existsSync(rolesPath) ? require(rolesPath) : {};
    roles[role.name] = role.id;

    fs.writeFileSync(rolesPath, JSON.stringify(roles, null, 2));
    return message.reply(`Role "${roleName}" is now authorized to use bot commands.`);
  },
};
