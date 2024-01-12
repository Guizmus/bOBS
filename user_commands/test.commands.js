const commands = require(process.cwd()+"/lib/commands")

class Command_test extends commands.Command {
    userlevel_required = commands.USERLEVEL_NONE;
    triggers = {
        "channel points" : {
            "ids" : [], //totest
            "titles" : ["!gg"]
        },
        "tchat" : {
            "alias" : ["!gg","!test"],
            "all messages" : false
        },
        "direct call" : false,
        "follow" : true, //todo
        "sub" : true //todo
    }
    execute=function(trigger,params) {
        console.log("Executing test command",trigger,params)
    }
}

exports.command_list = {
    "test" : Command_test
}