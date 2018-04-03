require('dotenv').config();
const config = require('config');
const Rollbar = require('rollbar');
const logger = new Rollbar({
  accessToken: config.get('rollbar.postToken'),
  handleUncaughtExceptions: true,
  handleUnhandledRejections: true,
  environment: process.env.NODE_ENV || process.env.HOSTNAME,
  reportLevel: process.env.LOG_LEVEL || 'info'
});
if ('development' === process.env.NODE_ENV) {
  logger.configure({verbose: true});
}

module.exports = logger;