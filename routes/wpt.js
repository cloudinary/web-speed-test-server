'use strict';
const express = require('express');
const validUrl = require('valid-url');
const apiCaller = require('../wtp/apiCaller');
const logger = require('../logger');


const routeCallback = (error, result, res) => {
  if (error) {
    if (typeof error.error === 'object') {
      logger.error(error.message, error.error)
    } else {
      logger.error(error.message)
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
    logger.info('Checking test with id ' + testId);
    apiCaller.checkTestStatus(testId, (error, result) => {
      routeCallback(error, result, res)
    });
  });


  app.post('/test/run', (req, res) => {
    if (!req.body) {
      logger.error('Could not run test missing request body', req);
      routeCallback({statusCode: 400}, null, res);
      return;
    }
    let testUrl = req.body.url;
    if (!testUrl) {
      logger.error('Could not run test missing test url', req);
      routeCallback({statusCode: 400}, null, res);
      return;
    }
    if (!validUrl.isUri(testUrl)) {
      logger.error('Could not run test url is not valid \n test url is ' + testUrl, req);
      routeCallback({status: 'error', message: 'URL is not valid'});
      return;
    }
    logger.info('Started test called from webspeedtest', req);
    apiCaller.runWtpTest(testUrl, (error, result) => {
      routeCallback(error, result, res)
    });
  });

  app.get('/version', (req, res) => {
    const packageJson = require('../package.json');
    res.json({version: packageJson.version});
  })
};

module.exports = wtp;
