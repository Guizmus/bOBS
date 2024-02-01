_e = {
    "scene" : document.querySelector(".scene"),
    "template_viewer" : document.querySelector("#template_viewer"),
    "streamer_name" : document.querySelector("#streamer_name"),
    "streamer_avatar" : document.querySelector("#streamer_avatar"),
    "game_name" : document.querySelector("#game_name")
}

const queryParams = new URLSearchParams(window.location.search);
const target_image = queryParams.get('target_image');
const target_name = queryParams.get('target_name');
function spawn_viewer () {
    if (!viewers_to_show.length)
        return false;
    const data = viewers_to_show.pop()
    const new_viewer = _e.template_viewer.content.cloneNode(true)
    new_viewer.querySelector(".viewer_container").setAttribute("id","viewer_"+data.name);
    const avatar = new_viewer.querySelector(".avatar")
    avatar.setAttribute("src",data.avatar);
    const name = new_viewer.querySelector(".name")
    name.innerHTML=data.name;
    _e.scene.appendChild(new_viewer);
    setTimeout(() => {
        _e.scene.querySelector("#viewer_"+data.name).remove()
    }, 4000);
    setTimeout(()=>{
        spawn_viewer()
    },Math.min(timing,5000))
}
var viewers_to_show = []
var timing;
const animation_duration = 20;
WebModule.query("getData",{},function(data) {
    viewers_to_show = data.viewers
    _e.streamer_name.innerHTML = data.target.streamer_name
    _e.streamer_avatar.setAttribute("src",data.target.streamer_avatar)
    _e.game_name.innerHTML = data.target.game_name
    timing = Math.floor(1000*animation_duration/viewers_to_show.length)
    setTimeout(()=>{
        spawn_viewer()
    },timing)
})