_e = {
    "scene" : document.querySelector(".scene"),
    "template_viewer" : document.querySelector("#template_viewer")
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
    },2000)
}
var viewers_to_show = []
WebModule.query("viewers",{},function(viewers) {
    viewers_to_show = viewers
    spawn_viewer()
})