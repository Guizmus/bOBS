const commands = require(process.cwd() + "/lib/Commands")
const fs = require("fs")
const img_channel_id = "1174463163002007572"
const avatar_style = "imprévisible";
var webmodule;
// base Tchat command. serves temporary and constant tchat
class Command_Avatar_reset extends commands.Command {
    userlevel_required = commands.USERLEVEL_ADMIN;
    active = true;
    log = false;
    triggers = {
        "direct call": true,
        "channel points": {
            "ids": ["d07428c7-b260-422b-ad79-0ef4e2c9dadc"],
            "titles": []
        }
    }
    load = async function () {
        webmodule = new this.tools.WebModules.WebModule("Avatars", { "url_key": "Avatars" })
    }
    execute = async function (trigger, params) {
        const user = await this.tools.Users.get(false, params.userId)
        const new_avatar = await download_image(user.get("profile_image_url"), 512)
        const target_file_path = avatar_path(params.userId)
        fs.renameSync(new_avatar, target_file_path)
        this.tools.WebModules.unload_file(target_file_path)
        user.set("avatar", webmodule.get_url(false, params.userId + ".png?v=" + Date.now()))
        await user.save();
        return user.get("avatar")
    }
    deck_extra = "Qui ?";
    deck_params_format = async function (event) {
        console.log("input event", event)
        const user = await this.tools.Users.get(event.data.extra);
        var params = {
            "userId": user.get("id")
        }
        console.log("output params", params)
        return params;
    }
}

const Jimp = require('jimp')
class Command_Avatar_evolve extends commands.Command {
    userlevel_required = commands.USERLEVEL_ADMIN;
    active = true;
    log = false;
    triggers = {
        "direct call": true,
        "channel points": {
            "ids": ["48f9856d-add2-4544-b469-b6385de1de68"],
            "titles": []
        }
    }
    execute = async function (trigger, params) {
        const user = await this.tools.Users.get(false, params.userId)
        const target_file_path = avatar_path(params.userId)
        var current_avatar = target_file_path;
        if (!user.get("avatar")) {
            current_avatar = await download_image(user.get("profile_image_url"), 512)
        }
        var new_avatar = await this.APIs.IADrawer.draw(params.userName, avatar_style, current_avatar)
        evolve_avatar_animation({
            "username": user.get("display_name"),
            "old_avatar": current_avatar,
            "new_avatar": new_avatar
        }, this)
        fs.renameSync(new_avatar, target_file_path)
        this.APIs.Discord.post(img_channel_id, "Nouvel avatar pour " + params.userName, target_file_path, params.userName + ".png")
        this.tools.WebModules.unload_file(target_file_path)
        user.set("avatar", webmodule.get_url(false, params.userId + ".png?v=" + Date.now()))
        await user.save();
        return user.get("avatar")
    }
    deck_extra = "Qui ?";
    deck_params_format = async function (event) {
        const user = await this.tools.Users.get(event.data.extra);
        var params = {
            "userId": user.get("id"),
            "userName": user.get("display_name")
        }
        return params;
    }
}

class Command_Avatar_redraw extends commands.Command {
    userlevel_required = commands.USERLEVEL_ADMIN;
    active = true;
    log = false;
    triggers = {
        "direct call": true,
        "channel points": {
            "ids": ["e0d1429a-7a8d-4454-a2eb-ff889cc8d1dc"],
            "titles": []
        }
    }
    execute = async function (trigger, params) {
        var new_avatar_temp = await this.APIs.IADrawer.draw(params.userName, avatar_style)
        const target_file_path = avatar_path(params.userId)
        fs.renameSync(new_avatar_temp, target_file_path)
        commands.trigger("draw", {
            "onlyshow": true,
            "filename": target_file_path,
            "prompt": "Avatar de " + params.userName,
            "username": params.userName,
            "style": avatar_style
        })
        this.APIs.Discord.post(img_channel_id, "Nouvel avatar pour " + params.userName, target_file_path, params.userName + ".png")
        this.tools.WebModules.unload_file(target_file_path)
        const user = await this.tools.Users.get(false, params.userId)
        user.set("avatar", webmodule.get_url(false, params.userId + ".png?v=" + Date.now()))
        await user.save();
        return user.get("avatar")
    }
    deck_extra = "Qui ?";
    deck_params_format = async function (event) {
        const user = await this.tools.Users.get(event.data.extra);
        var params = {
            "userId": user.get("id"),
            "userName": user.get("display_name")
        }
        return params;
    }
}

function avatar_path(userId) {
    return process.cwd() + "/user_modules/Avatars/" + userId + ".png"
}
const request = require("request")
function download_image(image_url, resize = false) {
    const destination = process.cwd() + "/temp/" + Date.now() + "_" + Math.floor(Math.random() * 1000) + ".png"
    return new Promise(function (resolve, reject) {
        request(image_url)
            .pipe(fs.createWriteStream(destination))
            .on('close', () => {
                if (resize) {
                    Jimp.read(destination, function (err, image) {
                        image
                            .resize(resize, resize)
                            .write(destination, function () {
                                resolve(destination)
                            });
                    })
                } else
                    resolve(destination)
            })
            .on('error', (err) => {
                reject(err);
            });
    })
}
exports.command_list = {
    "avatar_reset": Command_Avatar_reset,
    "avatar_evolve": Command_Avatar_evolve,
    "avatar_redraw": Command_Avatar_redraw
}



var queue_evolve_show = [];
var is_showing_evolve = false;
async function evolve_avatar_animation(params, _this) {
    if (!params.prefix) {
        params.prefix = Date.now() + "_"
        fs.copyFileSync(params.old_avatar, process.cwd() + "/user_modules/Avatars/evolve/" + params.prefix + "1.png")
        fs.copyFileSync(params.new_avatar, process.cwd() + "/user_modules/Avatars/evolve/" + params.prefix + "2.png")
    }
    if (is_showing_evolve) {
        queue_evolve_show.push(params)
        return true;
    }
    is_showing_evolve = true;
    await _this.APIs.OBS.set_input_settings("avatar evolve text", { "text": "Quoi ? " + params.username.toUpperCase() + " évolue !" })
    await _this.APIs.OBS.set_input_settings("avatar post evo", { "file": webmodule.get_url(false, "evolve/" + params.prefix + "2.png") })
    await _this.APIs.OBS.set_input_settings("avatar pre evo", { "file": webmodule.get_url(false, "evolve/" + params.prefix + "1.png") })
    await _this.APIs.OBS.set_source_filter_enabled("Alertes", "avatar evolve animation", true)
    await new Promise(function (resolve, reject) {
        setTimeout(resolve, 8500)
    })
    is_showing_evolve = false;
    if (queue_evolve_show.length > 0) {
        var next_params = queue_evolve_show.shift();
        evolve_avatar_animation(next_params, _this);
    }
}