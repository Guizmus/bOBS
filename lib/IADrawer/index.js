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
    var params = {
        "positive" : subject,
        "negative" : "((NSFW))"
    }
    if (style && (styles_list.includes(style)))  {
        style = styles[style]
        params.positive = style.prompt.replace("{prompt}",subject);
        params.negative = params.negative + (","+style.negative || "");
        params.model = style.model;
        params.vae = style.vae;
        params.height = style.dimensions;
        params.width = style.dimensions;
    }
    return params;
}

const styles = require(__dirname+"/styles.json");
var styles_list = []
Object.keys(styles).forEach(function(s) {
    if (styles[s].visible)
        styles_list.push(s)
});
exports.styles = function(){
    return styles_list;
}