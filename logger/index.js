const config = require('config');
const Rollbar = require('rollbar');
logger = new Rollbar({
  accessToken: config.get('rollbar.postToken'),
  handleUncaughtExceptions: true,
  handleUnhandledRejections: true,
  payload: {
    environment: process.env.NODE_ENV | 'N/A'
  }
});
if ('development' === process.env.NODE_ENV) {
  logger.configure({  verbose: true});
}
module.exports = logger;
