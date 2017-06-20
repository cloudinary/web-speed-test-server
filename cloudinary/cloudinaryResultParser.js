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
    let totalTransformed = 0;

    results = _.uniqWith(results, (arrVal, othVal) => {

    });
    for (const result of results) {
      if (result.public_id) {
        let split = splitEager(result.eager);
        result.transformedImage = split.nonDynamic;
        result.dynamicFormats = split.dynamic;
        delete result.eager;
        result.dynamicFormats = _.uniqWith(result.dynamicFormats, (arrVal, othVal) => {
          return arrVal.analyze.data.format === othVal.analyze.data.format;
        });
        totalTransformed += addPercentAndBest(result);
        totalPageRank += map[result.analyze.grading.aggregated.value].val;
        imagesTestResults.push(result);
        totalImagesWeight += result.bytes ? result.bytes : 0;
      }
    }
    totalPageRank = Math.round(totalPageRank / results.length);
    totalPageRank = _.findKey(map, {val: totalPageRank});
    imagesTestResults = _.orderBy(imagesTestResults, ['bytes'], ['desc']);
    return {
      imagesTestResults,
      resultSumm: {
        totalPageRank,
        totalImagesCount: results.length,
        totalImagesWeight,
        totalPercentChange: calcPercent(totalTransformed, totalImagesWeight)
      }
    };
  } catch (e) {
    logger.error('Error parsing cloudinary result \n' + JSON.stringify(e));
    return {status: 'error', message: 'Error parsing cloudinary result'}
  }
};

const splitEager = (eagerArray) => {
  let dynamic = [];
  let nonDynamic;
  for (const trans of eagerArray) {
    if (trans.transformation.indexOf("f_") === -1) {
      nonDynamic = trans;
    } else {
      dynamic.push(trans);
    }
  }
  return {dynamic: dynamic, nonDynamic: nonDynamic}
};

const addPercentAndBest = (imageResult) => {
  let origSize = imageResult.bytes;
  let idx = 0;
  let best = 0;
  let small = null;
  for (let imageTrans of imageResult.dynamicFormats) {
    let transSize = _.get(imageTrans, 'analyze.data.bytes', null);
    if (null !== transSize) {
      imageResult.dynamicFormats[idx].percentChange = calcPercent(transSize, origSize);
      small = (small === null) ? transSize : (small <= transSize ? small : transSize);
      best = small >= transSize ? idx : best;
      idx++;
    }
  }
  imageResult.dynamicFormats[best].best = true;
  return imageResult.dynamicFormats[best].analyze.data.bytes;
};

const calcPercent = (part, target) => {
  if (_.isNumber(part) && _.isNumber(target)) {
    let numb = part / target * 100;
    return numb.toFixed(1);
  }
  return 0;
};


module.exports = {
  parseCloudinaryResults
};
