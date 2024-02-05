const fs = require('fs')
var APIs
var config
var tools
var command_list = {}
var tchat_commands = {}
var channel_points_ids = {}
var channel_points_titles = {}
var tchat_observers = []
var follow_observers = []
var raid_observers = []
var poll_end_observers = []
var commands_loaded_observers = []
async function initialize(_config, _APIs, _tools) {
    APIs = _APIs
    config = _config
    tools = _tools
    whitelist = config.commands.whitelist
    const command_files = fs.readdirSync("./user_modules");
    console.log("Commands : loading user files")
    command_files.forEach(function (file) {
        if (file.match("[^\\.]+\.commands\.js")) {
            const file_explode = file.split(".")
            const category = file_explode[file_explode.length - 3]
            var new_command_file = require(process.cwd() + "/user_modules/" + file)
            Object.keys(new_command_file.command_list).forEach(function (k) {
                new_command_file.command_list[k] = {
                    "construct": new_command_file.command_list[k],
                    "category": category
                }
            })
            command_list = Object.assign(command_list, new_command_file.command_list)
        }
    });
    const command_names = Object.keys(command_list)
    await Promise.all(command_names.map(async (command_name) => {
        var new_command = new command_list[command_name].construct(command_list[command_name].category)
        if (!new_command.active) {
            delete command_list[command_name]
            return false;
        }
        command_list[command_name] = new_command
        if (new_command.triggers.tchat && new_command.triggers.tchat.alias)
            new_command.triggers.tchat.alias.forEach(function (alias) {
                tchat_commands[alias] = command_name
            })
        if (new_command.triggers.tchat && new_command.triggers.tchat["all messages"])
            tchat_observers.push(command_name)
        if (new_command.triggers["channel points"] && new_command.triggers["channel points"].ids)
            new_command.triggers["channel points"].ids.forEach(function (id) {
                channel_points_ids[id] = command_name
            })
        if (new_command.triggers["channel points"] && new_command.triggers["channel points"].titles)
            new_command.triggers["channel points"].titles.forEach(function (title) {
                channel_points_titles[title] = command_name
            })
        if (new_command.triggers["follow"])
            follow_observers.push(command_name)
        if (new_command.triggers["raid"])
            raid_observers.push(command_name)
        if (new_command.triggers["poll end"])
            poll_end_observers.push(command_name)
        if (new_command.triggers["commands loaded"])
            commands_loaded_observers.push(command_name)
        if (new_command.load)
            await new_command.load()
    }))
    console.log("Active commands : " + Object.keys(command_list).join(", "))
    APIs.Twitch.on_channel_redemption_add(trigger_channel_points_commands)
    APIs.Twitch.on_tchat_message(trigger_tchat_commands)
    APIs.Twitch.on_channel_follow(trigger_follow_commands)
    APIs.Twitch.on_channel_raid_to(trigger_raid_commands)
    APIs.Twitch.on_channel_poll_end(trigger_poll_end_commands)
    trigger_commands_loaded()
}
exports.initialize = initialize
function trigger_channel_points_commands(event) {
    const trigger_params = {
        "type": "channel points",
        "rewardId": event.rewardId,
        "rewardTitle": event.rewardTitle
    }
    trigger(trigger_params, event)
}
function trigger_tchat_commands(event) {
    const trigger_params = {
        "type": "tchat",
        "alias": event.content.trim().split(" ")[0].toLowerCase(),
        "userId": event.context["user-id"]
    }
    tools.Users.get(false, event.context["user-id"], function (user) {
        event.user = user;
        trigger(trigger_params, event)
    })
}
function trigger_follow_commands(event) {
    const trigger_params = {
        "type": "follow"
    }
    trigger(trigger_params, event)
}
function trigger_raid_commands(event) {
    const trigger_params = {
        "type": "raid"
    }
    trigger(trigger_params, event)
}
function trigger_poll_end_commands(event) {
    const trigger_params = {
        "type": "poll end"
    }
    trigger(trigger_params, event)
}
function trigger_commands_loaded() {
    const trigger_params = {
        "type": "commands loaded"
    }
    trigger(trigger_params, false)
}
async function trigger(trigger, params) {
    if (!trigger.type) {
        trigger = {
            type: "direct call",
            name: trigger
        }
    }
    switch (trigger.type) {
        case "direct call":
            if (command_list[trigger.name].triggers["direct call"])
                return await command_list[trigger.name].trigger(trigger, params)
            break;
        case "tchat":
            trigger.type = "all messages"
            tchat_observers.forEach(function (commandName) {
                command_list[commandName].trigger(trigger, params)
            })
            trigger.type = "tchat"
            if (Object.keys(tchat_commands).includes(trigger.alias))
                command_list[tchat_commands[trigger.alias]].trigger(trigger, params)
            break;
        case "follow":
            follow_observers.forEach(function (commandName) {
                command_list[commandName].trigger(trigger, params)
            })
            break;
        case "raid":
            raid_observers.forEach(function (commandName) {
                command_list[commandName].trigger(trigger, params)
            })
            break;
        case "poll end":
            poll_end_observers.forEach(function (commandName) {
                command_list[commandName].trigger(trigger, params)
            })
            break;
        case "channel points":
            if (Object.keys(channel_points_ids).includes(trigger.rewardId)) {
                command_list[channel_points_ids[trigger.rewardId]].trigger(trigger, params)
            } else if (Object.keys(channel_points_titles).includes(trigger.rewardTitle)) {
                command_list[channel_points_titles[trigger.rewardTitle]].trigger(trigger, params)
            }
            break;
        case "commands loaded":
            commands_loaded_observers.forEach(function (commandName) {
                command_list[commandName].trigger(trigger, command_list)
            })
        default:
            break;
    }
    return false;
}
exports.trigger = trigger

