const _e = {
	"chat" : document.getElementById('chat'),
	"msg_template_basic" : document.getElementById('message-basic'),
	"msg_template_persona5" : document.getElementById('message-persona5'),
	"msg_template_ff7" : document.getElementById('message-ff7'),
	"msg_template_nuage" : document.getElementById('message-nuage'),
	"announce_template" : document.getElementById('announce')
}
const queryParams = new URLSearchParams(window.location.search);
const delete_mode = queryParams.get('delete_mode');
const max_message_queue = document.currentScript.getAttribute('max_message_queue');
var last_message_call = 0;
setInterval(function() {
	WebModule.query("messages",{"since":last_message_call},function(messages) {
		if (messages && messages.length)
			messages.forEach((message) => {
				console.log(message)
				var selected_template = message.user.template ? message.user.template : "basic";
				var new_msg_element = _e["msg_template_"+selected_template].content.cloneNode(true)
				var logo = new_msg_element.querySelector(".logo")
				logo.setAttribute("src",message.user.avatar ? message.user.avatar : message.user.profile_image_url);
				var username = new_msg_element.querySelector(".username")
				username.innerHTML=message.user.display_name;
				username.setAttribute("style","color:"+message.context.color);
				var textMsg = new_msg_element.querySelector("p")
				var formatedMsg = message.content
				if (!!(message.context.emotes)) {
					var to_replace = []
					Object.keys(message.context.emotes).forEach((e_id) => {
						var pos = message.context.emotes[e_id][0].split("-");
						to_replace.push([
							message.content.substring(pos[0]*1,pos[1]*1+1),
							"<img src='https://static-cdn.jtvnw.net/emoticons/v1/"+e_id+"/1.0'/>"
						])
					})
					to_replace.forEach((i) => {
						formatedMsg = formatedMsg.replaceAll(i[0],i[1])
					})
				}
				textMsg.innerHTML=formatedMsg
				var message_el = new_msg_element.querySelector(".message")
				message_el.setAttribute("data-delete-date",Date.now()+message.duration*1000);
				if (!!(message.context.distinguished))
					message_el.classList.add("distinguished")
				if (!!message.context.extra_class)
					message.context.extra_class.forEach(function(c) {
						message_el.classList.add(c)
					})
				_e["chat"].appendChild(new_msg_element);
			})
		
		if (delete_mode == "constant") {
			var messages_list = document.querySelectorAll(".message")
			var n_to_delete = messages_list.length - max_message_queue
			while (n_to_delete > 0){
				var m = messages_list.pop()
				m.remove();
				n_to_delete -= 1;
			}
		}
	});
    last_message_call = Date.now();
    if (delete_mode !== "constant")
        document.querySelectorAll(".message").forEach((e) => {
            if (1*e.dataset.deleteDate < Date.now())
                e.classList.add("remove")
            if (1*e.dataset.deleteDate+1000 < Date.now())
                e.remove()
        });
},1000);