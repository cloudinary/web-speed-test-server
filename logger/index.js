require('dotenv').config();
const config = require('config');
const winston = require('winston');
const RollbarTransport = require('winston-transport-rollbar-3');

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

const {combine, timestamp, printf} = winston.format;
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || LOG_LEVEL_INFO,
    format: combine(
        timestamp(),
        printf((info) => `${info.timestamp} [${info.level}] ${info.message}`)
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
