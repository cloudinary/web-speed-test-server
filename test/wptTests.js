/**
 * Created by yaniv on 5/3/17.
 */

'use strict';

const assert = require('assert');
const wtpParser = require('../wtp/wtpResultsParser');
const fs = require('fs');

describe('Parse WPT result', () => {
    describe('Get image array', () => {
        it('Retrieve the Images array from the WPT result', () => {
            let resultJson = JSON.parse(fs.readFileSync('./test/resources/test1.json'));
            let images = wtpParser.wtpResParser(resultJson);
            assert.equal(images.length, 27, 'There should be 27 images in the list');
        });
        it('Image list length', () => {
            let resultJsonLong = JSON.parse(fs.readFileSync('./test/resources/long.json'));
            let images = wtpParser.wtpResParser(resultJsonLong);
            assert.equal(images.length, 50, 'There should be 50 images in the list');
        });
        it('Filter image by size', () => {
            let resultJson = JSON.parse(fs.readFileSync('./test/resources/test1.json'));
            resultJson.data.median.firstView.requests[8].image_total = 7340032;
            let images = wtpParser.wtpResParser(resultJson);
            assert.equal(images.length, 26, 'There should be 26 images in the list');
        })
    });
    it('Filter image by resolution', () => {
        let resultJson = JSON.parse(fs.readFileSync('./test/resources/test1.json'));
        let list = JSON.parse(resultJson.data.median.firstView.Images);
            list[0].naturalWidth = 7340032;
            resultJson.data.median.firstView.Images = JSON.stringify(list);
        let images = wtpParser.wtpResParser(resultJson);
        assert.equal(images.length, 26, 'There should be 26 images in the list');
    })

});