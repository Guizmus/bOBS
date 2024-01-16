const fs = require('fs')
var backend = false;
var config;
async function initialize(_config) {
    config = _config.IADrawer;
    if (config.active) {
        const IADrawer_backend = require(__dirname+"/backend/"+config.backend+".js").IADrawer_backend
        console.log("IADrawer : connecting")
        backend = new IADrawer_backend(config.url)
    }
}
exports.initialize = initialize

async function draw (subject,style=false) {
    if (!backend)
        return false;
    var draw_params = backend.default_params;
    const prompt = build_prompt(subject,style)
    draw_params.prompt = prompt.positive;
    draw_params.negative_prompt = prompt.negative;
    const result = await backend.draw(draw_params)
    const filename = process.cwd()+"/temp/"+Date.now()+"_"+Math.floor(Math.random()*1000)+".png"
    fs.writeFileSync(filename, result)
    return filename;
}
exports.draw = draw

function build_prompt(subject,style) {
    return {
        "positive" : subject,
        "negative" : "((NSFW))"
    }
}