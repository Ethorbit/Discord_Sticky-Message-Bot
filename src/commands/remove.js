const BotFunctions = require("../bot_functions.js");
const Errors = require("../errors.js");

function Run(client, msg)
{
    const msgParams = msg.content.toLowerCase().split(" ");
    channel_id = BotFunctions.GetMessageChannelID(msgParams[2]); 
    sticky_id = msgParams[3];

    client.channels.fetch(channel_id).then(channel => {
        if (sticky_id == null)
            BotFunctions.SimpleMessage(msg.channel, "Example: !sticky remove 798815345905106945 6", "No sticky ID passed!", "error");
        else
        {
            BotFunctions.SimpleMessage(msg.channel, "Please wait while I remove that sticky..", "Processing", "sticky", (sentMessage) => {
                global.stickies.RemoveSticky(server_id, channel_id, sticky_id, (val, messageStr) =>
                {
                    if (typeof(val) == "string")
                        return BotFunctions.SimpleMessage(msg.channel, val, "Error deleting sticky", "error", () => BotFunctions.DeleteMessage(sentMessage));

                    if (val)
                        BotFunctions.SimpleMessage(msg.channel, `Successfully removed Sticky #${sticky_id} from ${channel.toString()}`, "Deleted sticky", "success", () => DeleteMessage(sentMessage)); 
                    else
                        BotFunctions.SimpleMessage(msg.channel, Errors["no_sticky_id"], "Error deleting sticky", "error", () => BotFunctions.DeleteMessage(sentMessage));
                });
            });
        }
    }).catch(_ => {
        BotFunctions.SimpleMessage(msg.channel, Errors["invalid_channel"], "Error getting channel ID", "error");
    });
}

module.exports = {Run};