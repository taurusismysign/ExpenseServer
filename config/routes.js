"use strict";

var use = require('use-import');
var config = use("config");
var expenses = use("expensesController");
var reports = use("reportsController");
var objectStorage = use("objectStorageController");
var localStorage = use("localStorageController");
var databaseStorageController = use("databaseStorageController");

module.exports = function (app) {

    /// test server connection
    app.get("/", function (req, res) {
        res.json({ message: "I'm working!" });
    });

    app.post("/expenses", expenses.create);
    app.get("/expenses", expenses.find);
    app.patch("/expenses", expenses.update);
    app.delete("/expenses", expenses.delete);

    app.post("/reports", reports.create);
    app.get("/reports", reports.find);
    app.get("/reports/getById", reports.findById);
    app.patch("/reports", reports.update);
    app.delete("/reports", reports.delete);


    app.post("/reports/assignExpenses", reports.assignExpenses);

    if(process.env.USE_DB_STORAGE && config.imageServerUri) {
        console.log("switched to database storage");
        app.post("/image", databaseStorageController.uploadImage);
        app.post("/image64", databaseStorageController.uploadImageBase64);
        app.get("/image", databaseStorageController.getImage);
    }
    if (process.env.USE_LOCAL_STORAGE && config.imageServerUri) {
        console.log("switched to local storage");
        app.post("/image", localStorage.uploadImage);
        app.post("/image64", localStorage.uploadImageBase64);
        app.get("/image", localStorage.getImage);
    } else {
        app.post("/image", objectStorage.uploadImage);
        app.post("/image64", objectStorage.uploadImageBase64);
    }

    /// catch 404 and forwarding to error handler
    app.use(function (req, res) {
        res.status(404).send({ error: "not found" });
    });

    /// catch unhandled errors and forwarding to error handler
    app.use(function (err, req, res) {
        res.status(err.status || 500);
        res.send({ error: err.message });
    });
}