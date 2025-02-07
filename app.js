const logger = require('./logger').logger;

const express = require('express');
const app = express();

// @for working with localhost
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
    if ('OPTIONS' === req.method) {
        // respond with 200
        res.status(200).send();
    } else {
        // move on
        next();
    }
});

app.use(express.json());

const wpt = require('./routes/wpt');
wpt(app);

// catch 404 and forward to error handler
app.all('*', function (req, res) {
    res.status(404).send('what???');
});

app.use(function (req, res, next) {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.use((err, req, res, next) => {
    // attributes from body-parser we don't want
    delete err.body;
    delete err.expose;

    let statusCode = Number(err.statusCode);
    if (!(statusCode >= 400 && statusCode < 600)) {
        statusCode = 500;
    }
    res.status(statusCode).send();
    logger.error(err, {
        method: req.method,
        url: req.url,
        statusCode,
    });
})

module.exports = app;
