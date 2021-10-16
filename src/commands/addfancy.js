// Add Fancy command
const BotFunctions = require("../bot_functions.js");
const Errors = require("../errors.js");
const Colors = require("../colors.js");

function Run(client, msg)
{
    const msgParams = msg.content.toLowerCase().split(" ");
    const server_id = msg.guild.id;
    const channel_id = BotFunctions.GetMessageChannelID(msgParams[2]);

    client.channels.fetch(channel_id).then(channel => {
        if (channel.type != "text") 
            return BotFunctions.SimpleMessage(msg.channel, "The passed channel must be a text channel that you can post messages in.", "Incorrect channel type!", Colors["error"]);
        
        BotFunctions.GetFancyMessagePropertiesFromUser(msg, (hex_color, title, message) => {
            global.stickies.AddFancySticky(server_id, channel_id, title, message, hex_color, (val) => { 
                if (typeof(val) == "string")
                    return BotFunctions.SimpleMessage(msg.channel, val, "Error adding sticky!", Colors["error"]);

                if (val)
                {
                    BotFunctions.SimpleMessage(msg.channel, `
                        ID: ${val} 
                        Channel: ${channel.toString()}
                    `, "Created sticky!", "success",
                    () => {
                        BotFunctions.ShowChannelStickies(server_id, channel, null);
                    });
                }
                else
                    BotFunctions.SimpleMessage(msg.channel, "Unknown error, try again.", "Error adding sticky!", Colors["error"]);
            });
        });
    }).catch(error => {
        BotFunctions.SimpleMessage(msg.channel, Errors["invalid_channel"], "Error getting channel ID", Colors["error"]);
    });
}

module.exports = {Run};