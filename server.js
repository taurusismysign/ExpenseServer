"use strict";

var use = require('use-import').load();
var config = use("config");

var express = require("express");
var expenses = require("./app/models/expenses");
var reports = require("./app/models/reports");
var databaseStorage = require("./app/models/databaseStorage");
var redis = require("./app/components/redis");
var mongoose = require("mongoose");

var app = express();
var port = config.port;

console.log("server configuration: " + JSON.stringify(config));

// Connect to mongodb
var connect = function () {
    var options = { server: { socketOptions: { keepAlive: 1 } } };
    mongoose.connect(config.db.uri, options);
};
connect();

mongoose.connection.on("error", console.log);
mongoose.connection.on("disconnected", connect);

// Bootstrap application settings
require("./config/express")(app);

// Bootstrap routes
require("./config/routes")(app);

console.log("App started on port " + port);
app.listen(port);

module.exports = app;