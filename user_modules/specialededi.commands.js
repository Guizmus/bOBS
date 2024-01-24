const commands = require(process.cwd()+"/lib/Commands")
var webmodule = false;
class Command_SpecialeDedi extends commands.Command {
    userlevel_required = commands.USERLEVEL_ADMIN;
    active=true;
    triggers = {
        "tchat" : {
            "alias" : ["!sd","!specialededi"]
        },
        "direct call" : true
    }
    execute=async function(trigger,params) {
        if (!webmodule) {
            webmodule = new this.tools.WebModules.WebModule("Speciale_Dedi",{"url_key" : "Speciale_Dedi"})
        }
        var params_split = params.content.trim().split(" ")
        if (params_split.length<2) {
            return false;
        }
        const original_scene = await this.APIs.OBS.get_current_scene()
        if (original_scene == "Lancement")
            return false;
        if (original_scene != "Discussion")
            await this.APIs.OBS.set_current_scene("Discussion")
        const user = await this.tools.Users.get(params_split[1])
        const clips = await this.APIs.Twitch.get_clips(user.get("id"))
        const clip = clips[Math.floor(Math.random()*clips.length)]
        this.APIs.Twitch.send_shoutout(this.config.Twitch.broadcaster_id, user.get("id"))
        var webparams = [
            ["username",user.get("display_name")],
            ["avatar",user.get("profile_image_url")],
            ["clip",clip.thumbnail_url]
        ];
        await this.APIs.OBS.set_input_settings("specialededi", {"url":webmodule.get_url(webparams)})
        await this.APIs.OBS.set_input_settings("clip specialededi", {"url":clip.url})
        await this.APIs.OBS.set_source_filter_enabled("Discussion", "specialededi", true)
        const _this = this;
        setTimeout(function() {
            _this.APIs.OBS.set_source_filter_enabled("Discussion", "end specialdedi", true)
            if (original_scene != "Discussion")
                setTimeout(function() {
                    _this.APIs.OBS.set_current_scene(original_scene)
                },3000)
        },(clip.duration+10.5)*1000)
    }
    deck_extra = "Qui ?";
    deck_params_format = async function (event) {
        var params = {
            "content": "!sd "+event.data.extra
        }
        return params;
    }
}

exports.command_list = {
    "specialededi" : Command_SpecialeDedi
}