const commands = require(process.cwd()+"/lib/Commands")
class Command_Raid extends commands.Command {
    userlevel_required = commands.USERLEVEL_ADMIN;
    active=true;
    triggers = {
        "raid" : true,
        "direct call" : true
    }
    execute=async function(trigger,params) {
        const raider = await this.tools.Users.get(false,params.raidingBroadcasterId);
        const announce_msg = "Bienvenue à "+raider.get("display_name")+" et à ses "+params.viewers+" zouzous ! Merci pour le raid !"
        this.APIs.Twitch.send_chat_announcement(this.config.Twitch.broadcaster_id,announce_msg)
        this.APIs.OBS.set_input_settings("Texte alerte news", {"text":announce_msg.toUpperCase()})
        this.APIs.OBS.set_input_settings("raider-name", {"text":raider.get("display_name")})
        this.APIs.OBS.set_input_settings("raider-avatar", {"file":raider.get("profile_image_url")})
        this.APIs.OBS.play_sound("SB-Raid-alarm",8)
        this.APIs.OBS.set_source_filter_enabled("Warning raid", "blink", true)
        const _this = this
        setTimeout(function(){
            _this.APIs.OBS.play_sound("SB-raid-emmet",13)
            _this.APIs.OBS.set_source_filter_enabled("News","Show news",true)
        },6000)
    }
    deck_extra = "Qui ? , Combien ?";
    deck_params_format = async function (event) {
        const params_split = event.data.extra.split(",")
        const user = await this.tools.Users.get(params_split[0]);
        var params = {
            "raidingBroadcasterId": user.get("id"),
            "viewers" : params_split[1]
        }
        return params;
    }
}
class Command_Send_Raid extends commands.Command {
    userlevel_required = commands.USERLEVEL_ADMIN;
    active=false;
    triggers = {
        "direct call" : true,
        "tchat" : {
            "alias" : ["!raid"]
        },
    }
    load = async function () {
        const _this = this
        const webmodule = new this.tools.WebModules.WebModule("RaidBus",{"url_key" : "RaidBus"})
        webmodule.on("viewers",async function(call){
            const chatters = await _this.APIs.Twitch.get_chatters(_this.config.Twitch.broadcaster_id)
            var ids_to_load = []
            chatters.forEach(function(v,k) {
                // if (!_this.APIs.Twitch.is_bot(v.user_login))
                    ids_to_load.push(v.user_id)
            })
            const real_chatters = await _this.tools.Users.get_list([],ids_to_load)
            var returns = []
            real_chatters.forEach(function(v,k) {
                returns.push({
                    "name" : v.get("display_name"),
                    "avatar" : v.get("avatar") ? v.get("avatar") : v.get("profile_image_url")
                })
            })
            return returns
        })
    }
    execute=async function(trigger,params) {
        var params_split = params.content.trim().split(" ")
        if (params_split.length<2) {
            return false;
        }
        const dest_user = await this.tools.Users.get(params_split[1])
        if (await this.APIs.Twitch.start_a_raid(this.config.Twitch.broadcaster_id,dest_user.id)) {
            
        } else {
            console.log("Le raid n'a pas pu se créer.")
        }
    }
    deck_extra = "Qui ?";
    deck_params_format = async function (event) {
        var params = {
            "content": "!raid "+event.data.extra
        }
        return params;
    }
}

exports.command_list = {
    "raid in" : Command_Raid,
    "raid out" : Command_Send_Raid
}