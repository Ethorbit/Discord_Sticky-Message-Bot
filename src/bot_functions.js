const STICKY_COOLDOWN = isNaN(parseInt(process.env.STICKY_COOLDOWN)) ? 20000 : process.env.STICKY_COOLDOWN; 

const Errors = require("./errors.js");
const Colors = require("./colors.js");

const { MessageEmbed, Message, Channel } = require("discord.js");

var exported = {
    DeleteMessage: function(message)
    {
        if (message != null && typeof(message.delete) == "function" && !message.deleted)
            message.delete();
    },

    SimpleMessage: function(channel, message, title, color, cb)
    {   
        const embed = new MessageEmbed();
        embed.color = color;
        embed.setTitle(title);
        embed.setDescription(message);

        channel.send(embed).then(sentMessage => {
            if (typeof(cb) == "function") 
                cb(sentMessage) 
        });
    },

    WaitForUserResponse : function(channel, user, time, cb)
    {
        const collector = channel.createMessageCollector((m) => m.member == user, {time: time}).on("collect", (response) => {
            cb(response);
            collector.stop();
        });
    },

    GetFancyMessagePropertiesFromUser: function(msg, cb) // Listen for user responses to get the fancy message properties we will use to add a fancy message
    {
        let hex_color;
        let title;
        let message;
        let lastCollectorMsg;

        try
        {
            this.SimpleMessage(msg.channel, "What hex color you want? Example: #FFF68F (There are plenty of online tools to get that)", "What Color?", Colors["question"], sentMessage => lastCollectorMsg = sentMessage);
            
            let step = 0;
            const collectorFilter = (m) => m.member == msg.member;
            const collector = msg.channel.createMessageCollector(collectorFilter, {time: 600000}).on("collect", (response) => {
                step++;

                if (step == 1)
                {
                    this.DeleteMessage(lastCollectorMsg);
                    hex_color = response.content;
                    this.SimpleMessage(msg.channel, "What should the title be?", "What Title?", Colors["question"], sentMessage => lastCollectorMsg = sentMessage);
                }

                if (step == 2)
                {
                    this.DeleteMessage(lastCollectorMsg);
                    title = response.content;
                    this.SimpleMessage(msg.channel, "What should the message be?", "What Message?", Colors["question"], sentMessage => lastCollectorMsg = sentMessage);
                }

                if (step == 3)
                {
                    this.DeleteMessage(lastCollectorMsg);
                    message = response.content;    
                    cb(hex_color, title, message);
                    collector.stop();
                }
            });
        }
        catch (error)
        {
            console.error(error);
        }
    },

    GetMessageChannelID: function(message)
    {
        if (typeof(message) != "string") return;
        return message.replace("#", "").replace("<", "").replace(">", "");
    },

    SendStickyMessage: function(channel, sticky, cb)
    {
        if (sticky["is_embed"])
        {
            this.SimpleMessage(channel, sticky["message"], sticky["title"], sticky["hex_color"], (sentMessage) => {
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
                                const stickyEmbed = new MessageEmbed();
                                stickyEmbed.title =  `Sticky #${index + 1}`;
                                sendChannel.send(stickyEmbed);
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