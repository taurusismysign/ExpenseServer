"use strict";

var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var ReportsSchema = new Schema({
    name: { type: String },
    purpose: { type: String },
    approver: { type: String },
    cc: { type: String },
    status: { type: String },
    date: { type: Date, required: true , index: true }
});

ReportsSchema.pre('save', function(next){
    if ( !this.date ) {
        this.date = new Date();
    }

    if ( !this.name ) {
        this.name = "New report";
    }

    if ( !this.status ) {
        this.status = "Pending";
    }

    next();
});

ReportsSchema.method('toClient', function() {
    var obj = this.toObject();

    //Rename fields
    obj.reportId = obj._id;
    delete obj._id;
    delete obj.__v;

    return obj;
});

mongoose.model('Reports', ReportsSchema);