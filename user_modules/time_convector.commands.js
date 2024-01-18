const commands = require(process.cwd()+"/lib/Commands")
var webmodule;
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
    load=async function() {
        webmodule = new this.tools.WebModules.WebModule("Odometer",{"url_key" : "Odometer"})
        const _this = this
        webmodule.on("update_time",function(call){
            if (!time_in_sync) {
                time_in_sync = true
                _this.APIs.OBS.set_source_filter_enabled("Alertes", "show odometer", true)
            }
            if (time_meter_value >= time_meter_max) {
                trigger_time_meter_max();
                return time_meter_max
            }
            return time_meter_value
        })
        await this.APIs.OBS.set_input_settings("compteur MPH", {"url":webmodule.get_url()})
        this.APIs.OBS.refresh_browser_source("compteur MPH")
    }
    execute=async function(trigger,params) {
        if (params && params.add_time) {
            add_time(params.add_time)
        } else {
            const original_scene = await this.APIs.OBS.get_current_scene()
            if (original_scene == "Lancement")
                return false;
            if (original_scene != "Discussion")
                await this.APIs.OBS.set_current_scene("Discussion")
            this.APIs.OBS.play_sound("SB-BTTF-timetravel",7)
            var new_bg = this.background_path+" ("+(1+Math.floor(this.background_quantity*Math.random()))+").png"
            this.APIs.OBS.set_source_filter_enabled("Thunder FX", "Flash", true)
            const _this = this;
            setTimeout(function(){
                _this.APIs.OBS.set_source_filter_enabled("Discussion", "Flash", true)
                setTimeout(function(){
                    _this.APIs.OBS.set_input_settings("fond-DMC12", {"file":new_bg})
                    if (original_scene != "Discussion")
                        setTimeout(function() {
                            _this.APIs.OBS.set_current_scene(original_scene)
                        },3000)
                },500)
            },1500)
        }
    }
}

var time_meter_value = 0;
const time_meter_max = 88;
var time_in_sync = true;
function add_time(time=8) {
    time_meter_value += time
    time_in_sync = false
}

function trigger_time_meter_max () {
    time_meter_value = 0;
    commands.trigger("time convector",{})
}

exports.command_list = {
    "time convector" : Command_Time_convector
}