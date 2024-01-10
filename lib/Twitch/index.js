var config;
var credentials;

async function initialize(_config,_credentials) {
    config = _config.Twitch;
    credentials = _credentials.Twitch;
    if (config.active) {
        await refresh_twitch_token()
    }
}
exports.initialize = initialize

var current_token = false;
async function refresh_twitch_token () {
    setTimeout(refresh_twitch_token,3*3600*1000) // auto refresh the token every 3 hours

	console.log("TwitchAPI call : refreshing token for Twitch")
    await fetch("https://id.twitch.tv/oauth2/token?client_id="+credentials.clientID+"&client_secret="+credentials.clientSecret+"&grant_type=refresh_token&refresh_token="+encodeURIComponent(credentials.refresh), {
		method: "POST",
    })
    .then((res) => res.json())
    .then((data) => {
        if (data.access_token) {
            current_token = data.access_token
            return true
        } else {
            console.log("Error connecting to Twitch API : ",data.message)
            current_token = false;
            return false
        }
    })
}

async function call_API (endpoint,method,vars,body=false,callback=function(){}) {
    const vars_get = new URLSearchParams(vars)
    const url = endpoint + "?" + vars_get.toString()
    var fetch_params = {
        method: method,
        headers : {
            "Authorization" : "Bearer "+current_token,
            "Client-Id" : credentials.clientID
        }
    }
    if (body) {
        fetch_params.headers["Content-Type"] = "application/json"
        fetch_params.body = JSON.stringify(body)
    }
    let res = await fetch(url,fetch_params)
    .catch(function(err) {console.log("Error using Twitch API ",err,endpoint,method,vars,body)})
    if (res.body) {
        res = res.json();
    }
    callback(res)
    return res
}

exports.call_API = call_API

// https://dev.twitch.tv/docs/api/reference/#get-users
// retourne les informations sur un user unique, en utilisant son login
async function get_user(login,callback=function(){}) {
    var res = await call_API("https://api.twitch.tv/helix/users","GET",[["login",login]])
    if (res && res.data && res.data.length) {
        callback(res.data[0])
        return res.data[0]
    }
    callback(false)
    return false
}
exports.get_user = get_user

// https://dev.twitch.tv/docs/api/reference/#get-channel-information
// retourne les informations à propos d'un channel, en utilisant son id (récupéré dans get-users)
async function get_channel_informations(broadcaster_id,callback=function(){}) {
    var res = await call_API("https://api.twitch.tv/helix/channels","GET",[["broadcaster_id",broadcaster_id]])
    if (res && res.data && res.data.length) {
        callback(res.data[0])
        return res.data[0]
    }
    callback(false)
    return false
}
exports.get_channel_informations = get_channel_informations

// https://dev.twitch.tv/docs/api/reference/#get-channel-followers
// retourne les 20 derniers followers d'un channel, en commançant par le plus récent
async function get_channel_followers(broadcaster_id,callback=function(){}) {
    var res = await call_API("https://api.twitch.tv/helix/channels/followers","GET",[["broadcaster_id",broadcaster_id]])
    if (res && res.data && res.data.length) {
        callback(res.data)
        return res.data
    }
    callback([])
    return []
}
exports.get_channel_followers = get_channel_followers

// https://dev.twitch.tv/docs/api/reference/#get-chatters
// retourne les users connectés au chat
async function get_chatters(broadcaster_id,callback=function(){}) {
    var res = await call_API("https://api.twitch.tv/helix/chat/chatters","GET",[["broadcaster_id",broadcaster_id],["moderator_id",broadcaster_id]]);
    if (res && res.data && res.data.length) {
        callback(res.data)
        return res.data
    }
    callback([])
    return []
}
exports.get_chatters = get_chatters

// https://dev.twitch.tv/docs/api/reference/#send-chat-announcement
// fait une annonce dans le tchat
async function send_chat_announcement(broadcaster_id,message,callback=function(){}) {
    var res = await call_API("https://api.twitch.tv/helix/chat/announcements","POST",[["broadcaster_id",broadcaster_id],["moderator_id",broadcaster_id]],{"message" : message})
    callback(res)
    return res;
}
exports.send_chat_announcement = send_chat_announcement

// https://dev.twitch.tv/docs/api/reference/#send-a-shoutout
// fait une dédicace dans le tchat
async function send_shoutout(from_id,to_id,callback=function(){}) {
    var res = await call_API("https://api.twitch.tv/helix/chat/shoutouts","POST",[["from_broadcaster_id",from_id],["to_broadcaster_id",to_id],["moderator_id",from_id]])
    callback(res)
    return res;
}
exports.send_shoutout = send_shoutout

// https://dev.twitch.tv/docs/api/reference/#get-clips
// retourne les users connectés au chat
async function get_clips(broadcaster_id,callback=function(){}) {
    var res = await call_API("https://api.twitch.tv/helix/clips","GET",[["broadcaster_id",broadcaster_id]])
    if (res && res.data && res.data.length) {
        callback(res.data)
        return res.data;
    }
    return false
}
exports.get_clips = get_clips