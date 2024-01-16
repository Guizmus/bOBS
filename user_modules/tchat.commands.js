const commands = require(process.cwd()+"/lib/Commands")
class Command_Tchat extends commands.Command {
    userlevel_required = commands.USERLEVEL_ADMIN;
    active=true;
    message_duration=15;
    triggers = {
        "tchat" : {
            "all messages" : true
        }
    }
    load=async function() {
        const webmodule = new this.tools.WebModules.WebModule("Tchat",{"url_key" : "Tchat"})
        await this.APIs.OBS.set_input_settings("Tchat Guzibot constant", {"url":webmodule.get_url([["delete_mode","constant"]])})
        await this.APIs.OBS.set_input_settings("Tchat Guzibot temporaire", {"url":webmodule.get_url([["delete_mode","temporaire"]])})
        await this.APIs.OBS.refresh_browser_source("Tchat Guzibot constant")
        await this.APIs.OBS.refresh_browser_source("Tchat Guzibot temporaire")
        webmodule.on("messages",function(call){
            return get_messages(call.data.since)
        })
    }
    execute=async function(trigger,params) {
        var should_display = true;
        var message = {
            user : params.user.get(),
            content : params.content,
            timestamp : Date.now(),
            context : params.context,
            duration : this.message_duration
        }
        if (should_display)
            add_message(message)
    }
}

class Command_Tchat_change_template extends commands.Command {
    userlevel_required = commands.USERLEVEL_ADMIN;
    active=true;
    IDs = {
        "376d738d-d30f-4309-a7f9-d236536cb2b9" : "ff7",
        "c87d796c-600f-4dc1-b1d3-c680ed8324f5" : "persona5"
    }
    triggers = {
        "channel points" : {
            "ids" : ["c87d796c-600f-4dc1-b1d3-c680ed8324f5","376d738d-d30f-4309-a7f9-d236536cb2b9"]
        },
    }
    execute=async function(trigger,params) {
        const user = await this.tools.Users.get(false,params.userId)
        const template = this.IDs[params.rewardId]
        user.set("template",template)
        user.save()
    }
}

exports.command_list = {
    "tchat_module" : Command_Tchat,
    "tchat_template" : Command_Tchat_change_template
}
var msg_queue = [];
var last_msg_date = 0;
function add_message(message) {
    msg_queue.push(message)
    if (msg_queue.length > 30)
        msg_queue.shift();
    last_msg_date = message.timestamp;
}
function get_messages(since=false) {
    var msg_to_send = [];
    if (since && (since <= last_msg_date)) {
        msg_queue.forEach(function(message) {
            if (since <= message.timestamp)
                msg_to_send.push(message)
        })
    }
    return since ? msg_to_send : msg_queue;
}