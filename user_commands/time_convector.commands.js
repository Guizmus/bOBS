const commands = require(process.cwd()+"/lib/Commands")
class Command_Time_convector extends commands.Command {
    userlevel_required = commands.USERLEVEL_ADMIN;
    active=true;
    background_path="F:/twitch/ressources/DMC12-2/DMC12";
    background_quantity=11;
    triggers = {
        "tchat" : {
            "alias" : ["!convecteur"]
        },
        "channel points" : {
            "ids" : ["a6e68371-b0ca-4110-88d6-7fb1fb889da1"]
        },
        "direct call" : true
    }
    execute=async function(trigger,params) {
        this.APIs.OBS.set_current_scene("Discussion")
        this.APIs.OBS.play_sound("SB-BTTF-timetravel",7)
        var new_bg = this.background_path+" ("+(1+Math.floor(this.background_quantity*Math.random()))+").png"
        this.APIs.OBS.set_source_filter_enabled("Thunder FX", "Flash", true)
        const _this = this;
        setTimeout(function(){
            _this.APIs.OBS.set_source_filter_enabled("Discussion", "Flash", true)
            setTimeout(function(){
                _this.APIs.OBS.set_input_settings("fond-DMC12", {"file":new_bg})
            },500)
        },1500)
    }
}

exports.command_list = {
    "time convector" : Command_Time_convector
}