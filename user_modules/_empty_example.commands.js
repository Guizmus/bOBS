const commands = require(process.cwd()+"/lib/Commands")
class Command_template extends commands.Command {
    active=false;
    log=false;
    triggers = {
        "channel points" : {
            "ids" : [],
            "titles" : []
        },
        "tchat" : {
            "alias" : [],
            "all messages" : false
        },
        "direct call" : false,
        "follow" : false,
        "raid" : false,
        "poll end" : false
    }
    load=async function () {

    }
    execute=async function(trigger,params) {

    }
    deck_extra = "Deck asked text on click";
    deck_params_format = async function (event) {
        var params = { 
            // prepare deck params for execute function
        }
        return params;
    }
}
exports.command_list = {
    // "command name" : Command_template
}
