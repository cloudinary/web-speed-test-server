/**
 * Created by yaniv on 5/8/17.
 */

'use strict';
require('dotenv').config();
const logger = require('../logger').logger;
const {LOG_LEVEL_INFO, LOG_LEVEL_WARNING, LOG_LEVEL_ERROR, LOG_LEVEL_CRITICAL, LOG_LEVEL_DEBUG} = require('../logger');
const config = require('config');
const _ = require('lodash');
const cloudinaryParser = require('./cloudinaryResultParser');
const cloudinary = require('cloudinary');
const async = require('async');
const got = (...args) => import('got').then(({default: got}) => got(...args));

const sendToAnalyze = (imagesArray, dpr, metaData, quality, cb, rollBarMsg) => {
  let batchSize = config.get('cloudinary.batchSize');
  addServerInfo(imagesArray, batchSize, dpr, metaData, quality, cb, rollBarMsg);
};

const addServerInfo = (imageList, batchSize, dpr, metaData, quality, cb, rollBarMsg) => {
  // filter out empty
  const list = imageList.filter((el) => el);
  let bs = list.length > batchSize ? batchSize : list.length;
  async.eachLimit(list, bs, (img, callback) => {
    got({method: "HEAD", url: img.url}).then(({headers}) => {
      img.server = (headers.server) ? headers.server : 'N/A';
      callback();
    }).catch((e) => {
      img.server = "N/A"
      callback();
    });
  }, (err, res) => {
    if (err) {
      logger.warn('error getting head for image ', err, rollBarMsg);
    } else {
      sendToCloudinary(list, bs, dpr, metaData, quality, cb, rollBarMsg);
    }
  });
};

const sendToCloudinary = (imagesArray, batchSize, dpr, metaData, quality, cb, rollBarMsg) => {
  let analyzeResults = [];
  let uploadErrors = [];
  let timestamp = Math.floor(Date.now() / 1000);
  async.eachLimit(imagesArray, batchSize, (image, callback) => {
    let context = {
      rendered_dimensions: {width: image.width, height: image.height},
      dpr: dpr,
      request_headers: metaData.headers,
    };
    let transformations = config.get('cloudinary.transformations', null);
    if (typeof transformations === 'string') {
      transformations = JSON.parse(transformations);
    }
    let eager = [];
    if (transformations) {
      eager = transformations.map((trans) => {
        let t = Object.assign({}, trans, {width: image.width, height: image.height, dpr: dpr || 1});
        if (quality) {
          Object.assign(t, {quality: 'auto:' + quality});
        }
        return t;
      });
    }
    const tags = [timestamp];
    if (image.url === metaData.lcpURL) {
      tags.push('lcp');
    }

    cloudinary.v2.uploader.upload(
        image.url, {eager: eager, analyze: {context: context}, tags: tags}, (error, result) => {
          if (error) {
            analyzeResults.push({public_id: null});
            uploadErrors.push(error);
            callback();
          } else {
            result.server = image.server;
            analyzeResults.push(result);
            callback();
          }
        }).catch(error => {
          logger.error('cloudinary upload error', error, rollBarMsg);
    });
  }, err => {
    if (uploadErrors.length > 0) {
      logger.error(`cloudinary upload errors: ${uploadErrors.length} issues`, rollBarMsg);
    }
    if (err) {
      cb({
        status: 'error',
        message: 'Error getting results from cloudinary',
        error: err,
        logLevel: LOG_LEVEL_ERROR,
      }, null, null, rollBarMsg);
    }
    let parsed = cloudinaryParser.parseCloudinaryResults(analyzeResults, rollBarMsg);
    if (parsed.status === 'error') {
      cb(parsed, null);
      return;
    }
    // move lcp
    const lcpIdx = parsed.imagesTestResults.findIndex((i) => i.tags.includes('lcp'));
    if (lcpIdx >= 0) {
      metaData.lcp = {
        isImage: metaData.lcpEvent.type === 'image',
        analyzed: parsed.imagesTestResults.splice(lcpIdx, 1)[0],
        event: metaData.lcpEvent,
      };
      delete (metaData.lcpEvent);
    }
    Object.assign(parsed.resultSumm, metaData);
    logger.info("Finished upload to cloudinary");
    cb(null, {status: 'success', data: parsed});
  });

};
module.exports = sendToAnalyze;


