/**
 * Created by yaniv on 5/7/17.
 */

"use strict";

const path = require('path');
const got = (...args) => import('got').then(({default: got}) => got(...args));
const config = require('config');
const logger = require('../logger');
const log = logger.logger;
const resultParser = require('./wtpResultsParser');
const cloudinaryCaller = require('../cloudinary/apiCaller');
const {truncateString} = require('../util/strings');
const RESULTS_URL = 'https://www.webpagetest.org/jsonResult.php';
const RUN_TEST_URL = 'http://www.webpagetest.org/runtest.php';
const GET_TEST_STATUS = 'http://www.webpagetest.org/testStatus.php';
const locationSelector = require('./locationSelector');
const apiKeys = require('./apiKey');

const getTestResults = async (testId, quality, cb) => {
  let options = {
    method: "GET",
    url: RESULTS_URL,
    searchParams: {test: testId},
    headers: { 'User-Agent': 'WebSpeedTest' }
  };
  try {
    const response = await got(options)
    const {statusCode, body} = response;
    let resBody = JSON.parse(body);
    let rollBarMsg = {testId: resBody.data.id, analyzedUrl: resBody.data.testUrl, thirdPartyErrorCode: "", file: path.basename((__filename))};
    if (statusCode !== 200) {
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
  } catch (e) {
    cb({status: 'error', message: 'Error calling WTP with testId ' + testId, error: e, logLevel: logger.LOG_LEVEL_ERROR}, null, response, rollBarMsg);
    return;
  }
};

const runWtpTest = async (url, mobile, cb) => {
  //logger.info('Running new test ' + url);
  let options = {
    method: "POST",
    url: RUN_TEST_URL,
    searchParams: {
            url: url,
            f: "json",
            width: config.get('wtp.viewportWidth'),
            height: config.get('wtp.viewportHeight'),
            custom: config.get('wtp.imageScript'),
            location: await locationSelector.getLocation() + ':Chrome.Native', // Native means no speed shaping in browser, full speed ahead
      mobile: (mobile) ? 1 : 0,
            fvonly: 1, // first view only
            timeline: 1 // workaround for WPT sometimes hanging on getComputedStyle()
          },
    headers: { 'User-Agent': 'WebSpeedTest', 'X-WPT-API-KEY': apiKeys.get() },
    throwHttpErrors: false
  };
  let response;
  let rollBarMsg = {testId: "", analyzedUrl: url, thirdPartyErrorCode: "", thirdPartyErrorMsg: "", file: path.basename((__filename))};
  try {
    response = await got(options);
    const {statusCode, body} = response;
    if (statusCode !== 200) {
      rollBarMsg.thirdPartyErrorCode = response.statusCode;
      rollBarMsg.thirdPartyErrorBody = body && truncateString(body, 1000) || "";
      cb({status: 'error', message: 'WTP returned bad status with url ' + url, error: response.statusMessage, logLevel: logger.LOG_LEVEL_ERROR}, null, response, rollBarMsg);
      return;
    }
    if (!body) {
      cb({status: 'error', message: 'WTP returned empty body with url ' + url, error: 'empty body'}, null, response, rollBarMsg);
      return;
    }
    let bodyJson = JSON.parse(body);
    rollBarMsg.testId = (typeof bodyJson.data !== 'undefined' && typeof bodyJson.data.testId !== 'undefined') ?
        (bodyJson.data.testId) :
        "N/A";
    let testId = resultParser.parseTestResponse(bodyJson, rollBarMsg);
    if (typeof testId === 'object') {
      cb(null, testId);
      return;
    }
    // console.log(testId);
    cb(null, {status: "success", data: {testId}});
  } catch (error) {
      cb({status: 'error', message: 'Error calling WTP with url ' + url, error: error}, null, response, rollBarMsg);
      return;
  }

};

const checkTestStatus = async (testId, quality, cb) => {
  let options = {
    method: "GET",
    url: GET_TEST_STATUS,
    searchParams: {test: testId, f: "json"},
    'headers': { 'User-Agent': 'WebSpeedTest' }
  };
  let response;
  let rollBarMsg = {};
  try {
    response = await got(options);
    const {statusCode, body} = response;
    let bodyJson = JSON.parse(body);
    rollBarMsg = {testId: testId, thirdPartyErrorCode: "", file: path.basename((__filename))};
    if (statusCode !== 200) {
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
  } catch (error) {
      cb({status: 'error', message: 'Error checking WTP status with testId ' + testId, error: error}, null, response, rollBarMsg);
      return;
  }
};

module.exports = {
  getTestResults,
  runWtpTest,
  checkTestStatus
};
