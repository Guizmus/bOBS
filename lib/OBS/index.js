var obs_client = false;
var config;
var credentials;
const OBSWebSocket = require('obs-websocket-js').default;

async function initialize(_config,_credentials) {
    config = _config.OBS;
    credentials = _credentials.OBS;
    if (config.active) {
        obs_client = new OBSWebSocket()
        await obs_client.connect(config.url,credentials)
        .catch(function(err) {
            console.log("Error connecting to OBS Websocket server",err);
            obs_client = false;
        });
    }
}
exports.initialize = initialize

// fonctions de base de l'API OBS
async function call(key,params={},callback=function(){}) {
    if (obs_client) {
        var ret = await obs_client.call(key,params)
        callback(ret)
        return ret
    }
    return false
}
exports.call = call;
async function call_batch(call_array,callback=function(){}) {
    if (obs_client) {
        var ret = await obs_client.callBatch(call_array).then(function(r) {callback(r)})
        callback(ret)
        return ret
    }
    return false
}
exports.call_batch = call_batch;

// scène active
// récupère la scène active
// https://wiki.streamer.bot/en/Broadcasters/OBS/Requests/Scene-Requests/GetCurrentProgramScene
async function get_current_scene(callback=function(){}){
    var results = await call("GetCurrentProgramScene")
    callback(results.currentProgramSceneName)
    return results.currentProgramSceneName
}
exports.get_current_scene = get_current_scene
// change de scène
// https://wiki.streamer.bot/en/Broadcasters/OBS/Requests/Scene-Requests/SetCurrentProgramScene
async function set_current_scene(scene_name,callback=function(){}){
    var results = await call("SetCurrentProgramScene",{"sceneName":scene_name})
    callback(results)
    return results
}
exports.set_current_scene = set_current_scene

// Catégorie : mise à jour des paramètres de sources
// récupère les paramètres actuels d'une source
// https://wiki.streamer.bot/en/Broadcasters/OBS/Requests/Input-Requests/GetInputSettings
async function get_input_settings(input_name,callback=function(){}){
    var results = await call("GetInputSettings",{"inputName":input_name})
    callback(results.inputSettings,results.inputKind)
    return [results.inputSettings,results.inputKind]
}
exports.get_input_settings = get_input_settings
// applique des nouveaux paramètres à une source
// https://wiki.streamer.bot/en/Broadcasters/OBS/Requests/Input-Requests/SetInputSettings
async function set_input_settings(input_name,input_settings,callback=function(){}){
    var results = await call("SetInputSettings",{"inputName":input_name,"inputSettings":input_settings})
    callback(results)
    return results
}
exports.set_input_settings = set_input_settings

// Catégorie : Affichage/masquage de sources dans des scènes
// liste des items d'une scène. utile pour récupérer l'ID d'une source dans une scène afin de gérer son affichage
// https://wiki.streamer.bot/en/Broadcasters/OBS/Requests/Scene-Item-Requests/GetSceneItemList
async function get_scene_item_list(scene_name,callback=function(){}){
    var results = await call("GetSceneItemList",{"sceneName":scene_name})
    callback(results.sceneItems)
    return results.sceneItems
}
exports.get_scene_item_list = get_scene_item_list
// répond si une source est visible dans une scène actuellement
// https://wiki.streamer.bot/en/Broadcasters/OBS/Requests/Scene-Item-Requests/GetSceneItemEnabled
async function get_scene_item_enabled(scene_name,scene_item_id,callback=function(){}){
    var results = await call("GetSceneItemEnabled",{"sceneName":scene_name,"sceneItemId":scene_item_id})
    callback(results.sceneItemEnabled)
    return results.sceneItemEnabled
}
exports.get_scene_item_enabled = get_scene_item_enabled
// active ou désactive une source dans une scène
// https://wiki.streamer.bot/en/Broadcasters/OBS/Requests/Scene-Item-Requests/SetSceneItemEnabled
async function set_scene_item_enabled(scene_name,scene_item_id,scene_item_enabled,callback=function(){}){
    var results = await call("SetSceneItemEnabled",{"sceneName":scene_name,"sceneItemId":scene_item_id,"sceneItemEnabled":scene_item_enabled})
    callback(results)
    return results
}
exports.set_scene_item_enabled = set_scene_item_enabled

// Catégorie : Filtres (de sources et de scènes)
// https://wiki.streamer.bot/en/Broadcasters/OBS/Requests/Filter-Requests/SetSourceFilterEnabled
async function set_source_filter_enabled(source_name,filter_name,filter_enabled,callback=function(){}) {
    var results = await call("SetSourceFilterEnabled",{"sourceName":source_name,"filterName":filter_name,"filterEnabled":filter_enabled})
    callback(results)
    return results
}
exports.set_source_filter_enabled = set_source_filter_enabled