// Remove command
const BotFunctions = require("../bot_functions.js");
const Errors = require("../messages/errors.js");
const Colors = require("../messages/colors.js");

function Run(client, msg)
{
    const msgParams = BotFunctions.GetCommandParamaters(msg.content);
    const server_id = msg.guild.id;
    const channel_id = BotFunctions.GetMessageChannelID(msgParams[2]); 
    const sticky_id = msgParams[3];

    client.channels.fetch(channel_id).then(channel => {
        if (sticky_id == null)
            BotFunctions.SimpleMessage(msg.channel, "Example: !sticky remove 798815345905106945 6", "No sticky ID passed!", Colors["error"]);
        else
        {
            BotFunctions.SimpleMessage(msg.channel, "Please wait while I remove that sticky..", "Processing", Colors["sticky"], (sentMessage) => {
                global.stickies.RemoveSticky(server_id, channel_id, sticky_id, (val, messageStr) =>
                {
                    if (typeof(val) == "string")
                        return BotFunctions.SimpleMessage(msg.channel, val, "Error deleting sticky", Colors["error"], () => BotFunctions.DeleteMessage(sentMessage));

                    if (val)
                    { 
                        BotFunctions.ResetLastStickyTime(channel);
                        BotFunctions.ShowChannelStickies(server_id, channel);
                        BotFunctions.SimpleMessage(msg.channel, `Successfully removed Sticky #${sticky_id} from ${channel.toString()}`, "Deleted sticky", Colors["success"], () => BotFunctions.DeleteMessage(sentMessage)); 
                    }
                    else
                        BotFunctions.SimpleMessage(msg.channel, Errors["no_sticky_id"], "Error deleting sticky", Colors["error"], () => BotFunctions.DeleteMessage(sentMessage));
                });
            });
        }
    }).catch(_ => {
        BotFunctions.SimpleMessage(msg.channel, Errors["invalid_channel"], "Error getting channel ID", Colors["error"]);
    });
}

module.exports = {Run};
