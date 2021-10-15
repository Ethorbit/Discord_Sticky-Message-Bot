const STICKY_COOLDOWN = isNaN(parseInt(process.env.STICKY_COOLDOWN)) ? 20000 : process.env.STICKY_COOLDOWN; 

const Errors = require("./errors.js");
const Colors = require("./colors.js");
const stickies = require("./stickies.js");

const { MessageEmbed } = require("discord.js");

var exported = {
    DeleteMessage: function(message)
    {
        if (message != null && typeof(message.delete) == "function" && !message.deleted)
            message.delete();
    },

    SimpleMessage: function(channel, message, title, color, cb)
    {   
        if (Colors[color] != null) 
        {
            const embed = new MessageEmbed();
            embed.color = Colors[color];
            embed.title = global.discordApplication.name;
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
    },

    GetMessageChannelID: function(message)
    {
        if (typeof(message) != "string") return;
        return message.replace("#", "").replace("<", "").replace(">", "");
    },

    ShowChannelStickies: function(server_id, channel, info_channel) // Show all stickies saved to a channel
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
                            const sendChannel = info_channel != null ? info_channel : channel;
                            if (info_channel != null)
                            {
                                const stickyEmbed = new MessageEmbed();
                                stickyEmbed.title =  `Sticky #${index + 1}`;
                                sendChannel.send(stickyEmbed);
                            }

                            if (info_channel == null)
                                channel.lastStickyTime = Date.now();

                            sendChannel.send(val["message"]).then(sentMessage => {
                                sentMessage.suppressEmbeds(true);

                                if (info_channel == null)
                                    channel.lastStickyMessages.push(sentMessage);
                            });
                        });
                    }
                    else if (info_channel != null)
                        this.SimpleMessage(info_channel, Errors["no_stickies_channel"], "Error listing stickies", "error");
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
            this.SimpleMessage(info_channel, Errors["no_stickies_channel"], "Error listing stickies", "error");
    }
};

module.exports = exported;