const BotFunctions = require("../bot_functions.js");
const Colors = require("../messages/colors.js");

function GetMessagePropertiesFromUser(msg, cb) // Gets the values from a user required to create a Fancy Sticky
{
    try
    {
        let hex_color;
        let title;
        let message;
    
        // Get color
        BotFunctions.SimpleMessage(msg.channel, "What hex color do you want? Example: #FFF68F (There are plenty of online tools to get that. Enter nocolor to use default.)", "What Color?", Colors["question"], sentMessage => {
            BotFunctions.WaitForUserResponse(msg.channel, msg.member, 300000, response => {
                BotFunctions.DeleteMessage(sentMessage);
                hex_color = response.content != "nocolor" ? response.content : "#FFF043";
    
                // Get title
                BotFunctions.SimpleMessage(msg.channel, "What should the title be? (Enter notitle to skip)", "What Title?", Colors["question"], sentMessage => {
                    BotFunctions.WaitForUserResponse(msg.channel, msg.member, 300000, response => {
                        BotFunctions.DeleteMessage(sentMessage);
    
                        if (response.content != "notitle")
                            title = response.content;
    
                        // Get message
                        BotFunctions.SimpleMessage(msg.channel, "What should the message be?", "What Message?", Colors["question"], sentMessage => {
                            BotFunctions.WaitForUserResponse(msg.channel, msg.member, 600000, response => {
                                BotFunctions.DeleteMessage(sentMessage);
                                
                                message = response.content;    
                                cb(hex_color, title, message); // Return back the data        
                            });          
                        });
                    });
                });
            });
        });
    }
    catch (error)
    {
        console.error(error);
    }
}

module.exports = {GetMessagePropertiesFromUser};