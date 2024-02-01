const { Client, Events, GatewayIntentBits } = require('discord.js');
var discord_client = new Client({ intents: [GatewayIntentBits.Guilds] });;
var config;

async function initialize(_config) {
    config = _config;
    if (!config.Discord.active)
        return false;
    console.log("DiscordAPI : connecting")
    await discord_client.login(process.env.DISCORD_TOKEN)
        .catch(function (err) { console.log("Error connecting to Discord", err); });
}
exports.initialize = initialize


async function post(channel_id, txt_message = "", file_path = "", file_name = "") {
    if (channel_id && config.Discord.active) {
        var params = { "content": txt_message }
        if (file_path)
            params.files = [{
                "attachment": file_path,
                "name": file_name + '.png',
                "description": file_name + '.png'
            }]
        return await discord_client.channels.cache.get(channel_id).send(params)
    }
    return false
}
exports.post = post