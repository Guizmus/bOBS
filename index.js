const _config = require('./config.json');

const APIs = {
    "OBS": require('./lib/OBS/'),
    "Twitch": require('./lib/Twitch/')
}
start()
async function start()
{
    await APIs.OBS.initialize(_config);
    await APIs.Twitch.initialize(_config);
    on_load();
}

const commands = require("./lib/commands/")
async function on_load()
{
    console.log("On load !")
    // à partir d'ici, toutes les fonctions sont disponibles
    // appel synchrone, on attend le résultat avant d'avancer
    // console.log(await APIs.OBS.get_current_scene())
    // ou appel asynchrone, on lance l'appel et on donne une fonction en callback
    // APIs.Twitch.on_channel_redemption_add(console.log)

    await commands.initialize(APIs,_config)
    commands.trigger("test",{
        "param_test":true
    })
}

async function examples() {
    var callback = console.log

    // OBS, appels asynchrones
    APIs.OBS.get_current_scene(callback)
    APIs.OBS.set_current_scene("Lancement", callback)
    APIs.OBS.get_input_settings("texte intro", callback)
    APIs.OBS.set_input_settings("texte intro", { height: 500 }, callback)
    APIs.OBS.get_scene_item_list("Lancement", callback)
    APIs.OBS.get_scene_item_enabled("Lancement", 10, callback) // le numéro est issue de la clef sceneItemId du get précédent
    APIs.OBS.set_scene_item_enabled("Lancement", 10, true, callback)
    APIs.OBS.set_source_filter_enabled("Lancement", "intro", true, callback)

    // OBS, appels synchrones
    console.log(await APIs.OBS.get_current_scene())
    console.log(await APIs.OBS.set_current_scene("Lancement"))
    console.log(await APIs.OBS.get_input_settings("texte intro"))
    console.log(await APIs.OBS.set_input_settings("texte intro", { height: 500 }))
    console.log(await APIs.OBS.get_scene_item_list("Lancement"))
    console.log(await APIs.OBS.get_scene_item_enabled("Lancement", 10)) // le numéro est issue de la clef sceneItemId du get précédent
    console.log(await APIs.OBS.set_scene_item_enabled("Lancement", 10, true))
    console.log(await APIs.OBS.set_source_filter_enabled("Lancement", "intro", true))

    // Twitch, appels asynchrones
    APIs.Twitch.get_user("Nastr0", callback)
    APIs.Twitch.get_channel_informations(39212301, callback) // le broadcaster_id est issu de la clef id du get précédent
    APIs.Twitch.get_channel_followers(39212301, callback)
    APIs.Twitch.get_chatters(39212301, callback)
    APIs.Twitch.send_chat_announcement(39212301, "Hello Wold", callback)
    APIs.Twitch.send_shoutout(39212301, 27433060, callback)
    APIs.Twitch.get_clips(39212301, callback)

    // Twitch, appels synchrones
    console.log(await APIs.Twitch.get_user("Nastr0"))
    console.log(await APIs.Twitch.get_channel_informations(39212301))
    console.log(await APIs.Twitch.get_channel_followers(39212301))
    console.log(await APIs.Twitch.get_chatters(39212301))
    console.log(await APIs.Twitch.send_chat_announcement(39212301, "Hello Wold"))
    console.log(await APIs.Twitch.send_shoutout(39212301, 27433060))
    console.log(await APIs.Twitch.get_clips(39212301))
}