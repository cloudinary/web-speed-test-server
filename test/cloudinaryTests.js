/**
 * Created by yaniv on 6/1/17.
 */

'use strict';

const chai = require('chai');
const assert = chai.assert;
const cloudinaryParser = require('../cloudinary/cloudinaryResultParser');
const fs = require('fs');

describe('Cloudinary parser tests', ()=> {
  it('Check results keys', () => {
    let resultJson = JSON.parse(fs.readFileSync('./test/resources/cloudRes.json'));
    let parsedResults = cloudinaryParser.parseCloudinaryResults(resultJson);
    assert.isArray(parsedResults.imagesTestResults, "Image test results should be an array");
    assert.isObject(parsedResults.resultSumm, "Results sum should be an object");
    assert.equal(parsedResults.resultSumm.totalImagesCount, parsedResults.imagesTestResults.length, "Total image count should be equal to image list");
    assert.isNumber(parsedResults.resultSumm.totalImagesWeight, "Total image weight should be a number");
    assert.isNumber(parsedResults.resultSumm.totalImagesCount, "Total image count should ba a number");
    assert.isString(parsedResults.resultSumm.totalPercentChange, "Total percent change should be a string");
  });
  it('Check percent added to transformed images', () => {
    let resultJson = JSON.parse(fs.readFileSync('./test/resources/cloudRes.json'));
    let parsedResults = cloudinaryParser.parseCloudinaryResults(resultJson);
    for (let res of parsedResults.imagesTestResults) {
      assert.isTrue(res.eager.every((trans) => {return typeof trans.percentChange === 'string'}));
    }
  });
  it('Check added best image transformation', () => {
    let resultJson = JSON.parse(fs.readFileSync('./test/resources/cloudRes.json'));
    let parsedResults = cloudinaryParser.parseCloudinaryResults(resultJson);
    for (let res of parsedResults.imagesTestResults) {
      assert.isTrue(res.eager.some((trans) => {return trans.best}));
    }
  });
});