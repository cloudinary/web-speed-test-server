/**
 * Created by yaniv on 5/3/17.
 */

'use strict';

const _ = require('lodash');
const config = require('config');
const bytes = require('bytes');
const logger = require('winston');

const parseTestResults = (testJson) => {
  try {
    let imageList = JSON.parse(_.get(testJson, config.get('wtp.paths.imageList'), null));
    let requestsData = _.get(testJson, config.get('wtp.paths.rawData'), null);
    if (!imageList || !requestsData) {
      return {status: 'error', message: 'WTP missing data'}
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
    let headers = _.get(requestsData[0], 'headers.request').filter((head) => {
      return (head.startsWith('User-Agent: ') || head.startsWith('Accept: '));
    });
    let url = _.get(testJson, config.get('wtp.paths.url'));
    let dpi = JSON.parse(_.get(testJson, config.get('wtp.paths.dpi')));
    let resolution = JSON.parse(_.get(testJson, config.get('wtp.paths.resolution')));
    let viewportSize = resolution.available;
    let screenShot = _.get(testJson, config.get('wtp.paths.screenShot'));
    let location = _.get(testJson, config.get('wtp.paths.location'));
    if (location && location.indexOf(":") !== -1) {
      location = location.split(":")[0];
    }
    let browserName = _.get(testJson, 'data.median.firstView.browser_name');
    let browserVersion = _.get(testJson, 'data.median.firstView.browser_version');

    return {
      imageList: imageList,
      dpr: dpi.dppx ? dpi.dppx : 0,
      metaData: {
        url,
        dpi: dpi.dpi,
        screenShot,
        browserName,
        browserVersion,
        viewportSize,
        location,
        headers
      }
    };
  } catch (e) {
    logger.error('Error parsing WTP results \n' + e.message);
    return null;
  }
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
    let minSizeInBytes = config.get('images.minImageSize');
    return _.filter(imageList, (image) => {
      let size = image.size || 0;
      return size <= maxSizeInBytes && size >= minSizeInBytes;
    });
};

const filterByResolution = (imageList) => {
  let maxRes = config.get('images.maxImageRes') * 1000000;
  let minRes = config.get('images.maxImageRes');
  return _.filter(imageList, (image) => {
      return (image.naturalWidth * image.naturalHeight) <= maxRes && (image.naturalWidth * image.naturalHeight) >= minRes;
  })
};



module.exports = {
    parseTestResults: parseTestResults,
    parseTestResponse: parseTestResponse
};
