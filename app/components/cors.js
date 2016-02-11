"use strict";

exports.addHeader = function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Max-Age", "86400");
    res.header("Access-Control-Allow-Credentials", false);
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, HP-Server, HP-Cache");
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, PATCH, DELETE, OPTIONS");
    res.header("Access-Control-Expose-Headers", "Origin, X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, HP-Server, HP-Cache");

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
    } else {
        next();
    }
};