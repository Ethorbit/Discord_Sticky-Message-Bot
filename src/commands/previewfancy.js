// Add Fancy command
const BotFunctions = require("../bot_functions.js");

function Run(client, msg)
{  
    BotFunctions.GetFancyMessagePropertiesFromUser(msg, (hex_color, title, message) => {
        BotFunctions.SendStickyMessage(msg.channel, {
            "is_embed": true,
            "hex_color": hex_color,
            "title": title,
            "message": message
        });
    });
}

module.exports = {Run};