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
}

exports.command_list = {
    "raid" : Command_Raid
}