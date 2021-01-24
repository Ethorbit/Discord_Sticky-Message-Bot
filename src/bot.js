require('dotenv').config();

const STICKY_COOLDOWN = isNaN(parseInt(process.env.STICKY_COOLDOWN)) ? 20000 : process.env.STICKY_COOLDOWN; 
const { Client, MessageEmbed, Message } = require("discord.js");
const { Stickies } = require("./sticky.js");
const client = new Client();
const stickies = new Stickies();
const colors = new Object({
    "error" : 0xff0000,
    "sticky" : 0xffff00,
    "success" : 0x00ff00,
    "info" : 0x3399ff
});

const errors = new Object({
    "invalid_channel" : "Example: 798815345905106945 (Right-click channel and Copy ID, or tag the channel #a-channel)",
    "no_stickies_channel" : "There are no stickies for this channel.",
    "no_stickies" : "There are no stickies to list.",
    "no_sticky_id" : "There are no stickies with the ID for that channel."
});

var application = null;
client.fetchApplication().then(app => application = app);
client.on("ready", () => {  
    stickies.LoadStickies(client.guilds, () => {
        // Delete all Sticky bot messages in the last 50 messages for every server's channels
        for (const [server_id, server] of client.guilds.cache)
        {
            for (const [channel_id, channel] of server.channels.cache)
            {
                if (stickies.ValidStickyChannel(server_id, channel_id))
                {
                    try
                    {
                        channel.messages.fetch({limit: 50}).then(messages => {
                            for (const [message_id, message] of messages)
                            {
                                if (message.author.bot && message.author.id == application.id)
                                {
                                    // Only remove sticky messages (So commands stay visible)
                                    if (message.embeds[0] != null && message.embeds[0].color == colors["sticky"])
                                        DeleteMessage(message);
                                }
                            }
                        });  
                    }
                    catch(error)
                    {
                        console.error(error.message);
                    }
                }
            }
        }
    });
});

// Delete all stickies from a channel it's deleted
client.on("channelDelete", channel => {
    const server_id = channel.guild.id;
    stickies.RemoveChannelStickies(server_id, channel.id, () => {
        console.log(`Removed stickies for deleted channel ${channel.id} from server: ${server_id}`);
    });
});

// Delete all stickies from a server when it's deleted
client.on("guildDelete", guild => {
    stickies.RemoveServerStickies(guild.id, () => {
        console.log("Removed stickies from server: ", guild.id);
    });
});

function DeleteMessage(message)
{
    if (message != null && typeof(message.delete) == "function" && !message.deleted)
        message.delete();
}

function SimpleMessage(channel, message, title, color, cb)
{   
    if (colors[color] != null) 
    {
        const embed = new MessageEmbed();
        embed.color = colors[color];
        embed.title = application.name;
        embed.addField(title, message);
        channel.send(embed).then(sentMessage => {
            if (typeof(cb) == "function") 
            { 
                cb(sentMessage) 
            }
        });
    }
    else
        console.error("Invalid color specified!");
}

function GetMessageChannelID(message)
{
    if (typeof(message) != "string") return;
    return message.replace("#", "").replace("<", "").replace(">", "");
}

function ShowChannelStickies(server_id, channel, info_channel) // Show all stickies saved to a channel
{
    if (stickies.ValidStickyChannel(server_id, channel.id))
    {
        if (info_channel != null || channel.lastStickyTime == null || Date.now() - channel.lastStickyTime >= STICKY_COOLDOWN) // Wait a bit, we don't wanna interrupt conversations
        {
            if (info_channel == null && channel.lastStickyMessages != null)
            {
                channel.lastStickyMessages.forEach((val) => {
                    if (val != null)
                        DeleteMessage(val);
                });
            }
    
            if (channel.lastStickyMessages == null)
                channel.lastStickyMessages = new Array();
            else
                channel.lastStickyMessages.length = 0;
    
            const stickyList = stickies.GetStickies(server_id, channel.id);
    
            try
            {
                if (stickyList != null && stickyList != false)
                {
                    stickyList.forEach((val, index, _) => {
                        // const stickyEmbed = new MessageEmbed();
                        // stickyEmbed.color = info_channel != null ? colors["info"] : colors["sticky"];
        
                        // if (info_channel != null)
                        //     stickyEmbed.title =  `Sticky #${index + 1}`;
                        
                        // stickyEmbed.description = val["message"];

                        // const sendChannel = info_channel != null ? info_channel : channel;
                        // sendChannel.send(stickyEmbed).then(sentMessage => {
                        //     if (info_channel == null)
                        //         channel.lastStickyMessages.push(sentMessage);
                        // });

                        if (info_channel == null)
                            channel.lastStickyTime = Date.now();

                        const sendChannel = info_channel != null ? info_channel : channel;
                        sendChannel.send(val["message"]).then(sentMessage => {
                            sentMessage.suppressEmbeds(true);

                            if (info_channel == null)
                                channel.lastStickyMessages.push(sentMessage);
                        });
                    });
                }
                else if (info_channel != null)
                    SimpleMessage(info_channel, errors["no_stickies_channel"], "Error listing stickies", "error");
            }
            catch (error)
            {
                console.error(error.message);
            }
        }
        else
        {
            // Reset time when someone posts a message so it never interrupts people
            channel.lastStickyTime = Date.now();
        }
    }
    else if (info_channel != null)
        SimpleMessage(info_channel, errors["no_stickies_channel"], "Error listing stickies", "error");
}

