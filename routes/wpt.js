'use strict';
const express = require('express');
const validUrl = require('valid-url');
const apiCaller = require('../wtp/apiCaller');
const locationSelector = require("../wtp/locationSelector");
const logger = require('../logger').logger;
const {LOG_LEVEL_INFO, LOG_LEVEL_WARNING, LOG_LEVEL_ERROR, LOG_LEVEL_CRITICAL, LOG_LEVEL_DEBUG} = require('../logger');
const path = require('path');
const opentelemetry = require('@opentelemetry/api');

const WstMeter = opentelemetry.metrics.getMeter('default');
const testrunCounter = WstMeter.createCounter('testrun.total');

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
      res.status(error.statusCode).send();
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
      testrunCounter.add(1, {"status": "BAD_REQUEST"});
      routeCallback({statusCode: 400}, null, res, rollBarMsg);
      return;
    }
    const testUrl = req.body.url;
    const mobile = req.body.mobile === true;
    rollBarMsg.analyzedUrl = testUrl;
    if (!testUrl) {
      logger.error('Could not run test missing test url',rollBarMsg, req);
      testrunCounter.add(1, {"status": "BAD_REQUEST"});
      routeCallback({statusCode: 400}, null, res, rollBarMsg);
      return;
    }
    logger.info('Started test called from webspeedtest', rollBarMsg, req);
    apiCaller.runWtpTest(testUrl, mobile, (error, result, response, rollBarMsg) => {
      testrunCounter.add(1, {"status": error ? "FAILURE" : "OK"});
      routeCallback(error, result, res, rollBarMsg)
    });
  });

  app.get('/version', (req, res) => {
    const packageJson = require('../package.json');
    res.json({version: packageJson.version});
  });

  app.get('/locations', async (req, res) => {
    let locations = locationSelector.cachedAllLocations;
    res.json({locations});
  })

  app.get('/locations/current', async (req, res) => {
    let location = locationSelector.location;
    let lastUpdated = new Date(locationSelector.lastUpdated || 0).toISOString();
    res.json({location, lastUpdated});
  })

};

module.exports = wtp;
