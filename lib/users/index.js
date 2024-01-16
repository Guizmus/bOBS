var config;
var DB;
var APIs;
async function initialize (_config,_DB,_APIs) {
    config = _config;
    DB = _DB;
    APIs = _APIs;
}
exports.initialize = initialize

class User {
    id=false;
    login=false;
    #data={}
    constructor(data){
        this.id = data.id
        this.login = data.login
        this.#data = data
    }
    set(k,d) {
        this.#data[k] = d
        if (k == "id")
            this.id = d
        if (k == "login")
            this.login = d
    }
    get(k=false) {
        if (!k)
            return this.#data
        return this.#data[k]
    }
    async save() {
        const current_user = await DB.collection("users").findOne({id : this.id})
        if (current_user) {
            await DB.collection("users").updateOne({id : this.id},{ $set:this.#data})
        } else {
            await DB.collection("users").insertOne(this.#data)
        }
    }
}
const empty_user = new User({id:0,login:""})
async function get (login=false,id=false,callback=function(){}) {
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
            if (id) {
                user = await APIs.Twitch.get_user_by_id(id)
            } else if (login) {
                user = await APIs.Twitch.get_user_by_login(login)
            }
            if (user){
                user = new User(user)
                user.set("last_update",Date.now())
                user.save();
            }
        }
    }
    callback(user)
    return user;
}
exports.get = get