class Command {
    APIs = false;
    tools = false;
    config = false;
    active = false;
    triggers = {
        "channel points": {
            "ids": [],
            "titles": []
        },
        "tchat": {
            "alias": [],
            "all messages": false
        },
        "direct call": false,
        "follow": false,
        "raid": false,
        "poll end": false
    }
    log = false;
    userlevel_required = USERLEVEL_NONE;
    tchat_alias = [];
    constructor(category) {
        this.APIs = APIs
        this.tools = tools
        this.config = config
        this.category = category
    }
    trigger = function (trigger, params) {
        if (!this.active)
            return false;
        trigger.userlevel = USERLEVEL_NONE
        if (trigger.userId) {
            trigger.userlevel = user_level(trigger.userId)
        } else {
            trigger.userlevel = USERLEVEL_ADMIN
        }
        if (trigger.userlevel >= this.userlevel_required) {
            if (this.log) {
                console.log("Executing ", this, trigger, params)
            }
            this.execute(trigger, params)
        } else {
            console.log("Refused to execute command because of insufficiant user level", this, trigger, params)
        }
    }
    load = function () { }
    execute = function (trigger, params) { }
}
exports.Command = Command
const USERLEVEL_NONE = 0
exports.USERLEVEL_NONE = USERLEVEL_NONE
const USERLEVEL_FOLLOW = 1
exports.USERLEVEL_FOLLOW = USERLEVEL_FOLLOW
const USERLEVEL_SUB = 2
exports.USERLEVEL_SUB = USERLEVEL_SUB
const USERLEVEL_MODERATOR = 3
exports.USERLEVEL_SUB = USERLEVEL_SUB
const USERLEVEL_VIP = 4
exports.USERLEVEL_VIP = USERLEVEL_VIP
const USERLEVEL_WHITELIST = 5
exports.USERLEVEL_WHITELIST = USERLEVEL_WHITELIST
const USERLEVEL_ADMIN = 6
exports.USERLEVEL_ADMIN = USERLEVEL_ADMIN
var whitelist = []
var moderators = [] // TODO
var subscribers = [] // TODO
var followers = [] // TODO
function user_level(userId) {
    userId = 1 * userId
    if (userId == config.Twitch.broadcaster_id)
        return USERLEVEL_ADMIN
    if (whitelist.includes(userId))
        return USERLEVEL_WHITELIST
    if (moderators.includes(userId))
        return USERLEVEL_MODERATOR
    if (subscribers.includes(userId))
        return USERLEVEL_SUB
    if (followers.includes(userId))
        return USERLEVEL_FOLLOW
    return USERLEVEL_NONE
}