// Preview command
const BotFunctions = require("../bot_functions.js");
const Colors = require("../messages/colors.js");

function Run(client, msg)
{
    const msgParams = BotFunctions.GetCommandParamaters(msg.content);
    const server_id = msg.guild.id;
    const input_message = msgParams[2];
    const test_id = BotFunctions.GetMessageChannelID(input_message);

    if (input_message != null)
    {
        const originalMsg = msg.content.replace(msgParams[0], "").replace(msgParams[1], "");
            
        msg.channel.send(originalMsg).then(sentMessage => {
            sentMessage.suppressEmbeds(true);
        }).catch(err => {
            console.error(`Error previewing message: ${err}`);
        });
    }
    else 
        BotFunctions.SimpleMessage(msg.channel, "You entered nothing.", "Empty message!", Colors["error"]);
}   

module.exports = {Run};
