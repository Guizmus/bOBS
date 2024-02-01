const commands = require(process.cwd()+"/lib/Commands")
class Command_Discord_link extends commands.Command {
    userlevel_required = commands.USERLEVEL_NONE;
    active=true;
    triggers = {
        "tchat" : {
            "alias" : ["!discord"]
        },
        "direct call" : true
    }
    execute=async function(trigger,params) {
        this.APIs.Twitch.tchat_say(this.config.Twitch.channelname,"https://discord.gg/eaXnHyrsQh")
    }
}

class Command_GG extends commands.Command {
    userlevel_required = commands.USERLEVEL_NONE;
    active=true;
    triggers = {
        "tchat" : {
            "alias" : ["!gg"]
        }
    }
    execute=async function(trigger,params) {
        this.APIs.OBS.play_sound("SB-GG",7.5)
    }
}

var has_said_hi = []
var obs_scene_item_id = {}
class Command_Bonjour extends commands.Command {
    userlevel_required = commands.USERLEVEL_NONE;
    active=true;
    log=false;
    triggers = {
        "tchat" : {
            "alias" : ["!bonjour"],
            "all messages" : true
        },
        "channel points" : {
            "ids" : ["d64aa4d5-008c-4762-a986-7c10e9c6bbf0"],
            "titles" : []
        }
    }
    load = async function () {
        obs_scene_item_id["avatar-hello-avatar"] = await this.APIs.OBS.get_scene_item_id("avatar hello", "avatar-hello-avatar")
        obs_scene_item_id["avatar-hello-profilepic"] = await this.APIs.OBS.get_scene_item_id("avatar hello", "avatar-hello-profilepic")
    }
    execute=async function(trigger,params) {
        switch (trigger.type) {
            case "all messages" : 
            
                if (!this.APIs.Twitch.is_bot(params.user.login))
                    if (has_said_hi.includes(params.user.id)===false) {
                        has_said_hi.push(params.user.id)
                        queue_hello_animation(this,params.user)
                        this.APIs.OBS.play_sound("SB-bonjour",5)
                    }
                break;
            case "tchat" : 
            case "channel points" : 
                const user = await this.tools.Users.get(false,params.userId)
                queue_hello_animation(this,user)
                this.APIs.OBS.play_sound("SB-bonjour",5)
                if (has_said_hi.includes(params.userId)===false)
                    has_said_hi.push(params.userId)
                break;
        }
    }
}

var animation_queue = []
var is_playing = false;
function queue_hello_animation(_this,user) {
    animation_queue.push([_this,user]);
    if (is_playing)
        return;
    const params = animation_queue.shift();
    play_hello_animation(params[0],params[1])
}
async function play_hello_animation(_this,user) {
    is_playing = true;
    if (user.get("avatar")) {
        await _this.APIs.OBS.set_input_settings("avatar-hello-avatar", {"file": user.get("avatar")})
        await _this.APIs.OBS.set_scene_item_enabled("avatar hello", obs_scene_item_id["avatar-hello-avatar"], true)
        await _this.APIs.OBS.set_scene_item_enabled("avatar hello", obs_scene_item_id["avatar-hello-profilepic"], false)
    } else {
        await _this.APIs.OBS.set_input_settings("avatar-hello-profilepic", {"file": user.get("profile_image_url")})
        await _this.APIs.OBS.set_scene_item_enabled("avatar hello", obs_scene_item_id["avatar-hello-avatar"], false)
        await _this.APIs.OBS.set_scene_item_enabled("avatar hello", obs_scene_item_id["avatar-hello-profilepic"], true)
    }
    await _this.APIs.OBS.set_source_filter_enabled("Alertes", "Hello", true)
    setTimeout(function(){
        is_playing = false
        if (animation_queue.length>0){
            const params = animation_queue.shift();
            play_hello_animation(params[0],params[1])
        }
    },5000)
}
const first_label = "First !";
class Command_First extends commands.Command {
    active=true;
    log=false;
    triggers = {
        "channel points" : {
            "titles" : [first_label]
        }
    }
    reward=false;
    first_alert_id=false;
    load=async function () {
        const _this = this;
        this.first_alert_id = await this.APIs.OBS.get_scene_item_id("Alertes", "alerte First")
        this.APIs.OBS.set_scene_item_enabled("Alertes", this.first_alert_id, false)
        const current_channel_state = await this.APIs.Twitch.get_stream(this.config.Twitch.broadcaster_id)
        if (!(current_channel_state && (current_channel_state.type=="live"))) {
            const current_rewards = await this.APIs.Twitch.get_reward_list(this.config.Twitch.broadcaster_id,true)
            if (current_rewards && current_rewards.length) {
                current_rewards.forEach(function(reward) {
                    if (reward.title == first_label) 
                        _this.reward = reward
                })
            }
            if (!this.reward){
                const new_reward = await this.APIs.Twitch.create_reward(this.config.Twitch.broadcaster_id, first_label, 1)
                this.reward = new_reward
            }
        }
    }
    execute=async function(trigger,params) {
        const _this = this;
        await this.APIs.Twitch.delete_reward(this.config.Twitch.broadcaster_id, this.reward.id)
        const user = await this.tools.Users.get(false,params.userId)
        var current_avatar = user.get("avatar")
        if (!current_avatar)
            current_avatar = await commands.trigger("avatar_reset",{
                "userId":params.userId
            })
        await _this.APIs.OBS.set_input_settings("first avatar", {"file":current_avatar})
        await this.APIs.OBS.set_scene_item_enabled("Alertes", this.first_alert_id, true)
        setTimeout(function() {
            _this.APIs.OBS.set_scene_item_enabled("Alertes", _this.first_alert_id, false)
        },14000)
    }
}

exports.command_list = {
    "discord_link" : Command_Discord_link,
    "gg" : Command_GG,
    "bonjour" : Command_Bonjour,
    "first" : Command_First
}