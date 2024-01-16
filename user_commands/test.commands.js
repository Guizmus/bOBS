const commands = require(process.cwd()+"/lib/Commands")

class Command_test extends commands.Command {
    userlevel_required = commands.USERLEVEL_NONE;
    triggers = {
        "channel points" : {
            "ids" : [],
            "titles" : []
        },
        "tchat" : {
            "alias" : [],
            "all messages" : false
        },
        "direct call" : true,
        "follow" : true, //totest
        "raid" : true, //totest
        "poll end" : false
    }
    execute=function(trigger,params) {
        console.log("Executing test command",trigger,params)
    }
}

exports.command_list = {
    "test" : Command_test
}