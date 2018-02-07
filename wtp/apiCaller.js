/**
 * Created by yaniv on 5/7/17.
 */

"use strict";


const request = require('request');
const config = require('config');
const logger = require('../logger');
const resultParser = require('./wtpResultsParser');
const cloudinaryCaller = require('../cloudinary/apiCaller');
const RESULTS_URL = 'https://www.webpagetest.org/jsonResult.php';
const RUN_TEST_URL = 'http://www.webpagetest.org/runtest.php';
const GET_TEST_STATUS = 'http://www.webpagetest.org/testStatus.php';


const getTestResults = (testId, cb) => {
  let options = {
    url: RESULTS_URL,
    qs: {test: testId}
  };
  request.get(options, (error, response, body) => {
    if (error) {
      cb({status: 'error', message: 'Error calling WTP with testId ' + testId, error: error}, null);
      return;
    }
    if (response && response.statusCode !== 200) {
      cb({status: 'error', message: 'WTP returned bad status with testId ' + testId, error: response.statusCode}, null);
      return;
    }
    if (!body) {
      cb({status: 'error', message: 'WTP returned empty body with testId ' + testId, error: 'empty body'}, null);
      return;
    }
    let resBody = JSON.parse(body);
    if (typeof resBody.data.statusCode !== 'undefined') {
      cb({status: 'error', message: resBody.data.statusText + 'testId ' + testId, error: resBody}, null);
      return;
    }
    let wtpRes = resultParser.parseTestResults(resBody);
    if (!wtpRes) {
      cb({status: 'error', message: 'WTP results are missing data with testId ' + testId, error: resBody}, null);
      return;
    } else if(wtpRes.status === 'error') {
      cb(wtpRes);
      return;
    } else {
      cloudinaryCaller(wtpRes.imageList, wtpRes.dpr, wtpRes.metaData, cb);
    }
  })
};


const runWtpTest = (url, cb) => {

  logger.debug('Running new test ' + url);
  const apiKeys = config.get('wtp.apiKey').split(',');
  const apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];
  let options = {
    'url': RUN_TEST_URL,
    'qs': { 
            url: url, 
            k: apiKey,
            f: "json",
            width: config.get('wtp.viewportWidth'),
            height: config.get('wtp.viewportHeight'), 
            custom: config.get('wtp.imageScript'),
            fvonly: 1, // first view only
            timeline: 1 // workaround for WPT sometimes hanging on getComputedStyle()
          }
  };
  request.post(options, (error, response, body) => {
    if (error) {
      cb({status: 'error', message: 'Error calling WTP with url ' + url, error: error}, null);
      return;
    }
    if (response && response.statusCode !== 200) {
      cb({status: 'error', message: 'WTP returned bad status with url ' + url, error: response}, null);
      return;
    }
    if (!body) {
      cb({status: 'error', message: 'WTP returned empty body with url ' + url, error: 'empty body'}, null);
      return;
    }
    let testId = resultParser.parseTestResponse(JSON.parse(body));
    if (typeof testId === 'object') {
      cb(null, testId);
      return;
    }
    // console.log(testId);
    cb(null, {status: "success", data : {testId}});
  });
};

const checkTestStatus = (testId, cb) => {
  logger.debug('Test id ' + testId);
  let options = {
    'url': GET_TEST_STATUS,
    'qs': {test: testId, k: config.get('wtp.apiKey'), f: "json"}
  };
  request.get(options, (error, response, body) => {
    if (error) {
      cb({status: 'error', message: 'Error checking WTP status with testId ' + testId, error: error}, null);
      return;
    }
    if (response && response.statusCode !== 200) {
      cb({status: 'error', message: 'WTP returned bad status testId ' + testId , error: response.statusCode}, null);
      return;
    }
    let testRes = JSON.parse(body);
    logger.debug('Test status code ' + testRes.statusCode);
    if (testRes.statusCode >= 400) {
      cb({status: 'error', message: 'WTP returned bad status with testId ' + testId, error: testRes}, null);
      return;
    }
    if (testRes.statusCode === 200) {
      getTestResults(testId, cb);
    }
    if (testRes.statusCode >= 100 && testRes.statusCode < 200) {
      cb({status: 'success', message: 'test not finished', code: 150}, null);
    }
  });

};

module.exports = {
  getTestResults,
  runWtpTest,
  checkTestStatus
};
