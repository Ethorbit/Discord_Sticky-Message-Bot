// Edit command
const BotFunctions = require("../bot_functions.js");
const Errors = require("../errors.js");
const Colors = require("../colors.js");

function Run(client, msg)
{
    const msgParams = msg.content.toLowerCase().split(" ");
    const server_id = msg.guild.id;
    const channel_id = BotFunctions.GetMessageChannelID(msgParams[2]);
    const sticky_id = msgParams[3];

    client.channels.fetch(channel_id).then(_ => {
        if (!global.stickies.ValidSticky(server_id, channel_id, sticky_id))
            return BotFunctions.SimpleMessage(msg.channel, Errors["no_sticky_id"], "Error editing sticky", Colors["error"]);  
        
        BotFunctions.SimpleMessage(msg.channel, `What are you wanting to change for #${sticky_id} sticky? (message | title | hex_color | is_embed)`, "Which property?", Colors["question"], (sentMessage) => {  
            BotFunctions.WaitForUserResponse(msg.channel, msg.member, 20000, response => {
                BotFunctions.DeleteMessage(sentMessage);

                const key = response.content.toLowerCase();

                if (key !== "message" && key !== "title" && key !== "hex_color" && key !== "is_embed")
                    return BotFunctions.SimpleMessage(msg.channel, "The value you provided is not a valid sticky property.", "Error", Colors["error"]);

                BotFunctions.SimpleMessage(msg.channel, `What do you want to set #${sticky_id} sticky's ${key} to?`, "What value?", Colors["question"], (sentMessage) => {  
                    BotFunctions.WaitForUserResponse(msg.channel, msg.member, key == "message" ? 600000 : 40000, response => {
                        BotFunctions.DeleteMessage(sentMessage);

                        BotFunctions.SimpleMessage(msg.channel, `Please wait while I change that sticky's ${key}...`, "Processing", Colors["sticky"], (sentMessage) => {
                            global.stickies.EditSticky(server_id, channel_id, sticky_id, key, response, (val) => {
                                BotFunctions.DeleteMessage(sentMessage);

                                if (typeof(val) == "string")
                                    return BotFunctions.SimpleMessage(msg.channel, val, "Error changing sticky", Colors["error"], () => BotFunctions.DeleteMessage(sentMessage));
                                
                                if (val)
                                    BotFunctions.SimpleMessage(msg.channel, `Successfully changed Sticky #${sticky_id}'s ${key}.`, "Modified sticky", Colors["success"], () => BotFunctions.DeleteMessage(sentMessage));
                                else
                                    BotFunctions.SimpleMessage(msg.channel, Errors["no_sticky_id"], "Error editing sticky", Colors["error"], () => BotFunctions.DeleteMessage(sentMessage));  
                            });
                        });
                    });
                });
            });
        });
    }).catch(_ => {
        BotFunctions.SimpleMessage(msg.channel, Errors["invalid_channel"], "Error getting channel ID", Colors["error"]);
    });
}

module.exports = {Run};