const WebModule = {
    "query" : async function (key,query,callback) {
        await fetch(window.location.pathname.split("/").slice(0,2).join("/")+"/"+key,{
            "method": 'POST',
            "headers": {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            "body": JSON.stringify(query)
        })
        .then(response => response.json())
        .then(callback)
    }
}