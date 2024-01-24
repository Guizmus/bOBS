var config;

async function initialize(_config) {
    config = _config.Twitch;
    if (config.active) {
        await refresh_twitch_token()
        await start_eventsub()
        await connect_twitch_tchat()
        await load_botlist()
    }
}
exports.initialize = initialize

var current_token = false;
async function refresh_twitch_token() {
    setTimeout(refresh_twitch_token, 3 * 3600 * 1000) // auto refresh the token every 3 hours

    console.log("TwitchAPI : refreshing token")
    var result = false;
    await fetch("https://id.twitch.tv/oauth2/token?client_id=" + process.env.TWITCH_CLIENTID + "&client_secret=" + process.env.TWITCH_CLIENTSECRET + "&grant_type=refresh_token&refresh_token=" + encodeURIComponent(process.env.TWITCH_REFRESH_TOKEN), {
        method: "POST",
    })
        .then((res) => res.json())
        .then((data) => {
            if (data.access_token) {
                current_token = data.access_token
                result = true
            } else {
                console.log("Error connecting to Twitch API : ", data.message)
                current_token = false;
            }
        })
    return result;
}
/**
 * Permet d'appeler l'API directement, pour tout appel non présent dans la lib
 * @param {string} endpoint API endpoit url
 * @param {string} method GET/POST/PATCH/... 
 * @param {array} vars paramètres GET à ajouter à l'appel
 * @param {object} body corps JSON de la requête quand besoin est
 * @param {function} callback function appelée avec les résultats de la requête
 * @returns {object} json data avec les informations demandées, ou résultat complet si aucun body n'est présent
 */
async function call_API(endpoint, method, vars, body = false, callback = function () { }) {
    console.log("TwitchAPI : calling ",endpoint)
    const vars_get = new URLSearchParams(vars)
    const url = endpoint + "?" + vars_get.toString()
    var fetch_params = {
        method: method,
        headers: {
            "Authorization": "Bearer " + current_token,
            "Client-Id": process.env.TWITCH_CLIENTID
        }
    }
    if (body) {
        fetch_params.headers["Content-Type"] = "application/json"
        fetch_params.body = JSON.stringify(body)
    }
    let res = await fetch(url, fetch_params)
        .catch(function (err) { console.log("Error using Twitch API ", err, endpoint, method, vars, body) })
    if (res.body) {
        res = res.json();
    }
    callback(res)
    return res
}
exports.call_API = call_API

