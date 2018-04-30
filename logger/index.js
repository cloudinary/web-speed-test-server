require('dotenv').config();
const config = require('config');
const Rollbar = require('rollbar');
const LOG_LEVEL_INFO = 'info';
const LOG_LEVEL_WARNING = 'warning';
const LOG_LEVEL_ERROR = 'error';
const logger = new Rollbar({
  accessToken: config.get('rollbar.postToken'),
  handleUncaughtExceptions: true,
  handleUnhandledRejections: true,
  environment: process.env.NODE_ENV || process.env.HOSTNAME,
  reportLevel: process.env.LOG_LEVEL || 'info',
});
if ('development' === process.env.NODE_ENV) {
  //logger.configure({verbose: true});
}

module.exports = {
  logger: logger,
  LOG_LEVEL_INFO: LOG_LEVEL_INFO,
  LOG_LEVEL_WARNING: LOG_LEVEL_WARNING,
  LOG_LEVEL_ERROR: LOG_LEVEL_ERROR
};