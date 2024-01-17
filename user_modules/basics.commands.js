const commands = require(process.cwd()+"/lib/Commands")
class Command_Discord_link extends commands.Command {
    userlevel_required = commands.USERLEVEL_NONE;
    active=false;
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
    active=false;
    triggers = {
        "tchat" : {
            "alias" : ["!gg"]
        }
    }
    execute=async function(trigger,params) {
        this.APIs.OBS.play_sound("SB-GG",7.5)
    }
}

class Command_Bonjour extends commands.Command {
    userlevel_required = commands.USERLEVEL_NONE;
    active=false;
    triggers = {
        "tchat" : {
            "alias" : ["!bonjour"]
        }
    }
    execute=async function(trigger,params) {
        this.APIs.OBS.play_sound("SB-bonjour",5)
    }
}

exports.command_list = {
    "discord_link" : Command_Discord_link,
    "gg" : Command_GG,
    "bonjour" : Command_Bonjour
}