const secret = 'qsdfkqjjù; zecrba';
var eventsub;
async function start_eventsub() {
    console.log("TwitchAPI : connecting to EventSub")
    const { RefreshingAuthProvider } = require('@twurple/auth');
    const { ApiClient } = require('@twurple/api');
    const { DirectConnectionAdapter, EventSubHttpListener } = require('@twurple/eventsub-http');
    const { NgrokAdapter } = require('@twurple/eventsub-ngrok');
    const clientId = process.env.TWITCH_CLIENTID
    const clientSecret = process.env.TWITCH_CLIENTSECRET

    const authProvider = new RefreshingAuthProvider({ clientId, clientSecret });
    const apiClient = new ApiClient({ authProvider });
    await apiClient.eventSub.deleteAllSubscriptions();
    eventsub = new EventSubHttpListener({
        apiClient,
        adapter: new NgrokAdapter({ "port": config.https_port, "ngrokConfig": { "authtoken_from_env": true } }),
        secret: secret
    });
    eventsub.start();
    eventsub.onChannelRedemptionAdd(config.broadcaster_id, e => {
        const event = {
            "broadcasterDisplayName": e.broadcasterDisplayName,
            "broadcasterId": e.broadcasterId,
            "broadcasterName": e.broadcasterName,
            "id": e.id,
            "input": e.input,
            "redemptionDate": e.redemptionDate,
            "rewardCost": e.rewardCost,
            "rewardId": e.rewardId,
            "rewardPrompt": e.rewardPrompt,
            "rewardTitle": e.rewardTitle,
            "status": e.status,
            "userDisplayName": e.userDisplayName,
            "userId": e.userId,
            "userName": e.userName
        }
        listeningTo["on_channel_redemption_add"].forEach(function (callback) { callback(event) })
    });
    eventsub.onChannelFollow(config.broadcaster_id, config.broadcaster_id, e => {
        const event = {
            "broadcasterDisplayName": e.broadcasterDisplayName,
            "broadcasterId": e.broadcasterId,
            "broadcasterName": e.broadcasterName,
            "followDate": e.followDate,
            "userDisplayName": e.userDisplayName,
            "userId": e.userId,
            "userName": e.userName
        }
        listeningTo["on_channel_follow"].forEach(function (callback) { callback(event) })
    });
    eventsub.onChannelRaidTo(config.broadcaster_id, e => {
        const event = {
            "raidedBroadcasterDisplayName": e.raidedBroadcasterDisplayName,
            "raidedBroadcasterId": e.raidedBroadcasterId,
            "raidedBroadcasterName": e.raidedBroadcasterName,
            "raidingBroadcasterDisplayName": e.raidingBroadcasterDisplayName,
            "raidingBroadcasterId": e.raidingBroadcasterId,
            "raidingBroadcasterName": e.raidingBroadcasterName,
            "viewers": e.viewers
        }
        listeningTo["on_channel_raid_to"].forEach(function (callback) { callback(event) })
    });
    eventsub.onChannelPollEnd(config.broadcaster_id, e => {
        const event = {
            "bitsPerVote": e.bitsPerVote,
            "broadcasterDisplayName": e.broadcasterDisplayName,
            "broadcasterId": e.broadcasterId,
            "broadcasterName": e.broadcasterName,
            "channelPointsPerVote": e.channelPointsPerVote,
            "choices": e.choices,
            "endDate": e.endDate,
            "id": e.id,
            "isBitsVotingEnabled": e.isBitsVotingEnabled,
            "isChannelPointsVotingEnabled": e.isChannelPointsVotingEnabled,
            "startDate": e.startDate,
            "status": e.status,
            "title": e.title
        }
        listeningTo["on_channel_poll_end"].forEach(function (callback) { callback(event) })
    });
}
var listeningTo = {
    "on_channel_redemption_add": [],
    "on_channel_follow": [],
    "on_channel_raid_to": [],
    "on_channel_poll_end": [],
    "on_tchat_message" : []
}
/**
 * Ajoute un callback pour les achats de récompenses en points de chaine
 * @param {function} new_callback fonction à appeler lors de l'event
 */
function on_channel_redemption_add(new_callback) {
    listeningTo["on_channel_redemption_add"].push(new_callback)
}
exports.on_channel_redemption_add = on_channel_redemption_add;
/**
 * Ajoute un callback pour les nouveaux follows
 * @param {function} new_callback fonction à appeler lors de l'event
 */
function on_channel_follow(new_callback) {
    listeningTo["on_channel_follow"].push(new_callback)
}
exports.on_channel_follow = on_channel_follow;
/**
 * Ajoute un callback pour les raids reçus
 * @param {function} new_callback fonction à appeler lors de l'event
 */
function on_channel_raid_to(new_callback) {
    listeningTo["on_channel_raid_to"].push(new_callback)
}
exports.on_channel_raid_to = on_channel_raid_to;
/**
 * Ajoute un callback pour les fins de sondages
 * @param {function} new_callback fonction à appeler lors de l'event
 */
function on_channel_poll_end(new_callback) {
    listeningTo["on_channel_poll_end"].push(new_callback)
}
exports.on_channel_poll_end = on_channel_poll_end;

var tchat_connected = false;
var twitch_chat_client = false;
const tmi = require("tmi.js")
async function connect_twitch_tchat() {
    console.log("TwitchAPI : connecting to Twitch tchat")
	if (twitch_chat_client)
		await twitch_chat_client.disconnect()
	var params = {
        "identity": {
            "username": config.channelname,
            "password": "oauth:"+current_token
        },
        "channels": ["#"+config.channelname]
    };
	twitch_chat_client = new tmi.client(params);
	twitch_chat_client.on('message', tchat_message_handle);

	await twitch_chat_client.connect().then(function(results){
        tchat_connected = true;
	}).catch(function(err) {console.log("Error connecting to Twitch chat",err);});
}
function say (target,msg) {
    if (tchat_connected && target) {
        twitch_chat_client.say(target,msg)
    }
}
exports.tchat_say = say;

function tchat_message_handle (target, context, msg, self) {
    const message = {
        target : target,
        context : context,
        content : msg,
        self : self
    }
    listeningTo["on_tchat_message"].forEach(function(listener) {
        listener(message)
    })
}
/**
 * Ajoute un callback pour chaque message posté dans le tchat
 * @param {function} new_callback fonction à appeler lors de l'event
 */
