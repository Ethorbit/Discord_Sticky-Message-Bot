const BotFunctions = require("../bot_functions.js");
const Errors = require("../errors.js");

function Run(client, msg)
{
    const msgParams = msg.content.toLowerCase().split(" ");
    const server_id = msg.guild.id;
    const channel_id = GetMessageChannelID(msgParams[2]);
    const sticky_id = msgParams[3];

    client.channels.fetch(channel_id).then(_ => {
        BotFunctions.SimpleMessage(msg.channel, "Please wait while I change that sticky's message...", "Processing", "sticky", (sentMessage) => {
            const originalMsg = originalMsg.replace(msgParams[1], "").replace(msgParams[2], "").replace(msgParams[3], "");

            global.stickies.EditSticky(server_id, channel_id, sticky_id, originalMsg, (val) => {
                if (typeof(val) == "string")
                    return BotFunctions.SimpleMessage(msg.channel, val, "Error changing sticky", "error", () => BotFunctions.DeleteMessage(sentMessage));

                if (val)
                    BotFunctions.SimpleMessage(msg.channel, `Successfully changed Sticky #${sticky_id}'s content`, "Modified sticky", "success", () => BotFunctions.DeleteMessage(sentMessage));
                else
                    BotFunctions.SimpleMessage(msg.channel, Errors["no_sticky_id"], "Error editing sticky", "error", () => BotFunctions.DeleteMessage(sentMessage)); 
            });
        });
    }).catch(_ => {
        BotFunctions.SimpleMessage(msg.channel, Errors["invalid_channel"], "Error getting channel ID", "error");
    });
}

module.exports = {Run};