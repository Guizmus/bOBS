const commands = require(process.cwd()+"/lib/Commands")
var webmodule = false;
class Command_Highlight extends commands.Command {
    userlevel_required = commands.USERLEVEL_ADMIN;
    triggers = {
        "direct call" : true
    }
    execute=async function(trigger,params) {
        if (!webmodule) {
            webmodule = new this.tools.WebModules.WebModule("Highlight",{"url_key" : "Highlight"})
        }
        var params_split = params.content.trim().split(" ")
        if (params_split.length<2) {
            return false;
        }
        const user = await this.tools.Users.get(params.user)
        var webparams = [
            ["title","Pensées de "+user.get("display_name")],
            ["avatar",user.get("profile_image_url")],
            ["message",params.message]
        ];
        await this.APIs.OBS.set_input_settings("message_highlight", {"url":webmodule.get_url(webparams)})
        await this.APIs.OBS.refresh_browser_source("message_highlight")
        const source_id = await this.APIs.OBS.get_scene_item_id("Alertes", "message_highlight")
        await this.APIs.OBS.set_scene_item_enabled("Alertes", source_id, true)
        const _this = this;
        setTimeout(function() {
            return _this.APIs.OBS.set_scene_item_enabled("Alertes", source_id, false)
        },60*1000)
    }
}

exports.command_list = {
    "highlight" : Command_Highlight
}