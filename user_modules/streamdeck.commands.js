const commands = require(process.cwd()+"/lib/Commands")
var webmodule
var deck_commands
var total_commands
class Command_Streamdeck extends commands.Command {
    userlevel_required = commands.USERLEVEL_ADMIN;
    active=true;
	log=false;
    triggers = {
        "commands loaded" : true
    }
    load=async function() {
		const _this = this;
        webmodule = new this.tools.WebModules.WebModule("StreamDeck",{"url_key" : "StreamDeck"})
        webmodule.on("button_list",function(call){
            return deck_commands
        })
		webmodule.on("handle_click",async function(call) {
			const trigger = call.path
			const command = total_commands[trigger]
			const params = !!command.deck_params_format ? await command.deck_params_format(call) : {}
			return await commands.trigger(trigger,params);
		})
		webmodule.on("get_popin_data",function(call){
			var res_content = {}
			switch (call.data.type) {
				case "message_list" : 
					res_content = total_commands.tchat_module.get_messages(Date.now()-300000).slice(0,30)
					break;
				default : 
			}
			return res_content
		})
    }
    execute=async function(trigger,commands) {
		deck_commands = []
		total_commands = commands
		Object.keys(commands).forEach(function(command_key){
			const command = commands[command_key]
			if (command.triggers["direct call"])
				deck_commands.push({
					"txt" : command.constructor.name,
					"fn" : command_key,
					"extra" : command.deck_extra ||"",
					"category" : command.category,
					"popin" : command.popin || ""
				})
		})
		console.log("StreamDeck active on "+webmodule.get_url())
	}
}
exports.command_list = {
    "streamdeck_initialize" : Command_Streamdeck
}

// var server = false;
// function create_server () {
// 	server = http.createServer(function (req,res) {
// 		var urlObject = url.parse(req.url,true)
// 		var reqUrl = urlObject.pathname
		
// 		else if (reqUrl.startsWith("/handle_click/")) {
// 			reqFn = reqUrl.split("/")[2]
// 			var extra_txt = ""
// 			var popin_data = false;
// 			if ((!!(urlObject.query)) && (!!(urlObject.query.extra)))
// 				extra_txt = " "+urlObject.query.extra
// 			if ((!!(urlObject.query)) && (!!(urlObject.query.popin)))
// 				popin_data = urlObject.query.popin
// 			execute_fn({
// 				"key" : reqFn,
// 				"params" : !!popin_data ? popin_data : urlObject.query.extra,
// 				"from" : {
// 					"id":-1,
// 					"name":config.Streamdeck.username
// 				},
// 				"target_channel" : false
// 			})
// 			res.end();
// 		} else if (reqUrl.startsWith("/get_popin_data")) {
// 			res.writeHead(200, {'Content-Type': 'application/json'});
// 			var res_content = {}
// 			switch (urlObject.query.type) {
// 				case "message_list" : 
// 					res_content = {
// 						"data" : APIs.Tchat.get_messages(Date.now()-300000).slice(0,30)
// 					}
// 					break;
// 				default : 
// 			}
// 			res.write(JSON.stringify(res_content))
// 			res.end();
// 		} else res.end();
// 	});
// }