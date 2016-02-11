/**
 * Created by ashemyakin on 2/11/2016.
 */
"use strict";

var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var DatabaseStorageSchema = new Schema({
    buffer: { type: Buffer, required: true, index: false },
});

mongoose.model('DatabaseStorage', DatabaseStorageSchema);