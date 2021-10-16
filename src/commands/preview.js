// Preview command
const BotFunctions = require("../bot_functions.js");

function Run(client, msg)
{
    const msgParams = msg.content.toLowerCase().split(" ");
    const server_id = msg.guild.id;
    const input_message = msgParams[2];
    const test_id = BotFunctions.GetMessageChannelID(input_message);

    if (input_message != null)
    {
        client.channels.fetch(test_id).then(channel => {
            BotFunctions.ShowChannelStickies(server_id, channel, msg.channel);
        }).catch(_ => {
            const originalMsg = msg.content.replace(msgParams[0], "").replace(msgParams[1], "");
            
            msg.channel.send(originalMsg).then(sentMessage => {
                sentMessage.suppressEmbeds(true);
            });
        });
    }
}   

module.exports = {Run};