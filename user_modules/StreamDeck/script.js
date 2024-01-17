const _e = {
	"deck" : document.getElementById('deck'),
	"bouton_template" : document.getElementById('bouton'),
	"category_template" : document.getElementById('category')
}
var button_list = {}
var categories = {}
function button_component (b) {
	var new_btn_element = _e.bouton_template.content.cloneNode(true)
	var button = new_btn_element.querySelector("button")
	button.innerHTML=b.txt
	button.addEventListener("click", function(){
		handle_click(b.fn)
	});
	return button;
}
function category_component (b) {
	var new_category_element = _e.category_template.content.cloneNode(true)
	var category = new_category_element.querySelector("fieldset")
	category.querySelector("legend").innerHTML=b.category
	return category;
}
var button_names = []
WebModule.query("button_list",false,function(button_list_response) {
	if (button_list_response && button_list_response.length) {
		button_list = {}
		button_list_response.forEach((b) => {
			var new_btn_element = button_component(b)
			if (!categories[b.category]) {
				categories[b.category] = category_component(b);
				_e.deck.appendChild(categories[b.category]);
			}
			button_list[b.fn] = b
			categories[b.category].appendChild(new_btn_element);
		})
	}
	button_names = Object.keys(button_list)
});
	
function handle_click (fn) {
	var extra = false
	if (button_names.includes(fn)) {
		var button = button_list[fn];
		if (button.popin) {
			popin(button.popin,button.extra,function(result_popin){
				if (result_popin)
					WebModule.query("handle_click/"+fn,{"popin":result_popin})
			})
		} else {
			if (button.extra)
				extra = prompt(button.extra)
			WebModule.query("handle_click/"+fn,{"extra":extra})
		}
	}
}

var current_popin = false;
function popin(popin_type,popin_extra_data,callback) {
	var popin_datas = {
		title : "",
		content : false,
		callback : callback,
		form_values : {}
	}
	if (popin_type == "tchat_message_select") {
		popin_datas.title = popin_extra_data;
		WebModule.query("get_popin_data",{"type":"message_list"},function(data) {
			var content = document.createElement("ul");
			if (data) {
				data.forEach(function(message) {
					const msg_id = message.user.id+ ","+message.timestamp
					popin_datas.form_values[msg_id] = message;
					var msg_li = document.createElement("li")
					msg_li.innerHTML = "<li><input type='radio' id='"+msg_id+"' name='message' value='"+msg_id+"'><label for='"+msg_id+"'>De "+message.user.display_name+" : "+message.content+"</label></li>"
					content.appendChild(msg_li)
				})
			}
			popin_datas.content = content;
			open_popin(popin_datas)
		})
	}
}

var popin_element = false;
function open_popin(popin_datas) {
	close_popin()
	current_popin = popin_datas;
	popin_element = document.createElement("div")
	popin_element.classList.add("popin");
	var form = document.createElement("form")
	var title = document.createElement("div")
	title.classList.add("title")
	title.innerHTML = popin_datas.title;
	form.appendChild(title)
	form.appendChild(popin_datas.content)
	var form_cancel = document.createElement("button");
	form_cancel.innerHTML = "Annuler";
	form_cancel.setAttribute("onclick","popin_click('cancel')")
	form.appendChild(form_cancel)
	var form_confirm = document.createElement("button");
	form_confirm.innerHTML = "Valider";
	form_confirm.setAttribute("onclick","popin_click('confirm')")
	form.appendChild(form_confirm)
	popin_element.appendChild(form)
	document.querySelector("body").appendChild(popin_element)

}
function close_popin() {
	if (popin_element) {
		current_popin = false;
		popin_element.remove();
		popin_element = false;
	}
}

function popin_click(button_clicked) {
	if (!current_popin)
		return false;
	if (button_clicked == "cancel") {
		current_popin.callback(false)
		close_popin()
		return false;
	}
	if (button_clicked == "confirm") {
		const formData = new FormData(document.querySelector(".popin form"));
		var output = {};
		for (const [key, value] of formData) {
			output[key] = current_popin.form_values[value]
		}
		current_popin.callback(output)
		close_popin()
		return false;
	}
	return false;
}