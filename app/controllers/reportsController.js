"use strict";

var mongoose = require("mongoose");
var ExpensesModel = mongoose.model("Expenses");
var ReportsModel = mongoose.model("Reports");
var paging = require("../components/paging");
var async = require("async");
var redis = require("../components/redis");

/**
 * Create a new report
 */
exports.create = function (req, res, next) {
    var report = new ReportsModel({
        name: req.body.name,
        purpose: req.body.purpose,
        cc: req.body.cc,
        date: req.body.date
    });

    report.save(function (err, newReport) {
        if (!err) {
            redis.delWildcard("/reports?count*", function(){
                res.send({reportId: newReport._id});
            });
        } else {
            next(new Error(err));
        }
    });
};

exports.update = function (req, res, next) {
    ReportsModel.findByIdAndUpdate(req.body.reportId,
        {
            $set: {
                name: req.body.name,
                purpose: req.body.purpose,
                approver: req.body.approver,
                cc: req.body.cc,
                status: req.body.status,
                date: req.body.date
            }
        }, {runValidators: true}, function (err) {
            if (!err) {
                redis.deleteKey("/reports/getById?reportId="+req.body.reportId, function(){
                    res.status(204);
                    res.send();
                });

            } else {
                next(new Error(err));
            }
        });
};

var createReportIfNotExist = function (reportId, callback) {
    var notExists = false;
    if(reportId)    {
        ReportsModel.findById(reportId, function (err, report) {
            if (report) {
                callback(null, report.id);
            } else if (err) {
                callback(err);
            } else {
                notExists = true;
            }
        });
    }
    if(!reportId || notExists){
        var report = new ReportsModel({date: new Date()});

        report.save(function (err, newReport) {
            if (!err) {
                callback(null, newReport.id);
            } else {
                callback(err);
            }
        });
    }
};

var calculateTotal = function (reportId, callback) {
    ExpensesModel.aggregate({
        $match: {'reportId': mongoose.Types.ObjectId(reportId)}
    }, {
        $group: {
            _id: reportId,
            total: {$sum: "$amount"}
        }
    }).exec(function (err, results) {
            if (err) {
                callback(err, 0);
            } else if (!results || results.length < 1) {
                callback(null, "0");
            }
            else {
                callback(null, results[0].total)
            }
        }
    );
};

exports.assignExpenses = function (req, res, next) {
    createReportIfNotExist(req.body.reportId, function (err, reportId) {
        if (!err) {
            var conditions = {_id: {$in: req.body.expenses}};
            var update = {reportId: reportId};
            var options = {multi: true};
            ExpensesModel.update(conditions, update, options, function (err) {
                if (!err) {
                    redis.delWildcard("/expenses*", function(){
                        res.status(200);
                        res.send({reportId: reportId});
                    });
                } else {
                    console.log(err);
                    next(new Error(err));
                }
            });
        } else {
            next(new Error(err));
        }
    });
};

exports.findById = function (req, res, next) {
    redis.restoreFromCache(req, res, function () {
        ReportsModel.findById(req.query.reportId).exec(function (err, report) {
            if (!err && report) {
                report = report.toClient();
                calculateTotal(report.reportId, function (totalError, totalCount) {
                    if (!totalError) {
                        report.total = totalCount;
                        res.send(report);
                        redis.updateCache(req.url, report);
                    } else {
                        console.log(totalError);
                        next(new Error(totalError));
                    }
                });
            } else {
                console.log(err);
                next(new Error(err));
            }
        });
    });
};

/**
 * Find reports
 */
exports.find = function (req, res, next) {
    redis.restoreFromCache(req, res, function () {
        var pagingParams = paging.parseParameters(req);
        ReportsModel.count({}, function (err, totalCount) {
            if (!err) {
                ReportsModel.find().sort({"date": -1}).skip(pagingParams.skip).limit(pagingParams.count).exec(function (err, reports) {
                    if (!err && null !== reports) {
                        var result = new Array();
                        async.each(reports,
                            function (report, callback) {
                                calculateTotal(report._id, function (totalError, totalAmount) {
                                    if (!totalError) {
                                        var newReport = report.toClient();
                                        newReport.total = totalAmount;
                                        result.push(newReport);
                                        callback();
                                    } else {
                                        callback(totalError);
                                    }
                                });
                            },
                            function (err) {
                                if (!err) {
                                    var reportsResponse = {
                                        totalCount: totalCount,
                                        content: result
                                    };

                                    res.send(reportsResponse);
                                    redis.updateCache(req.url, reportsResponse);
                                } else {
                                    next(new Error(err));
                                }
                            }
                        );
                    } else {
                        console.log(err);
                        next(new Error(err));
                    }
                });
            } else {
                console.log(err);
                next(new Error(err));
            }
        });
    });
};

var deleteForeignKey = function(condition){
    ExpensesModel.find(condition).exec(function(err, res){
        if(!err){
            res.forEach(function(expense){
                expense.reportId = undefined;
                expense.save();
            });
        }
        else{
            console.log("Cascade update error");
        }
    });
};

var remove = function (id, callback) {
    deleteForeignKey({ reportId: id });
    ReportsModel.find({ _id: id })
        .remove(function(err){
            callback(err, "Report removed: " + id);
        });
};

var removeAll = function(callback){
    deleteForeignKey({});
    ReportsModel.remove({}, function(err){
        callback(err, "Reports collection removed");
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