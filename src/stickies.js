const {Stickies} = require("./sticky.js");

if (!global.stickies)
    global.stickies = new Stickies();

module.exports = global.stickies;