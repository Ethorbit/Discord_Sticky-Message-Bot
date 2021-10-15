const BotFunctions = require("../bot_functions.js");
const Errors = require("../errors.js");

function Run(client, msg)
{
    const server_id = msg.guild.id;
    const msgParams = msg.content.toLowerCase().split(" ");
    const channel_id = BotFunctions.GetMessageChannelID(msgParams[2]); 
    const originalMsg = msg.content.replace(msgParams[0], "").replace(msgParams[1], "").replace(msgParams[2], "");

    client.channels.fetch(channel_id).then(channel => {
        if (channel.type != "text") 
            return BotFunctions.SimpleMessage(msg.channel, "The passed channel must be a text channel that you can post messages in.", "Incorrect channel type!", "error");

        if (originalMsg.replace(" ", "").length <= 1)
            BotFunctions.SimpleMessage(msg.channel, "You need to pass a Discord message (!sticky add 798815345905106945 This is the missing message :D)", "No message passed!", "error");
        else
        {
            BotFunctions.SimpleMessage(msg.channel, "Please wait while I add the sticky..", "Processing", "sticky", (sentMessage) => {
                global.stickies.AddSticky(server_id, channel_id, originalMsg, (val) => {
                    if (typeof(val) == "string")
                        return BotFunctions.SimpleMessage(msg.channel, val, "Error adding sticky!", "error", () => BotFunctions.DeleteMessage(sentMessage));

                    if (val)
                    {
                        BotFunctions.SimpleMessage(msg.channel, `
                            ID: ${val} 
                            Channel: ${channel.toString()}
                        `, "Created sticky!", "success",
                        () => {
                            BotFunctions.DeleteMessage(sentMessage)
                            BotFunctions.ShowChannelStickies(server_id, channel, null);
                        });
                    }
                    else
                        BotFunctions.SimpleMessage(msg.channel, "Unknown error, try again.", "Error adding sticky!", "error", BotFunctions.DeleteMessage(sentMessage));
                });
            });
        }
    }).catch(_ => {
        BotFunctions.SimpleMessage(msg.channel, Errors["invalid_channel"], "Error getting channel ID", "error");
    });
}

module.exports = {Run};