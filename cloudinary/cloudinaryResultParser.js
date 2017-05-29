/**
 * Created by yaniv on 5/8/17.
 */

const mock = require('./mock.json');
const eagerMock = require('./eagerMock.json');
const _ = require('lodash');
"use strict";

const parseCloudinaryResults = (results) => {

  let imagesTestResults = [];
  let map = {A: {val: 1}, B: {val: 2}, C: {val: 3}, D: {val: 4}, E: {val: 5}, F: {val: 6}};
  let totalPageRank = 0;
  let totalImagesWeight = 0;

  for (const result of results) {
    if (result.public_id) {
      //@TODO: remove once we have a real api to work with.
      //injectMock(result);
      //injectEagerMock(result);
      totalPageRank += map[result.analyze.grading.aggregated.value].val;
      imagesTestResults.push(result);
      totalImagesWeight+= result.bytes ? result.bytes : 0;
    }
  }
  totalPageRank = Math.round(totalPageRank / results.length);
  totalPageRank = _.findKey(map, {val: totalPageRank});
  return {imagesTestResults, resultSumm: {totalPageRank, totalImagesCount: results.length, totalImagesWeight}};
};

const injectMock = (item) => {
  let rand = Math.round(Math.random() * (49));
  item.analyze = mock[rand].analyze;
};

const injectEagerMock = item => item.eager = eagerMock;


module.exports = {
  parseCloudinaryResults
};