/**
 * Created by ashemyakin on 2/10/2016.
 */
var use = require('use-import');
var config = use("config");
var request = require('request');
var mongoose = require("mongoose");
var DatabaseStorageModel = mongoose.model("DatabaseStorage");

exports.uploadImage = function (req, res, next) {
    var databaseStorageModel = new DatabaseStorageModel({
        buffer: req.files.image.data
    });

    databaseStorageModel.save(function (err, file) {
        if (!err) {
                console.log('File saved.');
                res.status(201);
                res.send({ imageUri: config.imageServerUri + "?file=" + file._id });
        } else {
            console.log(err);
            next(new Error(err));
        }
    });
};

exports.uploadImageBase64 = function (req, res, next) {
    var data = new Buffer(req.body.replace(/^data:image\/\w+;base64,/, ""), 'base64');
    var databaseStorageModel = new DatabaseStorageModel({
        buffer: data
    });

    databaseStorageModel.save(function (err, file) {
        if (!err) {
            console.log('File saved.');
            res.status(201);
            res.send({ imageUri: config.imageServerUri + "?file=" + file._id });
        } else {
            console.log(err);
            next(new Error(err));
        }
    });
};

exports.getImage = function(req, res) {
    DatabaseStorageModel.findById(req.query.file, function(err, file) {
        if (!err) {
            res.send(file.buffer);
        } else {
            console.log(err);
            next(new Error(err));
        }
    });
};