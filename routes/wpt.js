'use strict';
const express = require('express');
const validUrl = require('valid-url');
const apiCaller = require('../wtp/apiCaller');


const routeCallback = (error, result, res) => {
  if (error) {
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
    apiCaller.checkTestStatus(testId, (error, result) => {
      routeCallback(error, result, res)
    });
  });


  app.post('/test/run', (req, res) => {
    if (!req.body) {
      routeCallback({statusCode: 400}, null, res);
      return;
    }
    let testUrl = req.body.url;
    if (!testUrl) {
      routeCallback({statusCode: 400}, null, res);
      return;
    }
    if (!validUrl.isUri(testUrl)) {
      routeCallback({status: 'error', message: 'URL is not valid'});
      return;
    }
    apiCaller.runWtpTest(testUrl, (error, result) => {
      routeCallback(error, result, res)
    });
  })
};

module.exports = wtp;
