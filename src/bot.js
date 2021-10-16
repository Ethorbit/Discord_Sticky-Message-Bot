require('dotenv').config({path: "../.env"});

const BotFunctions = require("./bot_functions.js");
const Colors = require("./colors.js");

const AddCommand = require("./commands/add.js");
const AddFancyCommand = require("./commands/addfancy.js");
const EditCommand = require("./commands/edit.js");
const RemoveCommand = require("./commands/remove.js");
const RemoveAllCommand = require("./commands/removeall.js");
const PreviewCommand = require("./commands/preview.js");
const PreviewFancyCommand = require("./commands/previewfancy.js");
const ListCommand = require("./commands/list.js");

const { Client, MessageEmbed } = require("discord.js");
const client = new Client();

const {Stickies} = require("./sticky.js");
global.stickies = new Stickies();

client.fetchApplication().then(app => global.discordApplication = app);
client.on("ready", () => {  
    global.stickies.LoadStickies(client.guilds, () => {
        // Delete all Sticky bot messages in the last 50 messages for every server's channels
        for (const [server_id, server] of client.guilds.cache)
        {
            for (const [channel_id, channel] of server.channels.cache)
            {
                if (global.stickies.ValidStickyChannel(server_id, channel_id))
                {
                    try
                    {
                        channel.messages.fetch({limit: 50}).then(messages => {
                            for (const [_, message] of messages)
                            {
                                if (message.author.bot && message.author.id == global.discordApplication.id)
                                {
                                    // Only remove sticky messages (So commands stay visible)
                                    if (message.embeds[0] == null)
                                        BotFunctions.DeleteMessage(message);
                                }
                            }
                        }).then(() => {
                            BotFunctions.ShowChannelStickies(server_id, channel, null);
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
    global.stickies.RemoveChannelStickies(server_id, channel.id, () => {
        console.log(`Removed stickies for deleted channel ${channel.id} from server: ${server_id}`);
    });
});

// Delete all stickies from a server when it's deleted
client.on("guildDelete", guild => {
    global.stickies.RemoveServerStickies(guild.id, () => {
        console.log("Removed stickies from server: ", guild.id);
    });
});

client.on("message", msg => {
    if (msg.author.bot)
        return;

    const msgParams = msg.content.toLowerCase().split(" ");
    
    if (msgParams[0] == "!sticky")
    {   
        if (!msg.member.hasPermission("MANAGE_CHANNELS"))
        {
            BotFunctions.SimpleMessage(msg.channel, "You need the 'Manage Channels' permission.", "Insufficient Privileges!", Colors["error"]);
            return; 
        }

        switch (msgParams[1]) 
        {
            case "add": // Add a sticky
                AddCommand.Run(client, msg);
            break;
            case "addfancy": // Add a fancy sticky
                AddFancyCommand.Run(client, msg);
            break;
            case "edit": // Modify channel sticky
                EditCommand.Run(client, msg);
            break;
            case "remove": // Remove a sticky
                RemoveCommand.Run(client, msg);
            break;
            case "removeall":
                RemoveAllCommand.Run(client, msg);
            break;
            case "preview":
                PreviewCommand.Run(client, msg);
            break;
            case "previewfancy":
                PreviewFancyCommand.Run(client, msg);
            break;
            case "list": // List stickies from channel or all channels with stickies
                ListCommand.Run(client, msg);
            break;
            default:
                const embed = new MessageEmbed();
                embed.color = Colors["info"];
                embed.title = "Commands";

                embed.addField("!sticky add <channel id> <discord message>", "Add a sticky to a channel.");
                embed.addField("!sticky addfancy <channel id>", "Start the process of adding a fancy sticky to a channel.");
                embed.addField("!sticky edit <channel id> <sticky id>", "Start the modification process for the provided sticky.");
                embed.addField("!sticky remove <channel id> <sticky id>", "Remove a sticky from a channel.");
                embed.addField("!sticky removeall <channel id>", "Remove all stickies from a channel.");
                embed.addField("!sticky preview <message>", "Preview what a sticky looks like.");
                embed.addField("!sticky previewfancy", "Start the process of creating and previewing a fancy sticky.");
                embed.addField("!sticky list <channel id>", "List stickies in a channel");
                embed.addField("!sticky list", "List all channels with stickies"); 

                msg.channel.send(embed);
        }
    }  
    else
    {
        BotFunctions.ShowChannelStickies(msg.guild.id, msg.channel, null);     
    }
});

client.login(process.env.BOT_TOKEN);
