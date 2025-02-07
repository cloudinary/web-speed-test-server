const express = require('express');
const logger = require('./logger').logger;
const app = express();

app.use(express.json());

// @for working with localhost
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
    if ('OPTIONS' === req.method) {
        // respond with 200
        res.sendStatus(200);
    } else {
        // move on
        next();
    }
});

const wpt = require('./routes/wpt');
wpt(app);

// catch 404 and forward to error handler
app.all('*any', function (req, res) {
    res.status(404).send('what???');
});

app.use(function (req, res, next) {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.use((err, req, res, next) => {
    logger.error(err);
    res.status(500).send();
})

module.exports = app;
