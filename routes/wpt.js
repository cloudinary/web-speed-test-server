'use strict';
const express = require('express');
const validUrl = require('valid-url');
const apiCaller = require('../wtp/apiCaller');
const logger = require('../logger').logger;
const {LOG_LEVEL_INFO, LOG_LEVEL_WARNING, LOG_LEVEL_ERROR, LOG_LEVEL_CRITICAL, LOG_LEVEL_DEBUG} = require('../logger');
const path = require('path');

const routeCallback = (error, result, res, rollBarMsg) => {
  if (error) {
    if (error.logLevel) {
      let args = (typeof error.error === 'object')
          ? [error.message, error.error, rollBarMsg]
          : [error.message, rollBarMsg];
      switch (error.logLevel) {
        case LOG_LEVEL_DEBUG:
          logger.debug(...args);
          break
        case LOG_LEVEL_INFO:
          logger.info(...args);
          break
        case LOG_LEVEL_WARNING:
          logger.warn(...args);
          break
        case LOG_LEVEL_ERROR:
          logger.error(...args);
          break
        case LOG_LEVEL_CRITICAL:
          logger.critical(...args);
          break
      }
    }
    if (error.statusCode) {
      res.sendStatus(error.statusCode)
    } else {
      res.json(error);
    }
  } else {
    res.json(result);
  }
};

const wtp = (app) => {
  app.get('/test/:testId', (req, res) => {
    let testId = req.params.testId;
    const quality = req.query.quality;
    let rollBarMsg = {testId: testId, thirdPartyErrorCode: "", file: path.basename((__filename))};
    logger.info('Checking test with id ' + testId + " status", rollBarMsg, req);
    apiCaller.checkTestStatus(testId, quality, (error, result) => {
      routeCallback(error, result, res, rollBarMsg)
    });
  });


  app.post('/test/run', (req, res) => {
    let rollBarMsg = {testId: "N/A", thirdPartyErrorCode: "", file: path.basename((__filename))};
    if (!req.body) {
      logger.error('Could not run test missing request body', rollBarMsg, req);
      routeCallback({statusCode: 400}, null, res, rollBarMsg);
      return;
    }
    const testUrl = req.body.url;
    const mobile = req.body.mobile === true;
    rollBarMsg.analyzedUrl = testUrl;
    if (!testUrl) {
      logger.error('Could not run test missing test url',rollBarMsg, req);
      routeCallback({statusCode: 400}, null, res, rollBarMsg);
      return;
    }
/*    if (!validUrl.isWebUri(testUrl)) {
      logger.error('Could not run test url is not valid \n test url is ' + testUrl, rollBarMsg, req);
      routeCallback({status: 'error', message: 'URL is not valid'});
      return;
    }*/
    logger.info('Started test called from webspeedtest', rollBarMsg, req);
    apiCaller.runWtpTest(testUrl, mobile, (error, result, response, rollBarMsg) => {
      routeCallback(error, result, res, rollBarMsg)
    });
  });

  app.get('/version', (req, res) => {
    const packageJson = require('../package.json');
    res.json({version: packageJson.version});
  })
};

module.exports = wtp;
