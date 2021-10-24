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
const request = require('got');

const sentToAnalyze = async (imagesArray, dpr, metaData, quality, cb, rollBarMsg) => {
  let batchSize = config.get('cloudinary.batchSize');
  const list = await addServerInfoPromise(imagesArray);
  sendToCloudinary(list, batchSize, dpr, metaData, quality, cb, rollBarMsg);
};

const addServerInfoPromise = async (imageList) => {
  // filter out empty
  const list = imageList.filter((el) => el);
  let s =  await Promise.allSettled(list.map((img) => {
    return new Promise(async (resolve) => {
      const {headers} = await request.head(img.url, {timeout: {request: 5000}}).on('error', (e) =>{
        log.error('Error getting server info', e);
        img.server = 'N/A';
        resolve(img);
      }).catch((e) => {
        log.error('Error getting server info', e);
        img.server = 'N/A';
        resolve(img);
      });
      img.server = (headers.server) ? headers.server : 'N/A';
      resolve(img);
    })
  }));
  return s.map((i) => { return i.value})
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
            console.error('Error uploading to cloudinary', error);
            callback();
          } else {
            result.server = image.server;
            analyzeResults.push(result);
            callback();
          }
        });
  }, err => {
    if (uploadErrors.length > 0) {
      log.error('cloudinary upload errors', uploadErrors, rollBarMsg);
    }
    if (err) {
      cb({
        status: 'error',
        message: 'Error getting results from cloudinary',
        error: err,
        logLevel: logger.LOG_LEVEL_ERROR,
      }, null, null, rollBarMsg);
    }
    let parsed = cloudinaryParser.parseCloudinaryResults(analyzeResults, rollBarMsg);
    if (parsed.status === 'error') {
      cb(parsed, null);
      return;
    }
    // move lcp
    const lcpIdx = parsed.imagesTestResults.findIndex((i) => i.tags.includes('lcp'));
    metaData.lcp = {
      isImage: metaData.lcpEvent.type === 'image',
      analyzed: parsed.imagesTestResults.splice(lcpIdx, 1)[0],
      event: metaData.lcpEvent,
    };
    delete (metaData.lcpEvent);
    Object.assign(parsed.resultSumm, metaData);
    cb(null, {status: 'success', data: parsed});
  });

};
module.exports = sentToAnalyze;


