"use strict";

var path = require('path');
var extend = require('util')._extend;

var development = require('./env/development');
var production = require('./env/production');

var defaults = {
    root: path.normalize(__dirname + '/..'),
};

if (process.env.VCAP_SERVICES) {
    var services = JSON.parse(process.env.VCAP_SERVICES);
    if (services) {
        if (services["mongodb"]) {
            services["mongodb"].forEach(function (entry) {
                if (entry.name === (process.env.STACKATO_APP_NAME + "-mongo-db")) {
                    defaults.db = {
                        uri: entry.credentials.uri
                    }
                }
            });
        }
        if (services["redis"]) {
            services["redis"].forEach(function (entry) {
                if (entry.name === (process.env.STACKATO_APP_NAME + "-redis-db")) {
                    defaults.redis = {
                        uri: entry.credentials.uri,
                        host: entry.credentials.host,
                        port: entry.credentials.port,
                        password: entry.credentials.password,
                        ttl: 20
                    };
                }
            });
        }
    }
}

if (process.env.VCAP_APPLICATION) {
    var application = JSON.parse(process.env.VCAP_APPLICATION);
    if(application && application.uris && application.uris.length > 0) {
        defaults.imageServerUri = "http://" + application.uris[0] + "/image";
        console.log("imageServerUri loaded from VCAP_APPLICATION");
    }
}

module.exports = {
    development: extend(development, defaults),
    production: extend(production, defaults)
}[process.env.NODE_ENV || 'development'];