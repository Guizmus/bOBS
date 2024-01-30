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

exports.command_list = {
    "discord_link" : Command_Discord_link,
    "gg" : Command_GG,
    "bonjour" : Command_Bonjour
}