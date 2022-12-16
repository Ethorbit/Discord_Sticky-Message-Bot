const Errors = require("./messages/errors.js");
const Colors = require("./messages/colors.js");
const STICKY_COOLDOWN = isNaN(parseInt(process.env.STICKY_COOLDOWN)) ? 20000 : process.env.STICKY_COOLDOWN; 

const { EmbedBuilder, resolveColor } = require("discord.js");

var exported = {
    DeleteMessage: function(message)
    {
        if (message != null && typeof(message.delete) == "function" && !message.deleted)
            message.delete();
    },

    SimpleMessage: function(channel, message, title, color, cb)
    {   
        try
        {
            const embed = new EmbedBuilder();

            if (color != undefined)
                embed.setColor(color);
            
            if (title != undefined)
                embed.setTitle(title);

            // Stupid workaround thanks to discord.js not supporting more than 1 single space inside embeds
            // My god, please someone get them to fix this..
            const fake_space = " ឵឵  ឵឵";
            const discordjs_not_doing_its_job = message.replace(/([^\S\r\n][^\S\r\n])/gm, fake_space);
       
            embed.setDescription(discordjs_not_doing_its_job); 
        
            channel.send({embeds: [embed]}).then(sentMessage => {
                if (typeof(cb) == "function") 
                    cb(sentMessage) 
            });
        }
        catch(err)
        {
            console.error("Failed to create a Simple Message", err);
        }
    },

    WaitForUserResponse : function(channel, user, time, cb) // Wait for specific user to respond in specified channel, send result to callback
    {
        const collector = channel.createMessageCollector((m) => m.member == user, {time: time}).on("collect", (response) => {
            cb(response);
            collector.stop();
        });
    },

    GetMessageChannelID: function(message)
    {
        if (typeof(message) != "string") return;
        return message.replace("#", "").replace("<", "").replace(">", "");
    },

    GetCommandParamaters(command)
    {
        return command.toLowerCase().split(" ").filter(i => i);
    },
    
    SendStickyMessage: function(channel, sticky, cb)
    {
        if (sticky["is_embed"])
        {
            this.SimpleMessage(channel, sticky["message"], sticky["title"], sticky["hex_color"], sentMessage => {
                if (typeof(cb) == "function")
                    cb(sentMessage);
            });
        }
        else
        {
            channel.send(sticky["message"]).then(sentMessage => {
                sentMessage.suppressEmbeds(true);

                if (typeof(cb) == "function")
                    cb(sentMessage);
            });
        }
    },

    ShowChannelStickies: function(server_id, channel, info_channel) // Show all stickies saved to a channel
    {
        if (global.stickies.ValidStickyChannel(server_id, channel.id))
        {
            if (info_channel != null || channel.lastStickyTime == null || Date.now() - channel.lastStickyTime >= STICKY_COOLDOWN) // Wait a bit, we don't wanna interrupt conversations
            {
                // Delete previous sticky messages we posted
                if (info_channel == null && channel.lastStickyMessages != null)
                {
                    channel.lastStickyMessages.forEach((val) => {
                        if (val != null)
                            this.DeleteMessage(val);
                    });
                }
        
                if (channel.lastStickyMessages == null)
                    channel.lastStickyMessages = new Array();
                else
                    channel.lastStickyMessages.length = 0;
        
                const stickyList = global.stickies.GetStickies(server_id, channel.id);
        
                try
                {
                    if (stickyList != null && stickyList != false)
                    {
                        stickyList.forEach((val, index, _) => {
                            const sendChannel = info_channel != null ? info_channel : channel;
                            if (info_channel != null)
                            {
                                const stickyEmbed = new EmbedBuilder();
                                stickyEmbed.setTitle(`Sticky #${index + 1}`);
                                sendChannel.send({embeds: [stickyEmbed]});
                            }

                            if (info_channel == null)
                                channel.lastStickyTime = Date.now();

                            this.SendStickyMessage(sendChannel, val, (sentMessage) => {
                                if (info_channel == null)
                                    channel.lastStickyMessages.push(sentMessage);
                            });
                        });
                    }
                    else if (info_channel != null)
                        this.SimpleMessage(info_channel, Errors["no_stickies_channel"], "Error listing stickies", Colors["error"]);
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
            this.SimpleMessage(info_channel, Errors["no_stickies_channel"], "Error listing stickies", Colors["error"]);
    }
};

module.exports = exported;
