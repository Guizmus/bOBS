const commands = require(process.cwd()+"/lib/Commands")
var current_style = "imprévisible"
const img_channel_id = "1174463163002007572"
const minimum_showing_time = 10
const showing_time = 15
class Command_Draw extends commands.Command {
    userlevel_required = commands.USERLEVEL_NONE;
    active=true;
    triggers = {
        "direct call" : true,
        "channel points" : {
            "ids" : ["81bf059b-641b-4a62-aace-bc6ce3b93740"],
            "titles" : []
        },
        "tchat" : {
            "alias" : ["!draw"]
        },
    }
    load=async function() {
        await load_showing_group(this)
    }
    execute=async function(trigger,params) {
        const prompt = (trigger.type == "tchat") ? params.content.trim().split(" ").splice(1).join(" ") : params.input;
        const username = (trigger.type == "tchat") ? params.user.get("display_name") : params.userDisplayName;
        if (!prompt) {
            this.APIs.Twitch.tchat_say(this.config.Twitch.channelname,"@"+username+" tu peux demander à l'IA de dessiner quelque chose dans le style actuel ("+current_style+") en tapant !draw suivi d'un sujet. Par exemple, '!draw a cat'. Pour de meilleurs résultats, mieux vaut lui parler en anglais.")
            return false;
        }
        var ia_picture = await this.APIs.IADrawer.draw(prompt,current_style)
        this.APIs.Discord.post(img_channel_id,prompt + " ( par "+username+", style "+current_style+" )",ia_picture,prompt+".png")
        add_to_show_queue({
            "filename" : ia_picture,
            "prompt" : prompt,
            "username" : username,
            "style" : current_style
        },this)

    }
    deck_extra = "Quoi ?";
    deck_params_format = async function (event) {
        var params = {
            "input": event.data.extra,
            "userDisplayName" : this.config.Twitch.channelname
        }
        return params;
    }
}

var is_showing = false;
var drawings_to_show = []
var picture_showing_timeout;
var started_showing_this_picture_on;
var showing_group_itemID;
async function load_showing_group (_this) {
    showing_group_itemID = await _this.APIs.OBS.get_scene_item_id("Guizbot(draw)", "Drawing display")
}
function add_to_show_queue (params,_this) {
    drawings_to_show.push(params)
    if (!is_showing) {
        show_drawing(_this);
    } else {
        var time_displayed = Date.now() - started_showing_this_picture_on;
        if (picture_showing_timeout)
            clearTimeout(picture_showing_timeout)
        picture_showing_timeout = setTimeout(function () {hide_drawing(_this)},minimum_showing_time*1000 - time_displayed)
    }

}
async function show_drawing(_this) {
    if (drawings_to_show.length == 0)
        return false;
    is_showing = true;
    var drawing = drawings_to_show.shift()
    await _this.APIs.OBS.set_input_settings("Prompt", {"text":drawing.prompt})
    await _this.APIs.OBS.set_input_settings("Author", {"text":"Par "+drawing.username})
    await _this.APIs.OBS.set_input_settings("Theme", {"text":"Style "+drawing.style})
    await _this.APIs.OBS.set_input_settings("Image IA", {"file":drawing.filename})
    await _this.APIs.OBS.set_scene_item_enabled("Guizbot(draw)", showing_group_itemID, true)
    started_showing_this_picture_on = Date.now();
    if (picture_showing_timeout)
        clearTimeout(picture_showing_timeout)
    var duration = showing_time*1000;
    if (drawings_to_show.length > 0)
        duration = minimum_showing_time*1000;
    picture_showing_timeout = setTimeout(function(){hide_drawing(_this)},duration)
}
async function hide_drawing (_this) {
    await _this.APIs.OBS.set_scene_item_enabled("Guizbot(draw)", showing_group_itemID, false)
    picture_showing_timeout = false;
    is_showing = false;
    show_drawing(_this)
}

var current_style_poll = false;
const poll_spacing = 30*60;
const poll_duration = 90;
var next_poll_timeout = false;
class Command_Style_Poll extends commands.Command {
    userlevel_required = commands.USERLEVEL_ADMIN;
    active=true;
    triggers = {
        "tchat" : {
            "alias" : ["!styles","!style"]
        },
        "direct call" : true,
        "poll end" : true
    }
    load = async function () {
        next_poll_timeout = setTimeout(function() {
            commands.trigger("style_poll",{})
        },poll_spacing*1000)
    }
    execute=async function(trigger,params) {
        if (trigger.type == "poll end") {
            if (params.status == "completed") {
                current_style_poll = false;
                var choices = params.choices;
                var winning_choices = [];
                var winning_votes = 0;
                var votes = {}
                choices.forEach(function(choice) {
                    votes[choice.title] = choice.totalVotes;
                    if (choice.totalVotes < winning_votes)
                        return false;
                    if (choice.totalVotes > winning_votes) {
                        winning_votes = choice.totalVotes
                        winning_choices = []
                    }
                    winning_choices.push(choice.title)
                })
                var winner = winning_choices.sort(() => 0.5 - Math.random()).pop()
                this.APIs.Twitch.tchat_say(this.config.Twitch.channelname,"Suite aux votes, l'IA dessinera maintenant avec le style "+winner+" !")
                current_style = winner
                if (next_poll_timeout){
                    clearTimeout(next_poll_timeout)
                    next_poll_timeout = false;
                }
                next_poll_timeout = setTimeout(function() {
                    commands.trigger("style_poll",{})
                },poll_spacing*1000)
            }
        } else {
            if (current_style_poll)
                return false;
            var choices = []
            this.APIs.IADrawer.styles().sort(() => 0.5 - Math.random()).slice(0,5).forEach(function(s){
                choices.push({"title":s})
            })
            if (await this.APIs.Twitch.create_poll(this.config.Twitch.broadcaster_id,"Quel style d'images pour l'IA?",choices)){
                this.APIs.Twitch.tchat_say(this.config.Twitch.channelname,"C'est parti pour un nouveau style ! Votez pour choisir à quoi ressembleront les images à venir !")
                current_style_poll = true;
                if (next_poll_timeout){
                    clearTimeout(next_poll_timeout)
                    next_poll_timeout = false;
                }
            }
        }
    }
}
exports.command_list = {
    "draw" : Command_Draw,
    "style_poll" : Command_Style_Poll
}