const { json } = require('body-parser');
const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');
const keys = require('../config/keys');

const client = redis.createClient(keys.redisUrl);
client.hget = util.promisify(client.hget)

const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = async function (options = {}) {
    const { key } = options;
    this.useCache = true;
    this.hashKey = JSON.stringify(key || '');

    return this;
}

mongoose.Query.prototype.exec = async function () {

    if (!this.useCache) {
        return exec.apply(this, arguments);
    }

    const key = JSON.stringify({
        ...this.getQuery(),
        collection: this.mongooseCollection.name,

    });

    // See if we have a value for 'key in redis..
    const cachedValue = await client.hget(this.hashKey, key);

    // If we do, return that
    if (cachedValue) {
        const doc = JSON.parse(cachedValue);

        return Array.isArray(doc)
            ? doc.map(d => new this.model(d))
            : new this.model(doc);
    }

    // Otherwise, issue the query and store the result in redis
    const result = await exec.apply(this, arguments);

    client.hset(this.hashKey, key, JSON.stringify(result));

    return result;
};

module.exports = {
    clearCache(hashKey) {
        client.del(JSON.stringify(hashKey));
    },
};
