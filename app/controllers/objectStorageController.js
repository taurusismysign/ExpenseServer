"use strict";

var request = require('request');
var fs = require('fs');

var authData = {
    login: "10282162123634:alexander.shemyakin",
    password: "Akvelon!!!",
    authUri: "https://region-a.geo-1.identity.hpcloudsvc.com:35357/auth/v1.0/",
    containerUri: "https://region-b.geo-1.objects.hpcloudsvc.com/v1/10282162123634/receipt/",
    token: null,
    expires: null
};

var authorize = function (callback) {
    // Prevent token expiration
    var now = new Date();
    var now_utc = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), 0, 0);

    if (!authData.token || !authData.expires || authData.expires >= now_utc) {
        var reqestParams = {
            method: 'GET',
            url: authData.authUri,
            headers: {
                'x-auth-user': authData.login,
                'x-auth-key': authData.password
            }
        };

        request(reqestParams, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var authResponse = JSON.parse(body);
                authData.token = authResponse.access.token.id;
                authData.expires = Date.parse(authResponse.access.token.expires);
                callback(null, authData);
            } else {
                callback("Could not acquire an access token.");
            }
        });
    } else {
        callback(null, authData);
    }
};

var generateUUID = function () {
    var d = Date.now();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
};

exports.uploadImage = function (req, res, next) {
    authorize(function (err, authData) {
        if (!err && req.files.image && req.files.image.truncated === false) {
            var createdImageUri = authData.containerUri + generateUUID();

            var reqestParams = {
                method: 'PUT',
                url: createdImageUri,
                headers: {
                    'X-Auth-Token': authData.token,
                    'Content-Type': req.files.image.mimetype
                },
                body: req.files.image.data
            };

            request(reqestParams, function (error, response) {
                if (!error && response.statusCode == 201) {
                    res.status(201);
                    res.send({ imageUri: createdImageUri });
                } else {
                    if(error){
                        next(new Error(error));
                    }else{
                        next(new Error("Could not upload image: " + response));
                    }
                }
            });

        } else {
            next(new Error(err));
        }
    });
};

exports.uploadImageBase64 = function (req, res, next) {
    authorize(function (err, authData) {
        if (!err) {
            var createdImageUri = authData.containerUri + generateUUID();
            var buf = new Buffer(req.body.replace(/^data:image\/\w+;base64,/, ""), 'base64')

            var reqestParams = {
                method: 'PUT',
                url: createdImageUri,
                headers: {
                    'X-Auth-Token': authData.token,
                    'Content-Encoding': 'base64',
                    'Content-Type': req.headers['content-type']
                },
                body: buf
            };

            request(reqestParams, function (error, response) {
                if (!error && response.statusCode == 201) {
                    res.status(201);
                    res.send({ imageUri: createdImageUri });
                } else {
                    if(error){
                        next(new Error(error));
                    }else{
                        next(new Error("Could not upload image: " + response));
                    }
                }
            });

        } else {
            next(new Error(err));
        }
    });
};