var config;
var DB;
var APIs;
async function initialize(_config, _DB, _APIs) {
    config = _config;
    DB = _DB;
    APIs = _APIs;
}
exports.initialize = initialize

class User {
    id = false;
    login = false;
    #data = {}
    constructor(data) {
        this.id = data.id
        this.login = data.login
        this.#data = data
    }
    set(k, d) {
        this.#data[k] = d
        if (k == "id")
            this.id = d
        if (k == "login")
            this.login = d
    }
    get(k = false) {
        if (!k)
            return this.#data
        return this.#data[k]
    }
    async save() {
        const current_user = await DB.collection("users").findOne({ id: this.id })
        if (current_user) {
            await DB.collection("users").updateOne({ id: this.id }, { $set: this.#data })
        } else {
            await DB.collection("users").insertOne(this.#data)
        }
    }
}
const empty_user = new User({ id: 0, login: "" })
async function get(login = false, id = false, callback = function () { }) {
    var user = false;
    var request = {}
    if (login)
        request.login = login;
    if (id)
        request.id = id;
    user = await DB.collection("users").findOne(request)
    if (user)
        user = new User(user)
    if (config.Twitch.active) {
        if (!user || (Date.now() - user.get("last_update") > config.users.refresh_time)) {
            user = user ? user.get() : {}
            if (id) {
                user = Object.assign(user, await APIs.Twitch.get_user_by_id(id))
            } else if (login) {
                user = Object.assign(user, await APIs.Twitch.get_user_by_login(login))
            }
            user = new User(user)
            user.set("last_update", Date.now())
            await user.save();
        }
    }
    callback(user)
    return user;
}
exports.get = get

async function get_list(logins = [], ids = [], callback = function () { }) {
    var request = {
        "$or": [
            {
                "id": { "$in": [] }
            },
            {
                "login": { "$in": [] }
            },
        ]
    }
    if (ids.length) {
        ids.forEach(function (v, k) {
            request.$or[0].id.$in.push(v)
        })
    }
    if (logins.length) {
        logins.forEach(function (v, k) {
            request.$or[1].id.$in.push(v)
        })
    }
    const users_from_db = await DB.collection("users").find(request).toArray()
    var outputs = []
    var users_to_update = {}
    users_from_db.forEach(function (user, k) {
        var output = new User(user)
        if ((config.Twitch.active) && (Date.now() - output.get("last_update") > config.users.refresh_time)) {
            users_to_update[output.id] = output.get()
        } else {
            outputs.push(output)
        }
    })
    const ids_to_update = Object.keys(users_to_update)
    if (ids_to_update.length > 0) {
        const updated_users = await APIs.Twitch.get_users([], ids_to_update)
        updated_users.forEach(function (updated_user, k) {
            var output = new User(Object.assign(users_to_update[updated_user.id], updated_user))
            output.set("last_update", Date.now())
            output.save();
            outputs.push(output)
        })
    }
    callback(outputs)
    return outputs
}
exports.get_list = get_list