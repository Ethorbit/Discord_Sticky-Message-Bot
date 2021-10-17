// List command
const BotFunctions = require("../bot_functions.js");
const Errors = require("../messages/errors.js");
const Colors = require("../messages/colors.js");

const { MessageEmbed } = require("discord.js");

function Run(client, msg)
{
    const msgParams = msg.content.toLowerCase().split(" ");
    const server_id = msg.guild.id;
    const channel_id = BotFunctions.GetMessageChannelID(msgParams[2]);

    client.channels.fetch(channel_id).then(channel => {
        BotFunctions.ShowChannelStickies(server_id, channel, msg.channel);
    }).catch(_ => {
        if (channel_id != null)
            return BotFunctions.SimpleMessage(msg.channel, Errors["invalid_channel"], "Error getting channel ID", Colors["error"]);

        const stickyList = global.stickies.GetStickies(server_id, null);
        if (typeof(stickyList) == "string")
            return BotFunctions.SimpleMessage(msg.channel, stickyList, "Error listing stickies", Colors["error"]);

        const listEmbed = new MessageEmbed();
        listEmbed.color = Colors["info"];
        listEmbed.title = global.discordApplication.name;

        if (stickyList != null && stickyList != false)
        {
            let bStickiesExist = false;
            let channelListStr = "";
            stickyList.forEach((val, index, array) => {
                bStickiesExist = true;
                client.channels.fetch(val["server_id"]).then(channel => {
                    if (val.count > 0)
                    {
                        channelListStr = "";
                        channelListStr += `
                            ${channel.toString()}
                            Count: ${val.count}
                        `;

                        listEmbed.addField("Stickies", channelListStr);  
                    }

                    if (array.length - 1 == index)
                    {
                        if (listEmbed.fields.length <= 0)
                            BotFunctions.SimpleMessage(msg.channel, Errors["no_stickies"], "Error listing stickies", Colors["error"]);
                        else
                            msg.channel.send(listEmbed);
                    }
                        
                }).catch(_ => {
                });
            });

            if (!bStickiesExist)
                BotFunctions.SimpleMessage(msg.channel, Errors["no_stickies"], "Error listing stickies", Colors["error"]);
        }
        else
            BotFunctions.SimpleMessage(msg.channel, Errors["no_stickies"], "Error listing stickies", Colors["error"]);
    }); 
}

module.exports = {Run};