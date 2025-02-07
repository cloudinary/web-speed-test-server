const logger = require('./logger').logger;

const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');

const provider = new NodeTracerProvider();
// const { SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-base');
// const { ConsoleSpanExporter } = require('@opentelemetry/tracing');
// provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
provider.register();

let expressInstrumentation = new ExpressInstrumentation();
expressInstrumentation.setTracerProvider(provider);
registerInstrumentations({
    instrumentations: [
        // Express instrumentation expects HTTP layer to be instrumented
        new HttpInstrumentation(),
        expressInstrumentation,
    ],
});

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
app.all('*any', function (req, res) {
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
