const commands = require(process.cwd() + "/lib/Commands")
var webmodule = false;
class Command_Highlight extends commands.Command {
    userlevel_required = commands.USERLEVEL_ADMIN;
    active = true;
    popin = "tchat_message_select";
    triggers = {
        "direct call": true
    }
    load = async function () {
        webmodule = new this.tools.WebModules.WebModule("Highlight", { "url_key": "Highlight" })
    }
    execute = async function (trigger, params) {
        const user = await this.tools.Users.get(params.user)
        var webparams = [
            ["title", "Pensées de " + user.get("display_name")],
            ["avatar", user.get("profile_image_url")],
            ["message", params.message]
        ];
        await this.APIs.OBS.set_input_settings("message_highlight", { "url": webmodule.get_url(webparams) })
        await this.APIs.OBS.refresh_browser_source("message_highlight")
        const source_id = await this.APIs.OBS.get_scene_item_id("Alertes", "message_highlight")
        await this.APIs.OBS.set_scene_item_enabled("Alertes", source_id, true)
        const _this = this;
        setTimeout(function () {
            return _this.APIs.OBS.set_scene_item_enabled("Alertes", source_id, false)
        }, 60 * 1000)
    }
    deck_params_format = async function (call) {
        var params = {
            "user": call.data.popin.message.user.login,
            "message": call.data.popin.message.content
        }
        return params
    }
}

exports.command_list = {
    "highlight": Command_Highlight
}