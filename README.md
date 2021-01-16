# Discord_Sticky-Message-Bot
A work in progress bot that keeps important stuff at the bottom of channels

## Features
* Unlike the others, EVERYTHING'S FREE!!
* Unlimited stickies per channel, with commands to easily keep track
* Fast sticky management (All data is cached from the local database on start)
* Channel-based timers for sticky cooldowns which reset when users send messages

![Example Image](https://i.imgur.com/2RUZb2q.png)

### Commands:
    !sticky add <channel id> <discord message> - Add a sticky to a channel
    !sticky remove <channel id> <sticky id> - Remove a sticky from a channel
    !sticky removeall <channel id> - Remove all stickies from a channel
    !sticky preview <discord message> - Preview what a sticky looks like
    !sticky list <channel id> - List stickies in a channel
    !sticky list - List all channels with stickies
