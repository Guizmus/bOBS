const http = require('http');
const url = require('url');
const fs = require('fs');
var config;
var WebModule_server;
function initialize(_config) {
    config = _config;
    WebModule_server = http.createServer(WebModule_listener)
    if (config.WebModules.active) {
        WebModule_server.listen(config.WebModules.http_port);
    }
    new WebModule("BaseModule",{"url_key":"BaseModule"})
}
exports.initialize = initialize

class WebModule {
    name="";
    running=false;
    path=false;
    params={
        "index_file" : "index.html",
        "url_key" : false
    };
    constructor(name,params=false) {
        this.name = name;
        if (params) {
            this.params = Object.assign(this.params,params)
        }
        this.#start()
    }
    #start() {
        if (this.running)
            return true;
        var module_path = this.params.url_key ?
            this.params.url_key
            : ""+(Date.now())
        if (!!modules_running[module_path]) {
            modules_running[module_path].#stop()
        }
        this.path = module_path
        modules_running[module_path] = this;
        this.running = true;
    }
    #stop() {
        this.running=false;
        this.path=false;
    }
    get_url(get_params=false) {
        var url = "http://localhost:"+config.WebModules.http_port + "/" + this.path + "/display/" +
            (this.params.index_file ? this.params.index_file : "index.html")
        if (get_params && get_params.length) {
            url = url + "?" + (new URLSearchParams(get_params)).toString()
        }
        return url;
    }
    call(urlObj,req,res,data) {
        const url_parts = urlObj.pathname.split("/").slice(1)
        const key = url_parts[1];
        if(!this.#calls[key]) {
            return false;
        }
        const result = this.#calls[key]({
            "path" : url_parts.slice(2).join("/"),
            "query" : urlObj.query,
            "data" : data
        })
        res.write(JSON.stringify(result))
        return true;
    }
    #calls = {}
    on(key,callback) {
        this.#calls[key] = callback
    }
}
exports.WebModule = WebModule
var modules_running = {}
var files_loaded = {}
function WebModule_listener (req,res) {
    const urlObj = url.parse(req.url,true)
    const url_parts = urlObj.pathname.split("/").slice(1);
    const used_module = modules_running[url_parts[0]];
    if (!!used_module) {
        switch (url_parts[1]) {
            case "display" :
                const file_path = __dirname+'/Modules/'+used_module.name+"/"+(url_parts.slice(2).join("/"))
                if (!files_loaded[file_path]) {
                    if (!fs.existsSync(file_path)) {
                        console.log("couldn't serve ",file_path)
                        res.writeHead(404);
                        res.end();
                        break;
                    }
                    files_loaded[file_path] = fs.readFileSync(file_path)
                }
                
                res.writeHead(200, {'Content-Type': content_type(url_parts[url_parts.length-1])});
                res.write(files_loaded[file_path])
                res.end();
                break;
            default :
                var data = []
                req.on('data', (chunk) => {
                    data.push(chunk)
                })
                req.on('end', () => {
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    used_module.call(urlObj,req,res,JSON.parse(data))
                    res.end();
                })
                break;
        }
    } else {
        res.writeHead(404);
        res.end();
    }
}

function content_type (file) {
    const filetype = file.split(".")[1]
    switch(filetype) {
        case "aac" : return "audio/aac";
        case "apng" : return "image/apng";
        case "avif" : return "image/avif";
        case "avi" : return "video/x-msvideo";
        case "bmp" : return "image/bmp";
        case "css" : return "text/css; charset=utf-8";
        case "csv" : return "text/csv; charset=utf-8";
        case "gif" : return "image/gif";
        case "html" :
        case "htm" : return "text/html; charset=utf-8";
        case "ico" : return "image/vnd.microsoft.icon";
        case "jpeg" :
        case "jpg" : return "image/jpeg";
        case "js" :
        case "mjs" : return "text/javascript; charset=utf-8";
        case "json" : return "application/json";
        case "midi" :
        case "mid" : return "audio/midi";
        case "mp3" : return "audio/mpeg";
        case "mp4" : return "video/mp4";
        case "mpeg" : return "video/mpeg";
        case "oga" :return "audio/ogg";
        case "ogv" : return "video/ogg";
        case "png" : return "image/png";
        case "svg" : return "image/svg+xml";
        case "tif" :
        case "tiff" : return "image/tiff";
        case "ts" : return "video/mp2t";
        case "ttf" : return "font/ttf";
        case "txt" : return "text/plain; charset=utf-8";
        case "wav" : return "audio/wav";
        case "weba" : return "audio/webm";
        case "webm" : return "video/webm";
        case "webp" : return "image/webp";
        case "woff" : return "font/woff";
        case "woff2" : return "font/woff2";
        case "xhtml" : return "application/xhtml+xml";
        case "xml" : return "application/xml";
        default : return "";
    }
}