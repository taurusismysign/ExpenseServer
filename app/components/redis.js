"use strict";

var use = require('use-import');
var config = use("config");
var redis = require("redis");

function createRedis() {
    if(config.redis.port && config.redis.host) {
        return redis.createClient(config.redis.port, config.redis.host, {auth_pass: config.redis.password});
    } else if (config.redis.uri) {
        return redis.createClient(config.redis.uri);
    } else {
        return redis.createClient("redis://localhost:6379");
    }
}

var redisClient = createRedis();

redisClient.auth(config.redis.password, function (err) {
    if (err) {
        console.log("redis error: " + err);
    } else {
        console.log("redis authenticated");
    }
});

redisClient.on("ready", function () {
    console.log("redis ready");
});


redisClient.on("connect", function () {
    console.log("redis connected");
});


redisClient.on("error", function (err) {
    console.log("redis error:  " + err);
});

exports.updateCache = function (key, value) {
    redisClient.set(key, JSON.stringify(value), function (redisError) {
        if (!redisError) {
            redisClient.expire(key, config.redis.ttl);
        } else {
            console.log(redisError);
        }
    });
};

exports.restoreFromCache = function (req, res, callback) {
    if(redisClient.ready) {
        redisClient.get(req.url, function (redisError, reply) {
            if (!redisError && reply) {
                res.set("HP-Cache", true);
                res.set("Content-Type", "application/json; charset=utf-8");
                // Cached status code
                //res.status(304);
                res.send(decodeURIComponent(reply));
            } else {
                if (redisError) {
                    console.log("redis cache error: " + redisError);
                }
                callback();
            }
        });
    } else {
        console.log("redis is not ready");
        callback();
    }
};

exports.delWildcard = function(key, callback){
    redisClient.keys(key, function(err, rows){
        if(!err) {
            rows.forEach(function (r) {
                redisClient.del(r);
            });
            callback();
        } else {
            callback();
        }
    });
};

exports.deleteKey = function(key, callback){
    redisClient.del(key);
    callback();
};
