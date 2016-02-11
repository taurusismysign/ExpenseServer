"use strict";
var path = require('path');

module.exports = {
    port: process.env.PORT,
    db: {
        uri: process.env.MONGODB_URL
    },
    redis: {
        uri: process.env.REDIS_URL,
        ttl: 20
    },
    imageServerUri: process.env.IMAGE_SERVER_URL,
    storageRootDir: process.env.HELION_FILESYSTEM ||  path.normalize(__dirname)
};