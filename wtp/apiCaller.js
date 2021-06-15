/**
 * Created by yaniv on 5/7/17.
 */

"use strict";


const path = require('path');
const request = require('request');
const config = require('config');
const logger = require('../logger');
const log = logger.logger;
const resultParser = require('./wtpResultsParser');
const cloudinaryCaller = require('../cloudinary/apiCaller');
const RESULTS_URL = 'https://www.webpagetest.org/jsonResult.php';
const RUN_TEST_URL = 'http://www.webpagetest.org/runtest.php';
const GET_TEST_STATUS = 'http://www.webpagetest.org/testStatus.php';


const getTestResults = (testId, quality, cb) => {
  let options = {
    url: RESULTS_URL,
    qs: {test: testId},
    headers: { 'User-Agent': 'WebSpeedTest' }
  };
  request.get(options, (error, response, body) => {
    let resBody = JSON.parse(body);
    let rollBarMsg = {testId: resBody.data.id, analyzedUrl: resBody.data.testUrl, thirdPartyErrorCode: "", file: path.basename((__filename))};
    if (error) {
      cb({status: 'error', message: 'Error calling WTP with testId ' + testId, error: error, logLevel: logger.LOG_LEVEL_ERROR}, null, response, rollBarMsg);
      return;
    }
    if (response && response.statusCode !== 200) {
      cb({status: 'error', message: 'WTP returned bad status with testId ' + testId, error: response.statusCode, logLevel: logger.LOG_LEVEL_ERROR}, null, response, rollBarMsg);
      return;
    }
    if (!body) {
      cb({status: 'error', message: 'WTP returned empty body with testId ' + testId, error: 'empty body', logLevel:logger.LOG_LEVEL_WARNING}, null, response, rollBarMsg);
      return;
    }
    if (typeof resBody.data.statusCode !== 'undefined') {
      cb({status: 'error', message: resBody.data.statusText + 'testId ' + testId, error: resBody, logLevel: logger.LOG_LEVEL_WARNING}, null, response, rollBarMsg);
      return;
    }
    let wtpRes = resultParser.parseTestResults(resBody);
    if (!wtpRes) {
      cb({status: 'error', message: 'WTP results are missing data with testId ' + testId, error: resBody, logLevel: logger.LOG_LEVEL_ERROR}, null, response, rollBarMsg);
      return;
    } else if(wtpRes.status === 'error') {
      cb(wtpRes);
      return;
    } else {
      cloudinaryCaller(wtpRes.imageList, wtpRes.dpr, wtpRes.metaData, quality, cb, rollBarMsg);
    }
  })
};


const runWtpTest = (url, mobile, cb) => {
  //logger.info('Running new test ' + url);
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
            location: 'Dulles:Chrome.Native', // Native means no speed shaping in browser, full speed ahead
            mobile: (mobile) ? 1 : 0,
            fvonly: 1, // first view only
            timeline: 1 // workaround for WPT sometimes hanging on getComputedStyle()
          },
    'headers': { 'User-Agent': 'WebSpeedTest' }
  };
  request.post(options, (error, response, body) => {
    let bodyJson = JSON.parse(body);
    let tID = (typeof bodyJson.data !== 'undefined' && typeof bodyJson.data.testId !== 'undefined') ? (bodyJson.data.testId) : "N/A";
    let rollBarMsg = {testId: tID, analyzedUrl: url, thirdPartyErrorCode: "", file: path.basename((__filename))};
    if (error) {
      cb({status: 'error', message: 'Error calling WTP with url ' + url, error: error}, null, response, rollBarMsg);
      return;
    }
    if (response && response.statusCode !== 200) {
      rollBarMsg.thirdPartyErrorCode = response.statusCode;
      cb({status: 'error', message: 'WTP returned bad status with url ' + url}, null, response, rollBarMsg);
      return;
    }
    if (!body) {
      cb({status: 'error', message: 'WTP returned empty body with url ' + url, error: 'empty body'}, null, response, rollBarMsg);
      return;
    }
    let testId = resultParser.parseTestResponse(bodyJson, rollBarMsg);
    if (typeof testId === 'object') {
      cb(null, testId);
      return;
    }
    // console.log(testId);
    cb(null, {status: "success", data : {testId}});
  });
};

const checkTestStatus = (testId, quality, cb) => {
  let options = {
    'url': GET_TEST_STATUS,
    'qs': {test: testId, k: config.get('wtp.apiKey'), f: "json"},
    'headers': { 'User-Agent': 'WebSpeedTest' }
  };
  request.get(options, (error, response, body) => {
    let bodyJson = JSON.parse(body);
    let rollBarMsg = {testId: testId, thirdPartyErrorCode: "", file: path.basename((__filename))};
    if (error) {
      cb({status: 'error', message: 'Error checking WTP status with testId ' + testId, error: error}, null, response, rollBarMsg);
      return;
    }
    if (response && response.statusCode !== 200) {
      cb({status: 'error', message: 'WTP returned bad status testId ' + testId , error: response.statusCode}, null, response, rollBarMsg);
      return;
    }
    //logger.debug('Test status code ' + bodyJson.statusCode, rollBarMsg);
    rollBarMsg.thirdPartyErrorCode = bodyJson.statusCode;
    if (bodyJson.statusCode > 400) {
      rollBarMsg.thirdPartyErrorCode = bodyJson.statusCode;
      cb({status: 'error', message: 'WTP returned bad status with testId ' + testId, error: bodyJson}, null, response, rollBarMsg);
      return;
    }
    if (bodyJson.statusCode === 200 || bodyJson.statusCode === 400) {
      getTestResults(testId, quality, cb);
    }
    if (bodyJson.statusCode >= 100 && bodyJson.statusCode < 200) {
      cb(null, {status: 'success', message: 'test not finished', code: 150}, null, null);
    }
  });

};

module.exports = {
  getTestResults,
  runWtpTest,
  checkTestStatus
};
