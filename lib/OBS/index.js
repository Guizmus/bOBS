var obs_client = false;
var config;
const OBSWebSocket = require('obs-websocket-js').default;

async function initialize(_config) {
    config = _config.OBS;
    if (config.active) {
        obs_client = new OBSWebSocket()
        console.log("OBSAPI : connecting")
        await obs_client.connect(config.url, process.env.OBS_TOKEN)
            .catch(function (err) {
                console.log("Error connecting to OBS Websocket server", err);
                obs_client = false;
            });
        if (config.soundboard_scene)
            await load_soundboard();
        start_animation_queue();
    }
}
exports.initialize = initialize

// fonctions de base de l'API OBS
/**
 * Permet d'appeler l'API directement, pour tout appel non présent dans la lib
 * @param {string} key clef de la requête OBS. c.f. https://wiki.streamer.bot/en/Broadcasters/OBS/Requests/
 * @param {object} params paramètres de la requête OBS
 * @param {function} callback function appelée avec les résultats de la requête
 * @returns {object} réponse brute du serveur OBS
 */
async function call(key, params = {}, callback = function () { }) {
    if (obs_client) {
        var ret = await obs_client.call(key, params)
        callback(ret)
        return ret
    }
    return false
}
exports.call = call;

/**
 * Permet d'appeler l'API directement, pour tout appel non présent dans la lib, par groupe
 * @param {string} call_array array d'objets JSON contenant la clef et les paramètres d'une requête chacun
 * @param {function} callback function appelée avec les résultats de la requête
 * @returns {object} réponse brute du serveur OBS
 */
async function call_batch(call_array, callback = function () { }) {
    if (obs_client) {
        var ret = await obs_client.callBatch(call_array).then(function (r) { callback(r) })
        callback(ret)
        return ret
    }
    return false
}
exports.call_batch = call_batch;

/**
 * récupère la scène active
 * https://wiki.streamer.bot/en/Broadcasters/OBS/Requests/Scene-Requests/GetCurrentProgramScene
 * @param {function} callback function appelée avec le nom de la scène active
 * @returns {string} nom de la scène active
 */
async function get_current_scene(callback = function () { }) {
    var results = await call("GetCurrentProgramScene")
    callback(results.currentProgramSceneName)
    return results.currentProgramSceneName
}
exports.get_current_scene = get_current_scene

/**
 * change de scène
 * https://wiki.streamer.bot/en/Broadcasters/OBS/Requests/Scene-Requests/SetCurrentProgramScene
 * @param {string} scene_name nom de la scène à activer
 * @param {function} callback function appelée une fois la scène changée
 * @returns {object} retour du serveur
 */
async function set_current_scene(scene_name, callback = function () { }) {
    var results = await call("SetCurrentProgramScene", { "sceneName": scene_name })
    callback(results)
    return results
}
exports.set_current_scene = set_current_scene

/**
 * récupère les paramètres actuels d'une source
 * https://wiki.streamer.bot/en/Broadcasters/OBS/Requests/Input-Requests/GetInputSettings
 * @param {string} input_name nom de la source à récupérer
 * @param {function} callback function appelée avec les détails des paramètres de la source, et le type de source
 * @returns {array} détails des paramètres de la source, et le type de source
 */
async function get_input_settings(input_name, callback = function () { }) {
    var results = await call("GetInputSettings", { "inputName": input_name })
    callback(results.inputSettings, results.inputKind)
    return [results.inputSettings, results.inputKind]
}
exports.get_input_settings = get_input_settings

/**
 * applique des nouveaux paramètres à une source
 * https://wiki.streamer.bot/en/Broadcasters/OBS/Requests/Input-Requests/SetInputSettings
 * @param {string} input_name nom de la source à modifier
 * @param {object} input_settings nouveaux paramètres à appliquer
 * @param {function} callback function appelée une fois les paramètres appliqués
 * @returns {object} retour du serveur
 */
async function set_input_settings(input_name, input_settings, callback = function () { }) {
    var results = await call("SetInputSettings", { "inputName": input_name, "inputSettings": input_settings })
    callback(results)
    return results
}
exports.set_input_settings = set_input_settings

/**
 * liste des items d'une scène. utile pour récupérer l'ID d'une source dans une scène afin de gérer son affichage
 * https://wiki.streamer.bot/en/Broadcasters/OBS/Requests/Scene-Item-Requests/GetSceneItemList
 * @param {string} scene_name nom de la scène à récupérer
 * @param {function} callback function appelée avec la liste des sources
 * @returns {array} liste des sources de la scène
 */
async function get_scene_item_list(scene_name, callback = function () { }) {
    var results = await call("GetSceneItemList", { "sceneName": scene_name })
    callback(results.sceneItems)
    return results.sceneItems
}
exports.get_scene_item_list = get_scene_item_list

/**
 * id d'une souce d'une scène
 * https://wiki.streamer.bot/en/Broadcasters/OBS/Requests/Scene-Item-Requests/GetSceneItemId
 * @param {string} scene_name nom de la scène à récupérer
 * @param {string} source_name nom de la source à récupérer
 * @param {function} callback function appelée avec l'id de la source
 * @returns {int} id de la source dans la scène
 */
async function get_scene_item_id(scene_name, source_name, callback = function () { }) {
    var results = await call("GetSceneItemId", { "sceneName": scene_name, "sourceName": source_name })
    callback(results.sceneItemId)
    return results.sceneItemId
}
exports.get_scene_item_id = get_scene_item_id

