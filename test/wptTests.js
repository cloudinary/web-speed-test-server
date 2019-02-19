/**
 * Created by yaniv on 5/3/17.
 */

'use strict';
const chai = require('chai');
const assert = chai.assert;
const wtpParser = require('../wtp/wtpResultsParser');
const fs = require('fs');

describe('Parse WPT result', () => {
    describe('Get image array', () => {
        it('Retrieve the Images array from the WPT result', () => {
            let resultJson = JSON.parse(fs.readFileSync('./test/resources/test1.json'));
            let images = wtpParser.parseTestResults(resultJson);
            assert.equal(images.imageList.length, 27, 'There should be 27 images in the list');
        });
        it('Retrieve the Images array from the WPT result when the images are not JSON-encoded (as happens for iPhone user agent)', () => {
            let resultJson = JSON.parse(fs.readFileSync('./test/resources/test1.json'));
            resultJson.data.median.firstView.Images = JSON.parse(resultJson.data.median.firstView.Images);
            let images = wtpParser.parseTestResults(resultJson);
            assert.equal(images.imageList.length, 27, 'There should be 27 images in the list');
        });
        it('Image list length', () => {
            let resultJsonLong = JSON.parse(fs.readFileSync('./test/resources/long.json'));
            let images = wtpParser.parseTestResults(resultJsonLong);
            assert.equal(images.imageList.length, 50, 'There should be 50 images in the list');
        });
    });
    it('Filter image by resolution', () => {
        let resultJson = JSON.parse(fs.readFileSync('./test/resources/test1.json'));
        let list = JSON.parse(resultJson.data.median.firstView.Images);
            list[0].naturalWidth = 7340032;
            resultJson.data.median.firstView.Images = JSON.stringify(list);
        let images = wtpParser.parseTestResults(resultJson);
        assert.equal(images.imageList.length, 26, 'There should be 26 images in the list');
    });
  it('Check for result keys', () => {
    let resultJson = JSON.parse(fs.readFileSync('./test/resources/test1.json'));
    let results = wtpParser.parseTestResults(resultJson);
    assert.isArray(results.imageList, 'Image list is not an array');
    assert.isNumber(results.dpr, 'dpr is not a number');
    assert.equal(results.metaData.headers.length, 2, 'We should have 2 headers');
    assert.isString(results.metaData.url, 'There should be a url');
    assert.isString(results.metaData.screenShot, 'There should be a screenshot');
    assert.isObject(results.metaData.viewportSize, 'ViewportSize is not an object');
  })

});