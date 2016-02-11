"use strict";

var ip = require("ip");
var use = require('use-import');
var config = use("config");

exports.getAddress = function (req, res, next) {
    res.set('HP-Server', ip.address() + ":" + config.port);
    next();
};