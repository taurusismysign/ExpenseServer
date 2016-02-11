"use strict";

var mongoose = require("mongoose");
var ExpensesModel = mongoose.model("Expenses");
var redis = require("../components/redis");
var paging = require("../components/paging");

/**
 * Create a new expense
 */
exports.create = function (req, res, next) {
    var expense = new ExpensesModel({
        category: req.body.category,
        vendor: req.body.vendor,
        amount: req.body.amount,
        receipt: req.body.receipt,
        personal: req.body.personal,
        date: req.body.date
    });

    expense.save(function (err) {
        if (!err) {
            redis.delWildcard("/expenses*", function(){
                res.send(expense);
            });
        } else {
            next(new Error(err));
        }
    });
};

/**
 * Find expenses
 */
exports.find = function (req, res, next) {
    redis.restoreFromCache(req, res, function () {
        var pagingParams = paging.parseParameters(req);
        var filter = parseFindInputParameters(req.query);
        ExpensesModel.count(filter, function (err, totalCount) {
            if (!err) {
                ExpensesModel.find(filter).sort({"date": -1}).skip(pagingParams.skip).limit(pagingParams.count).exec(function (err, expenses) {
                    if (!err) {
                        var expenses = expenses.map(function(expense){
                           return expense.toClient();
                        });

                        var expensesResponse = {
                            totalCount: totalCount,
                            content: expenses
                        };

                        res.send(expensesResponse);
                        redis.updateCache(req.url, expensesResponse);
                    } else {
                        console.log(err);
                        next(new Error(err));
                    }
                });
            } else {
                next(new Error(err));
            }
        });
    });
};

var parseFindInputParameters = function (reqQuery) {
    var filter = {};
    var fromDate = Date.parse(reqQuery.from);
    var toDate = Date.parse(reqQuery.to);
    if (!isNaN(fromDate) && !isNaN(toDate) && fromDate < toDate) {
        filter.date = {"$gte": fromDate, "$lt": toDate}
    }

    if (reqQuery.category) {
        filter.category = reqQuery.category;
    }

    filter.reportId = reqQuery.reportId || {$exists: false};

    return filter;
};


/**
 * update expense
 */
exports.update = function (req, res, next) {
    ExpensesModel.findByIdAndUpdate(req.body.expenseId,
        {
            $set: {
                category: req.body.category,
                vendor: req.body.vendor,
                amount: req.body.amount,
                receipt: req.body.receipt,
                personal: req.body.personal,
                date: req.body.date
            }
        }, {runValidators: true}, function (err) {
            if (!err) {
                res.status(204);
                res.send();
            } else {
                next(new Error(err));
            }
        });
};

var remove = function (id, callback) {
    ExpensesModel.find({ _id: id })
        .remove(function(err){
            callback(err, "Expense removed: " + id);
        });
};

var removeAll = function(callback){
    ExpensesModel.remove({}, function(err){
        callback(err, "Expenses collection removed");
    });
};

exports.delete = function(req, res, next){

   var callback = function(err, msg){
       if (!err) {
           console.log(msg);
           res.status(204);
           res.send();
       } else {
           next(new Error(err));
       }
   };

    if(req.query.id){
        remove(req.query.id, callback);
    }
    else{
        removeAll(callback);
    }
};