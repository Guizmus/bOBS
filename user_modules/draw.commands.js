const commands = require(process.cwd()+"/lib/Commands")
var current_style = "imprévisible"
const img_channel_id = "1174463163002007572"
const minimum_showing_time = 10
const showing_time = 15
const autodraw_delay = 5*60
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
        refresh_autodraw_timer()
    }
    execute=async function(trigger,params) {

        if (!this.config.IADrawer.active)
            return false

        if (params.onlyshow) {
            add_to_show_queue({
                "filename" : params.filename,
                "prompt" : params.prompt,
                "username" : params.username,
                "style" : params.style
            },this)
            return true;
        }

        const prompt = (trigger.type == "tchat") ? params.content.trim().split(" ").splice(1).join(" ") : params.input;
        const username = (trigger.type == "tchat") ? params.user.get("display_name") : params.userDisplayName;
        if (!prompt) {
            this.APIs.Twitch.tchat_say(this.config.Twitch.channelname,"@"+username+" tu peux demander à l'IA de dessiner quelque chose dans le style actuel ("+current_style+") en tapant !draw suivi d'un sujet. Par exemple, '!draw a cat'. Pour de meilleurs résultats, mieux vaut lui parler en anglais.")
            return false;
        }
        refresh_autodraw_timer()
        var ia_picture = await this.APIs.IADrawer.draw(prompt,current_style)
        this.APIs.Discord.post(img_channel_id,prompt + " ( par "+username+", style "+current_style+" )",ia_picture,prompt+".png")
        commands.trigger("time convector",{"add_time":Math.floor(Math.random()*6)})
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

var autodraw_timer = false;
const autodraw_subjects = ["Dog","Cow","Cat","Horse","Donkey","Tiger","Lion","Panther","Leopard","Cheetah","Bear","Elephant","Polar bear","Turtle","Tortoise","Crocodile","Rabbit","Porcupine","Hare","Hen","Pigeon","Albatross","Crow","Fish","Dolphin","Frog","Whale","Alligator","Eagle","Flying squirrel","Ostrich","Fox","Goat","Jackal","Emu","Armadillo","Eel","Goose","Arctic fox","Wolf","Beagle","Gorilla","Chimpanzee","Monkey","Beaver","Orangutan","Antelope","Bat","Badger","Giraffe","Hermit Crab","Giant Panda","Hamster","Cobra","Hammerhead shark","Camel","Hawk","Deer","Chameleon","Hippopotamus","Jaguar","Chihuahua","King Cobra","Ibex","Lizard","Koala","Kangaroo","Iguana","Llama","Chinchillas","Dodo","Jellyfish","Rhinoceros","Hedgehog","Zebra","Possum","Wombat","Bison","Bull","Buffalo","Sheep","Meerkat","Mouse","Otter","Sloth","Owl","Vulture","Flamingo","Racoon","Mole","Duck","Swan","Lynx","Monitor lizard","Elk","Boar","Lemur","Mule","Baboon","Mammoth","Blue whale","Rat","Snake","Peacock","a man","a woman","a boy","a girl","me","Miley Cyrus","Kim Kardashian","Kayne West","Margaret Thatcher","George Washington","Ghandi","Nelson Mandela","Christopher Columbus","Justin Beiber","Lady Gaga","Katy Perry","Justin Timberlake","Jay Leno","David Letterman","Elle McPherson","Jennifer Aniston","Donald Duck","Pluto","Goofy","Johnny Depp","Brittney Spears","Paris Hilton","Hugh Jackman","Vladimir Putin","Daniel Radcliffe","David Beckham","Madonna","Eminem","Matt Damon","Jack Nicholson","Kevin Spacey","Kylie Minogue","Roger Federer","Andrew Murray","Serena Williams","Brad Pitt","Mickey Mouse","Simon Cowell","Ludwig Beethoven","Warren Buffett","Lewis Carroll","Queen Elizabeth II","Charles Darwin","Albert Einstein","Henry Ford","Bill Gates","Steve Jobs","Vincent van Gogh","Thomas Jefferson","Stanley Kubrik","Charles Lindbergh","Courtney Love","Kurt Cobain","Michelangelo","Amadeus Mozart","Sir Isaac Newton","George Orwell","Andy Warhol","Orson Welles","Leonardo Da Vinci","Walt Disney","Abraham Lincoln","William Shakespeare","Martin Luther King","John F Kennedy","Princess Diana","Mother Teresa","Thomas Edison","Benjamin Franklin","Neil Armstrong","Napoleon","Elvis Presley","Mohammad Ali","Marilyn Monroe","Pablo Picasso","Charles Dickens","Cleopatra","John Lennon","Michael Jordan","Mark Twain","Nicole Kidman","Barack Obama","Robert Pattison","Hugh Heffner","KJ Rowling","Bill Clinton","Elizabeth Taylor","Tom Cruise","Clint Eastwood","Alfred Hitchcock","Stephen Hawking","Tom Hanks","Oprah Winfrey","Beyonce","Hilary Clinton","Dr Suess","Ray Charles","Sean Connery","Julia Roberts","Pele","Meryl Streep","Helen Keller","Robin Williams","Steve Martin","Fred Astaire","Whoopi Goldberg","Jane Austen","Bob Hope","Jessica Simpson","Frank Lloyd Wright","Pamela Anderson","Susan Boyle","Mae West","Snoopy","Jim Carrey","Michael J Fox","Betty Boop","Bugs Bunny","Charlie Brown","Daffy Duck","Dennis the Menace","Donald Duck","Garfield","Mickey Mouse","Olive Oyl","Popeye","Powerpuff Girls","Road Runner","Scooby-Doo","Snoopy","Teenage Mutant Ninja Turtles","The Simpsons","Tom and Jerry","Yogi Bear"];
function refresh_autodraw_timer () {
    if (autodraw_timer)
        clearTimeout(autodraw_timer)
    autodraw_timer = setTimeout(function() {
        commands.trigger("draw",{
            "input" : autodraw_subjects[Math.floor(Math.random()*autodraw_subjects.length)],
            "userDisplayName" : "Une IA qui s'ennuie"
        })
    },autodraw_delay*1000)
}

var is_showing = false;
var drawings_to_show = []
var picture_showing_timeout;
var started_showing_this_picture_on;
var showing_group_itemID;
async function load_showing_group (_this) {
    showing_group_itemID = await _this.APIs.OBS.get_scene_item_id("Guizbot(draw)", "Drawing display")
    _this.APIs.OBS.set_scene_item_enabled("Guizbot(draw)", showing_group_itemID, false)
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
            if (await this.APIs.Twitch.create_poll(this.config.Twitch.broadcaster_id,"Quel style d'images pour l'IA?",choices,false,100,poll_duration)){
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