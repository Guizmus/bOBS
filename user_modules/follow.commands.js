const commands = require(process.cwd() + "/lib/Commands")
class Command_Follow extends commands.Command {
    userlevel_required = commands.USERLEVEL_ADMIN;
    active = true;
    triggers = {
        "follow": true,
        "direct call": true
    }
    execute = async function (trigger, params) {
        const user = await this.tools.Users.get(false, params.userId);
        this.APIs.OBS.set_input_settings("Follower-name", { "text": user.get("display_name") })
        this.APIs.OBS.set_input_settings("follower", { "file": user.get("profile_image_url") })
        this.APIs.OBS.play_sound("SB-Follower", 6)
        this.APIs.OBS.set_source_filter_enabled("Alertes", "new follower", true)
    }
    deck_extra = "Qui ?";
    deck_params_format = async function (event) {
        const user = await this.tools.Users.get(event.data.extra);
        var params = {
            "userId": user.get("id")
        }
        return params;
    }
}

exports.command_list = {
    "follow": Command_Follow
}