function on_tchat_message (new_callback) {
    listeningTo["on_tchat_message"].push(new_callback)
}
exports.on_tchat_message = on_tchat_message



/**
 * https://dev.twitch.tv/docs/api/reference/#get-users
 * retourne les informations sur un user unique, en utilisant son login
 * @param {string} login username de l'utilisateur à récupérer
 * @param {function} callback fonction à appeler avec les résultats de la requête
 * @returns {object} json data avec les informations demandées
 */
async function get_user_by_login(login, callback = function () { }) {
    var res = await call_API("https://api.twitch.tv/helix/users", "GET", [["login", login]])
    if (res && res.data && res.data.length) {
        callback(res.data[0])
        return res.data[0]
    }
    callback(false)
    return false
}
exports.get_user_by_login = get_user_by_login
/**
 * https://dev.twitch.tv/docs/api/reference/#get-users
 * retourne les informations sur un user unique, en utilisant son id
 * @param {string} id id de l'utilisateur à récupérer
 * @param {function} callback fonction à appeler avec les résultats de la requête
 * @returns {object} json data avec les informations demandées
 */
async function get_user_by_id(id, callback = function () { }) {
    var res = await call_API("https://api.twitch.tv/helix/users", "GET", [["id", id]])
    if (res && res.data && res.data.length) {
        callback(res.data[0])
        return res.data[0]
    }
    callback(false)
    return false
}
exports.get_user_by_id = get_user_by_id

async function get_users (logins=[],ids=[],callback=function(){}) {
    var query = []
    logins.forEach(function(v,k) {
        query.push(["login",v])
    })
    ids.forEach(function(v,k) {
        query.push(["id",v])
    })
    var res = await call_API("https://api.twitch.tv/helix/users", "GET", query)
    if (res && res.data && res.data.length) {
        callback(res.data)
        return res.data
    }
    callback(false)
    return false
}
exports.get_users = get_users

/**
 * https://dev.twitch.tv/docs/api/reference/#get-channel-information
 * retourne les informations à propos d'un channel, en utilisant son id (récupéré dans get-users)
 * @param {int} broadcaster_id identifiant du channel à analyser
 * @param {function} callback fonction à appeler avec les résultats de la requête
 * @returns {object} json data avec les informations demandées
 */
async function get_channel_informations(broadcaster_id, callback = function () { }) {
    var res = await call_API("https://api.twitch.tv/helix/channels", "GET", [["broadcaster_id", broadcaster_id]])
    if (res && res.data && res.data.length) {
        callback(res.data[0])
        return res.data[0]
    }
    callback(false)
    return false
}
exports.get_channel_informations = get_channel_informations

/**
 * https://dev.twitch.tv/docs/api/reference/#get-channel-followers
 * retourne les 20 derniers followers d'un channel, en commançant par le plus récent
 * @param {int} broadcaster_id identifiant du channel à analyser
 * @param {function} callback fonction à appeler avec les résultats de la requête
 * @returns {array} json data avec les informations demandées
 */
async function get_channel_followers(broadcaster_id, callback = function () { }) {
    var res = await call_API("https://api.twitch.tv/helix/channels/followers", "GET", [["broadcaster_id", broadcaster_id]])
    if (res && res.data && res.data.length) {
        callback(res.data)
        return res.data
    }
    callback([])
    return []
}
exports.get_channel_followers = get_channel_followers

/**
 * https://dev.twitch.tv/docs/api/reference/#get-chatters
 * retourne les users connectés au chat
 * @param {int} broadcaster_id identifiant du channel à analyser
 * @param {function} callback fonction à appeler avec les résultats de la requête
 * @returns {array} json data avec les informations demandées
 */
async function get_chatters(broadcaster_id, callback = function () { }) {
    var res = await call_API("https://api.twitch.tv/helix/chat/chatters", "GET", [["broadcaster_id", broadcaster_id], ["moderator_id", broadcaster_id]]);
    if (res && res.data && res.data.length) {
        callback(res.data)
        return res.data
    }
    callback([])
    return []
}
exports.get_chatters = get_chatters

