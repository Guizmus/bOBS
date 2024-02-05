const fs = require('fs');
const request = require('request')
class A1111 {
    constructor(API_url) {
        this.API_url = API_url;
    }
    draw = async function (params, callback = function () { }) {
        try {
            var response = await this.#do_request(params);
        } catch (error) {
            console.error("Erreur using IADrawer : ", error);
        }
        callback(response);
        return response
    }
    default_params = {
        "sampler_name": "DPM++ 2M Karras",
        "height": 512,
        "width": 512,
        "steps": 20,
        "model": "realbiter_v10.safetensors",
        "vae": "realbiter_v10.ckpt",
        "init_image": false
    }
    #do_request = function (params) {
        const _this = this
        var AI_params = {
            "prompt": params.prompt,
            "negative_prompt": params.negative_prompt,
            "sampler_name": params.sampler_name,
            "height": params.height,
            "width": params.width,
            "steps": params.steps,
            "override_settings": {
                "sd_model_checkpoint": params.model,
                "sd_vae": params.vae,
            },
            "override_settings_restore_afterwards": false,
        }
        var API_endpoint = 'sdapi/v1/txt2img';
        if (params.init_image) {
            API_endpoint = 'sdapi/v1/img2img';
            AI_params.init_images = [fs.readFileSync(params.init_image, { encoding: 'base64' })];
            AI_params.denoising_strength = 0.55;
        }
        return new Promise(function (resolve, reject) {
            request.post(
                _this.API_url + API_endpoint,
                {
                    json: AI_params
                },
                function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        var content = body.images[0];
                        content = Buffer.from(content, 'base64');
                        resolve(content)
                    } else {
                        reject(error)
                    }
                }
            );

        })
    }
}
exports.IADrawer_backend = A1111