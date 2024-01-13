var config;
var dbo;
const MongoClient = require("mongodb").MongoClient
async function initialize(_config) {
    config = _config.DB
    console.log("DB : connecting")
    const db = await MongoClient.connect(config.url)
    dbo = db.db(config.name)
}
exports.initialize = initialize

function collection(collection_name) {
    return dbo.collection(collection_name)
}
exports.collection = collection