/**
 * Created by yaniv on 5/7/17.
 */

"use strict";


const request = require('request');
const config = require('config');
const logger = require('winston');
const resultParser = require('./wtpResultsParser');
const cloudinaryCaller = require('../cloudinary/apiCaller');
const RESULTS_URL = 'https://www.webpagetest.org/jsonResult.php';
const RUN_TEST_URL = 'http://www.webpagetest.org/runtest.php';
const GET_TEST_STATUS = 'http://www.webpagetest.org/testStatus.php';


const getTestResults = (testId, res, cb) => {
  let options = {
    url: RESULTS_URL,
    qs: {test: testId}
  };
  request.get(options, (error, response, body) => {
    if (error) {
      cb({status: 'error', message: 'Error calling WTP', error: error}, null, res);
      return;
    }
    if (response && response.statusCode !== 200) {
      cb({status: 'error', message: 'WTP returned bad status', error: response.statusCode}, null, res);
      return;
    }
    if (!body) {
      cb({status: 'error', message: 'WTP returned empty body', error: 'empty body'}, null, res);
      return;
    }
    let resBody = JSON.parse(body);
    if (typeof resBody.data.statusCode !== 'undefined') {
      cb({status: 'error', message: resBody.data.statusText, error: resBody.data.statusText}, null, res);
      return;
    }
    let wtpRes = resultParser.parseTestResults(resBody);
    if (!wtpRes) {
      cb({status: 'error', message: 'WTP results are missing data', error: 'data missing'}, null, res);
      return;
    }
    cloudinaryCaller(wtpRes.imageList, wtpRes.dpr, wtpRes.metaData, res, cb);
  })
};

const runWtpTest = (url, res, cb) => {

  let options = {
    'url': RUN_TEST_URL,
    'qs': {url: url, k: config.get('wtp.apiKey'), f: "json", custom: config.get('wtp.imageScript')} //TODO: remove image script when integrated natively
  };
  request.get(options, (error, response, body) => {
    if (error) {
      cb({status: 'error', message: 'Error calling WTP', error: error}, null, res);
      return;
    }
    if (response && response.statusCode !== 200) {
      cb({status: 'error', message: 'WTP returned bad status', error: response.statusCode}, null, res);
      return;
    }
    if (!body) {
      cb({status: 'error', message: 'WTP returned empty body', error: 'empty body'}, null, res);
      return;
    }
    let testId = resultParser.parseTestResponse(JSON.parse(body));
    if (typeof testId === 'object') {
      cb(null, testId, res);
      return;
    }
    checkTestStatus(testId, res, cb);
  });
};

const checkTestStatus = (testId, res, cb) => {
  logger.debug('Test id ' + testId);
  let options = {
    'url': GET_TEST_STATUS,
    'qs': {test: testId, k: config.get('wtp.apiKey'), f: "json"}
  };
  request.get(options, (error, response, body) => {
    if (error) {
      cb({status: 'error', message: 'Error calling WTP', error: error}, null, res);
      return;
    }
    if (response && response.statusCode !== 200) {
      cb({status: 'error', message: 'WTP returned bad status', error: response.statusCode}, null, res);
      return;
    }
    let testRes = JSON.parse(body);
    logger.debug('Test status code ' + testRes.statusCode);
    if (testRes.statusCode >= 400) {
      cb({status: 'error', message: 'WTP returned bad status', error: testRes.statusText}, null, res);
      return;
    }
    if (testRes.statusCode === 200) {
      getTestResults(testId, res, cb);
    }
    if (testRes.statusCode >= 100 && testRes.statusCode < 200) {
      //@TODO: add timeout
      setTimeout(() => {
        checkTestStatus(testId, res)
      }, 1000)
    }
  });

};

module.exports = {
  getTestResults,
  runWtpTest
};