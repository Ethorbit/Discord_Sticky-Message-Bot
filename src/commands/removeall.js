// Removeall command
const BotFunctions = require("../bot_functions.js");
const Errors = require("../messages/errors.js");
const Colors = require("../messages/colors.js");

function Run(client, msg)
{
    const msgParams = msg.content.toLowerCase().split(" ");
    const server_id = msg.guild.id;
    const channel_id = BotFunctions.GetMessageChannelID(msgParams[2]); 
    
    client.channels.fetch(channel_id).then(channel => {
        BotFunctions.SimpleMessage(msg.channel, `Please wait while I remove all stickies from: ${channel.toString()}`, "Processing", Colors["sticky"], (sentMessage) => {
            global.stickies.RemoveChannelStickies(server_id, channel_id, (val) => {
                if (typeof(val) == "string")
                        return BotFunctions.SimpleMessage(msg.channel, val, "Error deleting stickies", Colors["error"], () => BotFunctions.DeleteMessage(sentMessage));
                
                if (val)
                    BotFunctions.SimpleMessage(msg.channel, `Successfully removed all stickies from: ${channel.toString()}`, "Deleted stickies", Colors["success"], () => BotFunctions.DeleteMessage(sentMessage));
                else
                    BotFunctions.SimpleMessage(msg.channel, "There were no stickies in that channel.", "Error deleting stickies", Colors["error"], () => BotFunctions.DeleteMessage(sentMessage)); 
            })
        });
    }).catch(error => {
        console.error(error);
        BotFunctions.SimpleMessage(msg.channel, Errors["invalid_channel"], "Error getting channel ID", Colors["error"]);
    });
}

module.exports = {Run};