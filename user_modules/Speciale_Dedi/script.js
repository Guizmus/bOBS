window.onload = function () {
    const queryParams = new URLSearchParams(window.location.search);
    const params = {
        "username": queryParams.get("username"),
        "avatar": queryParams.get("avatar"),
        "clip": queryParams.get("clip"),
    }
    document.getElementById("user").innerHTML = "<img class='avatar' src='" + params.avatar + "'/> " + params.username
    document.getElementById("clip").innerHTML = '<img src="' + params.clip + '"></img>'
}