client.on("message", msg => {
    if (msg.author.bot)
        return;

    const msgParams = msg.content.toLowerCase().split(" ");
    const server_id = msg.guild.id;
    
    if (msgParams[0] == "!sticky")
    {   
        let originalMsg = msg.content.replace(msgParams[0], "");

        if (!msg.member.hasPermission("MANAGE_CHANNELS"))
        {
            SimpleMessage(msg.channel, "You need the 'Manage Channels' permission.", "Insufficient Privileges!", "error");
            return; 
        }

        var channel_id;

        switch (msgParams[1]) 
        {
        case "add": // Add a sticky
            channel_id = GetMessageChannelID(msgParams[2]); 
            originalMsg = originalMsg.replace(msgParams[1], "");
            originalMsg = originalMsg.replace(msgParams[2], "");

            client.channels.fetch(channel_id).then(channel => {
                if (channel.type != "text") 
                    return SimpleMessage(msg.channel, "The passed channel must be a text channel that you can post messages in.", "Incorrect channel type!", "error");

                if (originalMsg.replace(" ", "").length <= 1)
                    SimpleMessage(msg.channel, "You need to pass a Discord message (!sticky add 798815345905106945 This is the missing message :D)", "No message passed!", "error");
                else
                {
                    SimpleMessage(msg.channel, "Please wait while I add the sticky..", "Processing", "sticky", (sentMessage) => {
                        stickies.AddSticky(server_id, channel_id, originalMsg, (val) => {
                            if (typeof(val) == "string")
                                return SimpleMessage(msg.channel, val, "Error adding sticky!", "error", () => DeleteMessage(sentMessage));
    
                            if (val)
                            {
                                SimpleMessage(msg.channel, `
                                    ID: ${val} 
                                    Channel: ${channel.toString()}
                                `, "Created sticky!", "success",
                                    () => DeleteMessage(sentMessage)
                                );
                            }
                            else
                                SimpleMessage(msg.channel, "Unknown error, try again.", "Error adding sticky!", "error", DeleteMessage(sentMessage));
                        });
                    });
                }
            }).catch(_ => {
                SimpleMessage(msg.channel, errors["invalid_channel"], "Error getting channel ID", "error");
            });
        break;
        case "edit": // Modify channel sticky
            channel_id = GetMessageChannelID(msgParams[2]);
            sticky_id = msgParams[3];
            client.channels.fetch(channel_id).then(channel => {
                SimpleMessage(msg.channel, "Please wait while I change that sticky's message...", "Processing", "sticky", (sentMessage) => {
                    originalMsg = originalMsg.replace(msgParams[1], "");
                    originalMsg = originalMsg.replace(msgParams[2], "");
                    originalMsg = originalMsg.replace(msgParams[3], "");
                    stickies.EditSticky(server_id, channel_id, sticky_id, originalMsg, (val) => {
                        if (typeof(val) == "string")
                            return SimpleMessage(msg.channel, val, "Error changing sticky", "error", () => DeleteMessage(sentMessage));

                        if (val)
                            SimpleMessage(msg.channel, `Successfully changed Sticky #${sticky_id}'s content`, "Modified sticky", "success", () => DeleteMessage(sentMessage));
                        else
                            SimpleMessage(msg.channel, errors["no_sticky_id"], "Error editing sticky", "error", () => DeleteMessage(sentMessage)); 
                    });
                });
            }).catch(_ => {
                SimpleMessage(msg.channel, errors["invalid_channel"], "Error getting channel ID", "error");
            });
        break;
        case "remove": // Remove a sticky
            channel_id = GetMessageChannelID(msgParams[2]); 
            sticky_id = msgParams[3];

            client.channels.fetch(channel_id).then(channel => {
                if (sticky_id == null)
                    SimpleMessage(msg.channel, "Example: !sticky remove 798815345905106945 6", "No sticky ID passed!", "error");
                else
                {
                    SimpleMessage(msg.channel, "Please wait while I remove that sticky..", "Processing", "sticky", (sentMessage) => {
                        stickies.RemoveSticky(server_id, channel_id, sticky_id, (val) =>
                        {
                            if (typeof(val) == "string")
                                return SimpleMessage(msg.channel, val, "Error deleting sticky", "error", () => DeleteMessage(sentMessage));
    
                            if (val)
                                SimpleMessage(msg.channel, `Successfully removed Sticky #${sticky_id} from ${channel.toString()}`, "Deleted sticky", "success", () => DeleteMessage(sentMessage));
                            else
                                SimpleMessage(msg.channel, errors["no_sticky_id"], "Error deleting sticky", "error", () => DeleteMessage(sentMessage));
                        });
                    });
                }
            }).catch(_ => {
                SimpleMessage(msg.channel, errors["invalid_channel"], "Error getting channel ID", "error");
            });
        break;
        case "removeall":
            channel_id = GetMessageChannelID(msgParams[2]); 
            client.channels.fetch(channel_id).then(channel => {
                SimpleMessage(msg.channel, `Please wait while I remove all stickies from: ${channel.toString()}`, "Processing", "sticky", (sentMessage) => {
                    stickies.RemoveChannelStickies(server_id, channel_id, (val) => {
                        if (typeof(val) == "string")
                                return SimpleMessage(msg.channel, val, "Error deleting stickies", "error", () => DeleteMessage(sentMessage));
                        
                        if (val)
                            SimpleMessage(msg.channel, `Successfully removed all stickies from: ${channel.toString()}`, "Deleted stickies", "success", () => DeleteMessage(sentMessage));
                        else
                            SimpleMessage(msg.channel, "There were no stickies in that channel.", "Error deleting stickies", "error", () => DeleteMessage(sentMessage)); 
                    })
                });
            }).catch(error => {
                console.error(error);
                SimpleMessage(msg.channel, errors["invalid_channel"], "Error getting channel ID", "error");
            });
        break;
        case "preview":
            if (msgParams[2] != null)
            {
                originalMsg = originalMsg.replace(msgParams[1], "");
                
                // const stickyEmbed = new MessageEmbed();
                // stickyEmbed.color = colors["sticky"];
                // stickyEmbed.description = originalMsg;
                msg.channel.send(originalMsg).then(sentMessage => {
                    sentMessage.suppressEmbeds(true);
                });
            }
        break;
        case "list": // List stickies from channel or all channels with stickies
            channel_id = GetMessageChannelID(msgParams[2]);
            client.channels.fetch(channel_id).then(channel => {
                ShowChannelStickies(server_id, channel, msg.channel);
            }).catch(error => {
                if (channel_id != null)
                    return SimpleMessage(msg.channel, errors["invalid_channel"], "Error getting channel ID", "error");

                const stickyList = stickies.GetStickies(server_id, null);
                if (typeof(stickyList) == "string")
                    return SimpleMessage(msg.channel, stickyList, "Error listing stickies", "error");

                const listEmbed = new MessageEmbed();
                listEmbed.color = colors["info"];
                listEmbed.title = application.name;

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
                                    SimpleMessage(msg.channel, errors["no_stickies"], "Error listing stickies", "error");
                                else
                                    msg.channel.send(listEmbed);
                            }
                                
                        }).catch(_ => {
                        });
                    });

                    if (!bStickiesExist)
                        SimpleMessage(msg.channel, errors["no_stickies"], "Error listing stickies", "error");
                }
                else
                    SimpleMessage(msg.channel, errors["no_stickies"], "Error listing stickies", "error");
            }); 
        break;
        default:
            const embed = new MessageEmbed();
            embed.color = colors["info"];
            embed.title = application.name;

            embed.addField("Commands", `
                !sticky add <channel id> <discord message> - Add a sticky to a channel
                !sticky edit <channel id> <sticky id> <discord message> - Change sticky message
                !sticky remove <channel id> <sticky id> - Remove a sticky from a channel
                !sticky removeall <channel id> - Remove all stickies from a channel
                !sticky preview <discord message> - Preview what a sticky looks like
                !sticky list <channel id> - List stickies in a channel
                !sticky list - List all channels with stickies
            `);

            msg.channel.send(embed);
        }
    }  
    else
    {
        ShowChannelStickies(msg.guild.id, msg.channel, null);     
    }
});

client.login(process.env.BOT_TOKEN);