/**
 * répond si une source est visible dans une scène actuellement
 * https://wiki.streamer.bot/en/Broadcasters/OBS/Requests/Scene-Item-Requests/GetSceneItemEnabled
 * @param {string} scene_name nom de la scène à analyser
 * @param {int} scene_item_id identifiant de la source dans la scène
 * @param {function} callback function appelée avec l'état d'activation de la source
 * @returns {bool} état d'activation de la source
 */
async function get_scene_item_enabled(scene_name, scene_item_id, callback = function () { }) {
    var results = await call("GetSceneItemEnabled", { "sceneName": scene_name, "sceneItemId": scene_item_id })
    callback(results.sceneItemEnabled)
    return results.sceneItemEnabled
}
exports.get_scene_item_enabled = get_scene_item_enabled

/**
 * active ou désactive une source dans une scène
 * https://wiki.streamer.bot/en/Broadcasters/OBS/Requests/Scene-Item-Requests/SetSceneItemEnabled
 * @param {string} scene_name nom de la scène à modifier
 * @param {int} scene_item_id identifiant de la source dans la scène
 * @param {int} scene_item_enabled état d'activation de la source à appliquer
 * @param {function} callback function appelée une fois la source activée/désactivée
 * @returns {object} retour du serveur
 */
async function set_scene_item_enabled(scene_name, scene_item_id, scene_item_enabled, callback = function () { }) {
    var results = await call("SetSceneItemEnabled", { "sceneName": scene_name, "sceneItemId": scene_item_id, "sceneItemEnabled": scene_item_enabled })
    callback(results)
    return results
}
exports.set_scene_item_enabled = set_scene_item_enabled

/**
 * active ou désactive un filtre sur une source
 * https://wiki.streamer.bot/en/Broadcasters/OBS/Requests/Filter-Requests/SetSourceFilterEnabled
 * @param {string} source_name nom de la source portant de filtre (source ou scène)
 * @param {string} filter_name nom du filtre
 * @param {bool} filter_enabled état d'activation du filtre
 * @param {function} callback function appelée une fois la source activée/désactivée
 * @returns {object} retour du serveur
 */
async function set_source_filter_enabled(source_name, filter_name, filter_enabled, callback = function () { }) {
    var results = await call("SetSourceFilterEnabled", { "sourceName": source_name, "filterName": filter_name, "filterEnabled": filter_enabled })
    callback(results)
    return results
}
exports.set_source_filter_enabled = set_source_filter_enabled

/**
 * raffraichit le cache d'une source navigateur
 * https://wiki.streamer.bot/en/Broadcasters/OBS/Requests/Additional-Request-Info/RefreshBrowserSource
 * @param {string} input_name nom de la source à actualiser
 * @param {function} callback function appelée une fois la source actualisée
 * @returns {object} retour du serveur
 */
async function refresh_browser_source(input_name, callback = function () { }) {
    var results = await call("PressInputPropertiesButton", { "inputName": input_name, "propertyName": "refreshnocache" })
    callback(results)
    return results
}
exports.refresh_browser_source = refresh_browser_source

var soundboard_items = {};
async function load_soundboard() {
    var results = await call("GetSceneItemList", { "sceneName": config.soundboard_scene })
    if (results && results.sceneItems && results.sceneItems.length)
        results.sceneItems.forEach(function (i) {
            soundboard_items[i.sourceName] = i
        });
    var params = [];
    Object.keys(soundboard_items).forEach(function (i) {
        soundboard_items[i].currently_enabled = false;
        params.push({
            requestType: "SetSceneItemEnabled",
            requestData: { "sceneName": "Soundboard", "sceneItemId": soundboard_items[i].sceneItemId, "sceneItemEnabled": false }
        })
    })
    return await call_batch(params)
}
/**
 * Joue un son du soundboard
 * @param {string} sound_name nom de la source son dans la scène soundboard
 * @param {float} duration nombre de secondes du son
 */
function play_sound(sound_name, duration) {
    if (soundboard_items[sound_name].currently_enabled) {
        return false;
    }
    soundboard_items[sound_name].currently_enabled = true;
    call("SetSceneItemEnabled", { "sceneName": "Soundboard", "sceneItemId": soundboard_items[sound_name].sceneItemId, "sceneItemEnabled": true })
    setTimeout(function () {
        soundboard_items[sound_name].currently_enabled = false
        call("SetSceneItemEnabled", { "sceneName": "Soundboard", "sceneItemId": soundboard_items[sound_name].sceneItemId, "sceneItemEnabled": false })
    }, duration * 1000)
}
exports.play_sound = play_sound

var animation_queue = []
var animation_queue_playing = false;
var animation_timeout = false;
function queue_animation(animation, duration) {
    animation_queue.push({
        "animation": animation,
        "duration": duration
    })
    if (animation_queue_playing && !animation_timeout) {
        animation_queue_execution()
    }
}
exports.queue_animation = queue_animation
function pause_animation_queue() {
    animation_queue_playing = false;
}
exports.pause_animation_queue = pause_animation_queue
function start_animation_queue() {
    animation_queue_playing = true;
    if (animation_queue.length > 0 && !animation_timeout) {
        animation_queue_execution()
    }
}
exports.start_animation_queue = start_animation_queue
function animation_queue_execution() {
    if (animation_timeout)
        return false;
    if (animation_queue.length == 0)
        return false;
    if (!animation_queue_playing)
        return false;
    const data = animation_queue.shift()
    animation_timeout = setTimeout(function () {
        animation_timeout = false;
        animation_queue_execution();
    }, data.duration)
    data.animation()
}