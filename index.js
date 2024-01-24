const config = require('./config.json');

const APIs = {
    "OBS": require('./lib/OBS/'),
    "Twitch": require('./lib/Twitch/'),
    "Discord": require('./lib/Discord/'),
    "IADrawer": require('./lib/IADrawer/')
}
const tools = {
    "DB" : require('./lib/DB/'),
    "Users" : require('./lib/Users'),
    "WebModules" : require('./lib/WebModules')
}
start()
async function start()
{
    await APIs.OBS.initialize(config);
    await APIs.Twitch.initialize(config);
    await APIs.Discord.initialize(config);
    await APIs.IADrawer.initialize(config);
    await tools.DB.initialize(config);
    await tools.Users.initialize(config,tools.DB,APIs)
    await tools.WebModules.initialize(config)
    await commands.initialize(config,APIs,tools)
    on_load();
}

const commands = require("./lib/Commands/")
async function on_load()
{
    console.log("On load !")
    // à partir d'ici, toutes les fonctions de APIs et Tools sont disponibles

}