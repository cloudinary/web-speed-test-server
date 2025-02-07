require('dotenv').config();
const config = require('config');

const LOG_LEVEL_INFO = 'info';
const LOG_LEVEL_WARNING = 'warning';
const LOG_LEVEL_ERROR = 'error';
const LOG_LEVEL_DEBUG = 'debug';
const LOG_LEVEL_CRITICAL = 'critical';
const packageJson = require('../package.json');
const os = require('os');

const rollbarConfig = {
    // enabled: false,  // silence rollbar as it takes too much quota.
    accessToken: config.get('rollbar.postToken'),
    verbose: false,
    handleUncaughtExceptions: false,
    handleUnhandledRejections: false,
    environment: process.env.ENVIRONMENT || "development",
    payload: {
        system: {
            appVersion: packageJson.version,
            hostname: os.hostname(),
            platform: os.platform(),
            type: os.type(),
        },
    }
};

const winston = require('winston');
const RollbarTransport = require('winston-transport-rollbar-3');
const { context, trace } = require('@opentelemetry/api');

const {combine, timestamp, prettyPrint, errors} = winston.format;
const logger = winston.createLogger({
    exitOnError: true,
    level: process.env.LOG_LEVEL || LOG_LEVEL_INFO,
    format: combine(
        timestamp(),
        errors({stack: true}),
        winston.format.json(),
        winston.format((info, opts) => {
            const span = trace.getSpan(context.active());
            const traceId = span?.spanContext().traceId;
            if (traceId) {
                info.traceId = traceId;
            }
            const testId = span?.spanContext().testId;
            if (testId) {
                info.testId = testId;
            }
            return info;
        })(),
        ...(process.env.NODE_ENV !== "production" ? [prettyPrint()] : [])
    ),
    transports: [
        new winston.transports.Console(),
        new RollbarTransport({
            rollbarConfig,
            level: process.env.ROLLBAR_LOG_LEVEL || LOG_LEVEL_ERROR,
        })
    ],
    exceptionHandlers: [
        new winston.transports.Console(),
        new RollbarTransport({
            rollbarConfig,
            level: process.env.ROLLBAR_LOG_LEVEL || LOG_LEVEL_ERROR,
        })
    ],
    rejectionHandlers: [
        new winston.transports.Console(),
        new RollbarTransport({
            rollbarConfig,
            level: process.env.ROLLBAR_LOG_LEVEL || LOG_LEVEL_ERROR,
        })
    ],
});

module.exports = {
    logger: logger,
    LOG_LEVEL_INFO: LOG_LEVEL_INFO,
    LOG_LEVEL_WARNING: LOG_LEVEL_WARNING,
    LOG_LEVEL_ERROR: LOG_LEVEL_ERROR,
    LOG_LEVEL_CRITICAL: LOG_LEVEL_CRITICAL,
    LOG_LEVEL_DEBUG: LOG_LEVEL_DEBUG
};
