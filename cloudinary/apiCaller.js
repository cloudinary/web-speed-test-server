/**
 * Created by yaniv on 5/8/17.
 */

'use strict';
require('dotenv').config();
const logger = require('winston');
const config = require('config');
const _ = require('lodash');
const cloudinaryParser = require('./cloudinaryResultParser');
const cloudinary = require('cloudinary');
const async = require('async');

const sentToAnalyze = (imagesArray, dpr, res) => {
    let batchSize = config.get('cloudinary.batchSize');
    let analyzeResults = [];
    async.eachLimit(imagesArray, batchSize, (image, callback) => {
      let context = {
        rendered_dimensions: {width: image.width, height: image.height},
        dpr: dpr
      }; //TODO: add analyse parameter once once added to API
      cloudinary.uploader.upload(image.url, (result) => {
        if (result.error) {
          analyzeResults.push({public_id: null});
          logger.error('Error uploading to cloudinary', result);
        } else {
          analyzeResults.push(result);
          callback();
        }
      });
    }, err => {
      if (err) {
        res.json({status: 'error', message: 'Error getting results from cloudinary', error: err.message});
      }
      let parsed = cloudinaryParser.parseCloudinaryResults(analyzeResults);
      res.json({status: 'success', data : parsed});
    })
};

module.exports = sentToAnalyze;


