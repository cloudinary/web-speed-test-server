/**
 * Created by yaniv on 5/8/17.
 */

'use strict';
require('dotenv').config();
const logger = require('../logger');
const log = logger.logger;
const config = require('config');
const _ = require('lodash');
const cloudinaryParser = require('./cloudinaryResultParser');
const cloudinary = require('cloudinary');
const async = require('async');
const request = require('request');

const sendToAnalyze = (imagesArray, dpr, metaData, cb, rollBarMsg) => {
    let batchSize = config.get('cloudinary.batchSize');
    addServerInfo(imagesArray, batchSize, dpr, metaData, cb, rollBarMsg);
};

const addServerInfo = (imageList, batchSize, dpr, metaData, cb, rollBarMsg) => {
  async.eachLimit(imageList, batchSize, (img, callback) => {
    getServer(img, callback, rollBarMsg);
  }, err => {
    if (err) {
      log.warn('error getting head for image ' + image.url, err, rollBarMsg);
    }
    sendToCloudinary(imageList, batchSize, dpr, metaData, cb, rollBarMsg);
  });
};

const sendToCloudinary = (imagesArray, batchSize, dpr, metaData, cb, rollBarMsg) => {
  let analyzeResults = [];
  let timestamp = Math.floor(Date.now() / 1000);
  async.eachLimit(imagesArray, batchSize, (image, callback) => {
    let context = {
      rendered_dimensions: {width: image.width, height: image.height},
      dpr: dpr,
      request_headers: metaData.headers
    };
    let transformations = config.get('cloudinary.transformations', null);
    if (typeof transformations === 'string') {
      transformations = JSON.parse(transformations);
    }
    let eager = [];
    if (transformations) {
      eager = transformations.map((trans) => {
        return Object.assign(trans, {width: image.width, height: image.height, dpr: dpr || 1});
      });
    }
    cloudinary.v2.uploader.upload(image.url, {eager: eager, analyze:{context: context}, tags: timestamp},(error, result) => {
      if (error) {
        analyzeResults.push({public_id: null});
        log.error('Error uploading to cloudinary', error, rollBarMsg);
        callback();
      } else {
        result.server = image.server;
        analyzeResults.push(result);
        callback();
      }
    } );
  }, err => {
    if (err) {
      cb({status: 'error', message: 'Error getting results from cloudinary', error: err, logLevel: logger.LOG_LEVEL_ERROR}, null, null, rollBarMsg);
    }
    let parsed = cloudinaryParser.parseCloudinaryResults(analyzeResults, rollBarMsg);
    if (parsed.status === 'error') {
      cb(parsed, null);
      return;
    }
    Object.assign(parsed.resultSumm, metaData);
    cb(null, {status: 'success', data : parsed });
  })

};

const getServer = (image, callback, rollBarMsg) => {
  let  opts = {url: image.url, timeout: config.get("cloudinary.serverHeadTimeout")};
  request.head(opts, (error, response, body) => {
    if (error) {
      log.warning("error getting image head " + image.url, error, rollBarMsg);
      callback();
    } else {
      image.server = (response.headers.server) ? response.headers.server : 'N/A';
      callback();
    }
  });

};

module.exports = sendToAnalyze;


