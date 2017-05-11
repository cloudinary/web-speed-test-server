/**
 * Created by yaniv on 5/3/17.
 */

'use strict';

const _ = require('lodash');
const config = require('config');
const bytes = require('bytes');
const logger = require('winston');

const parseTestResults = (testJson) => {
    let imageList = JSON.parse(_.get(testJson, 'data.median.firstView.Images'));
    let requestsData = _.get(testJson, 'data.median.firstView.requests');
    if (!imageList || !requestsData) {
        //TODO: handel error
    }
    imageList = imageList.splice(0, config.get('images.maxNumberOfImages'));
    imageList = _.forEach(imageList, (image) => {
        let imageData = _.find(requestsData, (imgData) => {
           return imgData.full_url === image.url && image.naturalHeight > 0 && image.naturalWidth > 0;
        });
        if (imageData) {
            image.size = imageData.image_total;
        }
    });
    imageList = filterByImageSize(imageList);
    imageList = filterByResolution(imageList);
    let dpi = JSON.parse(_.get(testJson, 'data.median.firstView.Dpi'));
    let dpr = dpi.dppx ? dpi.dppx : 0;
    return {imageList: imageList, dpr: dpr};
};

const parseTestResponse = (body) => {
    if (body.statusText !== 'Ok') {
        logger.error('WTP returned an error');
        return {status: 'error', message: 'WTP returned an error'}
    }
    return body.data.testId;
};


const filterByImageSize = (imageList) => {
    let maxSizeInBytes = bytes(config.get('images.maxImageSize') + 'mb');
    return _.filter(imageList, (image) => {
       return image.size <= maxSizeInBytes;
    });
};

const filterByResolution = (imageList) => {
  let maxRes = config.get('images.maxImageRes') * 1000000;
  return _.filter(imageList, (image) => {
      return (image.naturalWidth * image.naturalHeight) <= maxRes;
  })
};



module.exports = {
    parseTestResults: parseTestResults,
    parseTestResponse: parseTestResponse
};
