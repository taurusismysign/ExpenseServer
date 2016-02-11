"use strict";

var express = require("express");
var bodyParser = require("body-parser");
var morgan = require("morgan");
var cors = require("../app/components/cors");
var busboyBodyParser = require("busboy-body-parser");
var serverIp = require("../app/components/serverIp");

module.exports = function (app) {
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json({ type: 'application/json' }));
    app.use(busboyBodyParser({ limit: '10mb' }));
    app.use(bodyParser.text({ type: 'image/*', limit: '10mb' }));
    app.use(cors.addHeader);
    app.use(morgan("combined"));
    app.use(serverIp.getAddress);
}