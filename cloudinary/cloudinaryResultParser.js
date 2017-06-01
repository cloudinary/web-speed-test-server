/**
 * Created by yaniv on 5/8/17.
 */

const logger = require('winston');
const _ = require('lodash');
"use strict";

const parseCloudinaryResults = (results) => {

  try {
    let imagesTestResults = [];
    let map = {A: {val: 1}, B: {val: 2}, C: {val: 3}, D: {val: 4}, E: {val: 5}, F: {val: 6}};
    let totalPageRank = 0;
    let totalImagesWeight = 0;

    for (const result of results) {
      if (result.public_id) {
        addPercentAndBest(result);
        totalPageRank += map[result.analyze.grading.aggregated.value].val;
        imagesTestResults.push(result);
        totalImagesWeight += result.bytes ? result.bytes : 0;
      }
    }
    totalPageRank = Math.round(totalPageRank / results.length);
    totalPageRank = _.findKey(map, {val: totalPageRank});
    imagesTestResults = _.orderBy(imagesTestResults,['bytes'],['desc']);
    return {imagesTestResults, resultSumm: {totalPageRank, totalImagesCount: results.length, totalImagesWeight}};
  } catch (e) {
    logger.error('Error parsing cloudinary result \n' + JSON.stringify(e));
    return {status: 'error', message: 'Error parsing cloudinary result'}
  }
};

const addPercentAndBest = (imageResult) => {
  let origSize = imageResult.bytes;
  let idx = 0;
  let best = 0;
  let small = null;
  for (let imageTrans of imageResult.eager) {
    let transSize = _.get(imageTrans, 'analyze.data.bytes', null);
    if (null !== transSize) {
      imageResult.eager[idx].percentChange = calcPercent(transSize, origSize);
      small = (small === null) ? transSize : (small <= transSize ? small : transSize);
      best = small >= transSize ? idx : best;
      idx++;
    }
  }
  imageResult.eager[best].best = true;

};

const calcPercent = (part, target) => {
  if (_.isNumber(part) && _.isNumber(target)) {
    return Math.round((part / target) * 100);
  }
  return 0;
};


module.exports = {
  parseCloudinaryResults
};