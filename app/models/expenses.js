"use strict";

var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var ExpensesSchema = new Schema({
    category: { type: String, required: true, index: true },
    vendor: { type: String, required: true },
    amount: { type: Number, required: true },
    receipt: { type: String, required: true },
    personal: { type: Boolean, default: false },
    date: { type: Date, required: true , index: true },
    reportId: { type:Schema.ObjectId, ref:"Reports", index: true }
});


ExpensesSchema.pre('save', function(next){
    if ( !this.date ) {
        this.date = new Date();
    }

    next();
});

ExpensesSchema.method('toClient', function() {
    var obj = this.toObject();

    //Rename fields
    obj.expenseId = obj._id;
    delete obj._id;
    delete obj.__v;

    return obj;
});

mongoose.model('Expenses', ExpensesSchema);