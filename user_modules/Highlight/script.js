window.onload = function () {
    const queryParams = new URLSearchParams(window.location.search);
    const params = {
        "title": queryParams.get("title"),
        "message": queryParams.get("message"),
        "avatar": queryParams.get("avatar"),
    }
    document.getElementById("title").innerHTML = params.title
    document.getElementById("message").innerHTML = params.message
    document.getElementById("avatar").src = params.avatar
}