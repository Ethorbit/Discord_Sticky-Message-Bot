require('dotenv').config();

const STICKY_DELAY = 20000; 
const { Client, MessageEmbed } = require("discord.js");
const { Stickies } = require("./sticky.js");

const client = new Client();
const stickies = new Stickies();
const colors = new Object({
    "error" : 0xff0000,
    "sticky" : 0xffff00,
    "success" : 0x00ff00,
    "info" : 0x3399ff
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
                                    message.delete();
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

client.on("channelDelete", (channel) => {
    const server_id = channel.guild.id;
    stickies.RemoveChannelStickies(server_id, channel.id, () => {
        console.log("Removed stickies for deleted channel:", server_id);
    });
});

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

function ShowChannelStickies(server_id, channel, info) // Show all stickies saved to a channel
{
    if (stickies.ValidStickyChannel(server_id, channel.id))
    {
        if (info || channel.lastStickyTime == null || Date.now() - channel.lastStickyTime >= STICKY_DELAY) // Wait a bit, we don't wanna interrupt conversations
        {
            if (channel.lastStickyMessages != null)
            {
                channel.lastStickyMessages.forEach((val) => {
                    if (val != null)
                        val.delete();
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
                        const stickyEmbed = new MessageEmbed();
                        stickyEmbed.color = info ? colors["info"] : colors["sticky"];
        
                        if (info)
                            stickyEmbed.title =  `Sticky #${index + 1}`;
                    
                        stickyEmbed.description = val["message"];
                        channel.lastStickyTime = Date.now();

                        channel.send(stickyEmbed).then(sentMessage => {
                            if (!info)
                                channel.lastStickyMessages.push(sentMessage);
                        });
                    });
                }
                else if (info)
                    SimpleMessage(msg.channel, "There are no stickies for this channel.", "Error listing stickies", "error");
            }
            catch (error)
            {
                console.error(error.message);
            }
        }
        else
        {
            // Reset time when someone posts a message so it never interrupts people
            channel.lastStickyTime = Date.now() + STICKY_DELAY;
        }
    }
    else if (info)
        SimpleMessage(msg.channel, "There are no stickies for this channel.", "Error listing stickies", "error");
}

client.on("message", msg => {
    if (msg.author.bot)
        return;

    let originalMsg = msg.content;
    const msgParams = msg.content.toLowerCase().split(" ");
    const server_id = msg.guild.id;
    
    if (msgParams[0] == "!sticky")
    {   
        if (!msg.member.hasPermission("MANAGE_CHANNELS"))
        {
            SimpleMessage(msg.channel, "You need the 'Manage Channels' permission.", "Insufficient Privileges!", "error");
            return; 
        }

        var channel_id;

        switch (msgParams[1]) 
        {
        case "add": // Add a sticky
            channel_id = msgParams[2]; 
            originalMsg = originalMsg.replace(msgParams[0], "");
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
                                return SimpleMessage(msg.channel, val, "Error adding sticky!", "error", () => sentMessage.delete());
    
                            if (val)
                            {
                                SimpleMessage(msg.channel, `
                                    ID: ${val} 
                                    Channel: ${channel.toString()}
                                `, "Created sticky!", "success",
                                    () => sentMessage.delete()
                                );
                            }
                            else
                                SimpleMessage(msg.channel, "Unknown error, try again.", "Error adding sticky!", "error", sentMessage.delete());
                        });
                    });
                }
            }).catch(error => {
                console.error(error);
                SimpleMessage(msg.channel, "Example: 798815345905106945 (Right-click channel and Copy ID)", "Error getting channel ID", "error");
            });
        break;
        case "remove": // Remove a sticky
            channel_id = msgParams[2]; 
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
                                return SimpleMessage(msg.channel, val, "Error deleting sticky", "error", () => sentMessage.delete());
    
                            if (val)
                                SimpleMessage(msg.channel, `Successfully removed Sticky #${sticky_id} from ${channel.toString()}`, "Deleted sticky", "success", () => sentMessage.delete());
                            else
                                SimpleMessage(msg.channel, "There are no stickies with the ID for that channel.", "Error deleting sticky", "error", () => sentMessage.delete());
                        });
                    });
                }
            }).catch(error => {
                console.error(error);
                SimpleMessage(msg.channel, "Example: 798815345905106945 (Right-click channel and Copy ID)", "Error getting channel ID", "error");
            });
        break;
        case "removeall":
            channel_id = msgParams[2]; 
            client.channels.fetch(channel_id).then(channel => {
                SimpleMessage(msg.channel, `Please wait while I remove all stickies from: ${channel.toString()}`, "Processing", "sticky", (sentMessage) => {
                    stickies.RemoveChannelStickies(server_id, channel_id, (val) => {
                        if (typeof(val) == "string")
                                return SimpleMessage(msg.channel, val, "Error deleting stickies", "error", () => sentMessage.delete());
                        
                        if (val)
                            SimpleMessage(msg.channel, `Successfully removed all stickies from: ${channel.toString()}`, "Deleted stickies", "success", () => sentMessage.delete());
                        else
                            SimpleMessage(msg.channel, "There were no stickies in that channel.", "Error deleting stickies", "error", () => sentMessage.delete()); 
                    })
                });
            }).catch(error => {
                console.error(error);
                SimpleMessage(msg.channel, "Example: 798815345905106945 (Right-click channel and Copy ID)", "Error getting channel ID", "error");
            });
        break;
        case "preview":
            if (msgParams[2] != null)
            {
                originalMsg = originalMsg.replace(msgParams[0], "");
                originalMsg = originalMsg.replace(msgParams[1], "");
                
                const stickyEmbed = new MessageEmbed();
                stickyEmbed.color = colors["sticky"];
                stickyEmbed.description = originalMsg;
                msg.channel.send(stickyEmbed);
            }
        break;
        case "list": // List stickies from channel or all channels with stickies
            channel_id = msgParams[2];
            client.channels.fetch(channel_id).then(channel => {
                ShowChannelStickies(server_id, msg.channel, true);
            }).catch(_ => {
                if (channel_id != null)
                    return SimpleMessage(msg.channel, "Example: 798815345905106945 (Right-click channel and Copy ID)", "Error getting channel ID", "error");

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
                                    SimpleMessage(msg.channel, "There are no stickies to list.", "Error listing stickies", "error");
                                else
                                    msg.channel.send(listEmbed);
                            }
                                
                        }).catch(_ => {
                        });
                    });

                    if (!bStickiesExist)
                        SimpleMessage(msg.channel, "There are no stickies to list.", "Error listing stickies", "error");
                }
                else
                    SimpleMessage(msg.channel, "There are no stickies to list.", "Error listing stickies", "error");
            }); 
        break;
        default:
            const embed = new MessageEmbed();
            embed.color = colors["info"];
            embed.title = application.name;

            embed.addField("Commands", `
                !sticky add <channel id> <discord message> - Add a sticky to a channel
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
        ShowChannelStickies(msg.guild.id, msg.channel, false);     
    }
});

client.login(process.env.DISCORD_BOT_TOKEN);