/**
 * https://dev.twitch.tv/docs/api/reference/#send-chat-announcement
 * fait une annonce dans le tchat
 * @param {int} broadcaster_id identifiant du channel visé
 * @param {string} message contenu de l'annonce
 * @param {function} callback fonction à appeler une fois l'annonce publiée
 * @returns {object} réponse du serveur
 */
async function send_chat_announcement(broadcaster_id, message, callback = function () { }) {
    var res = await call_API("https://api.twitch.tv/helix/chat/announcements", "POST", [["broadcaster_id", broadcaster_id], ["moderator_id", broadcaster_id]], { "message": message })
    callback(res)
    return res;
}
exports.send_chat_announcement = send_chat_announcement

/**
 * https://dev.twitch.tv/docs/api/reference/#send-a-shoutout
 * fait une dédicace dans le tchat
 * @param {int} from_id identifiant du channel qui émet la dédicace
 * @param {int} to_id identifiant du channel qui reçoit la dédicace
 * @param {function} callback fonction à appeler une fois la dédicace effectuée
 * @returns {object} réponse du serveur
 */
async function send_shoutout(from_id, to_id, callback = function () { }) {
    var res = await call_API("https://api.twitch.tv/helix/chat/shoutouts", "POST", [["from_broadcaster_id", from_id], ["to_broadcaster_id", to_id], ["moderator_id", from_id]])
    callback(res)
    return res;
}
exports.send_shoutout = send_shoutout

/**
 * https://dev.twitch.tv/docs/api/reference/#get-clips
 * retourne les users connectés au chat
 * @param {int} broadcaster_id identifiant du channel visé
 * @param {function} callback fonction à appeler avec les clips reçus
 * @returns {array} liste de clips 
 */
async function get_clips(broadcaster_id, callback = function () { }) {
    var res = await call_API("https://api.twitch.tv/helix/clips", "GET", [["broadcaster_id", broadcaster_id]])
    if (res && res.data && res.data.length) {
        callback(res.data)
        return res.data;
    }
    return false
}
exports.get_clips = get_clips




/**
 * https://dev.twitch.tv/docs/api/reference/#create-poll
 * crée un sondage
 * @param {int} broadcaster_id identifiant du channel visé
 * @param {string} title titre du sondage
 * @param {array} choices liste des choix du sondage
 * @param {bool} channel_points_voting_enabled votes par points autorisés ou non
 * @param {int} channel_points_per_vote cout du vote par points
 * @param {int} duration durée du sondage
 * @param {function} callback fonction à appeler avec les données du sondage
 * @returns {object} data du sondage
 */
async function create_poll(broadcaster_id,title,choices,channel_points_voting_enabled=false,channel_points_per_vote=100,duration=15,callback = function () { }) {
    var res = await call_API("https://api.twitch.tv/helix/polls", "POST", [],{
        "broadcaster_id": broadcaster_id,
        "title": title,
        "choices": choices,
        "channel_points_voting_enabled": channel_points_voting_enabled,
        "channel_points_per_vote": channel_points_per_vote,
        "duration": duration
    })
    if (res && res.data && res.data.length) {
        callback(res.data)
        return res.data;
    }
    return false
}
exports.create_poll = create_poll


/**
 * https://dev.twitch.tv/docs/api/reference/#get-clips
 * retourne les users connectés au chat
 * @param {int} from_broadcaster_id identifiant du channel d'origine
 * @param {int} to_broadcaster_id identifiant du channel visé
 * @param {function} callback fonction à appeler avec les données du raid si la création réussit
 * @returns {object} raid data 
 */
async function start_a_raid(from_broadcaster_id, to_broadcaster_id, callback = function () { }) {
    var res = await call_API("https://api.twitch.tv/helix/raids", "POST", [["from_broadcaster_id", from_broadcaster_id],["to_broadcaster_id", to_broadcaster_id]])
    if (res && res.data && res.data.length) {
        callback(res.data[0])
        return res.data[0];
    }
    return false
}
exports.start_a_raid = start_a_raid


var botlist = []
async function load_botlist () {
	await fetch("https://api.twitchinsights.net/v1/bots/all",{
		method: "GET"
    })
    .then((res) => res.json())
    .then((data) => {
        data.bots.forEach(function(bot) {
            botlist.push(bot[0])
        })
    })
    .catch(function(err) {console.log("Error retrieving botlist",err);});
}
function is_bot(user_login) {
    return botlist.includes(user_login.toLowerCase())
}
exports.is_bot = is_bot;