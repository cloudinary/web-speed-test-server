require('dotenv').config();
const config = require('config');
const Rollbar = require('rollbar');
const LOG_LEVEL_INFO = 'info';
const LOG_LEVEL_WARNING = 'warning';
const LOG_LEVEL_ERROR = 'error';
const LOG_LEVEL_DEBUG = 'debug';
const LOG_LEVEL_CRITICAL = 'critical';
const packageJson = require('../package.json');
const os = require('os');
const logger = new Rollbar({
  // enabled: false,  // silence rollbar as it takes too much quota.
  accessToken: config.get('rollbar.postToken'),
  verbose: true,
  handleUncaughtExceptions: true,
  handleUnhandledRejections: true,
  environment: process.env.NODE_ENV || process.env.HOSTNAME,
  reportLevel: process.env.LOG_LEVEL || LOG_LEVEL_CRITICAL,
  payload: {
    system: {
      appVersion: packageJson.version,
      hostname: os.hostname(),
      platform: os.platform(),
      type: os.type(),
    },
  },
});

// if ('development' === process.env.NODE_ENV) {
  logger.configure({verbose: true});
// }


module.exports = {
  logger: logger,
  LOG_LEVEL_INFO: LOG_LEVEL_INFO,
  LOG_LEVEL_WARNING: LOG_LEVEL_WARNING,
  LOG_LEVEL_ERROR: LOG_LEVEL_ERROR,
  LOG_LEVEL_CRITICAL: LOG_LEVEL_CRITICAL,
  LOG_LEVEL_DEBUG: LOG_LEVEL_DEBUG
};
