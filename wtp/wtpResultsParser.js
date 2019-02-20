/**
 * Created by yaniv on 5/3/17.
 */

'use strict';

const _ = require('lodash');
const config = require('config');
const bytes = require('bytes');
const logger = require('../logger').logger;
const url = require('url');
const path = require('path');

const parseTestResults = (testJson) => {
  let rollBarMsg = {testId: testJson.data.id, analyzedUrl: testJson.data.testUrl, thirdPartyErrorCode: "", file: path.basename((__filename))};
  try {
    let browserName = _.get(testJson, 'data.location', 'somePlace:N/A').split(':')[1];
    if ('firefox' === browserName.toLowerCase()) {
      logger.warning("Test run with firefox that is not supported", rollBarMsg);
      return {status: 'error', message: 'firefox'};
    }
    let imageList = _.get(testJson, config.get('wtp.paths.imageList'), _.get(testJson, config.get('wtp.paths.imageListFallback'), null));
    for (var i = 0; i <= 1; i++) {
      if (typeof imageList === 'string') {
        imageList = JSON.parse(imageList);
      }
    }
    let requestsData = _.get(testJson, config.get('wtp.paths.rawData'), null);
    if (!imageList || !requestsData) {
      logger.error("WPT test data is missing information", rollBarMsg);
      return {status: 'error', message: 'wpt_failure'}
    }
    imageList = _.uniqWith(imageList, (arrVal, othVal) => {
      return (arrVal.width === othVal.width) && (arrVal.height === othVal.height) && (arrVal.url === othVal.url);
    });
    imageList = filterByResolution(imageList);
    let origLength = imageList.length;
    imageList = _.sortBy(imageList, (img) => {
      return img.width * img.height;
    });
    imageList = _.reverse(imageList);
    imageList = imageList.splice(0, config.get('images.maxNumberOfImages'));
    let headers = _.get(requestsData[0], 'headers.request').filter((head) => {
      return (head.toLowerCase().startsWith('user-agent: ') || head.toLowerCase().startsWith('accept: '));
    });
    let url = _.get(testJson, config.get('wtp.paths.url'));
    let dpi = JSON.parse(_.get(testJson, config.get('wtp.paths.dpi')));
    let resolution = JSON.parse(_.get(testJson, config.get('wtp.paths.resolution'), _.get(testJson, config.get('wtp.paths.resolutionFallback'))));
    let viewportSize = resolution.viewport ? resolution.viewport : resolution.available;
    let screenShot = _.get(testJson, config.get('wtp.paths.screenShot'));
    let location = _.get(testJson, config.get('wtp.paths.location'));
    if (location && location.indexOf(":") !== -1) {
      location = location.split(":")[0];
    }
    let browserVersion = _.get(testJson, 'data.median.firstView.browser_version');
    let userAgent = 'N/A';
    headers.forEach((head) => {
      if (head.toLowerCase().startsWith('user-agent: ')) {
        userAgent = head.split(':').pop();
      }
    });

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
        headers,
        userAgent: userAgent,
        imageList: {isCut: imageList.length < origLength, origLength:origLength}
      }
    };
  } catch (e) {
    logger.error('Error parsing WTP results', e, rollBarMsg);
    return {status: 'error', message: 'wpt_failure'};
  }
};

const extractFileName = (uri) => {
  let parsedUrl = url.parse(uri);
  return path.basename(parsedUrl.pathname)
};

const parseTestResponse = (body, rollBarMsg) => {
  if (body.statusText !== 'Ok') {
    logger.warn('WPT returned an error', rollBarMsg);
    return {status: 'error', message: 'wpt_failure'}
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
  let maxRes = config.get('images.maxImageRes');
  let minRes = config.get('images.minImageRes');
  return _.filter(imageList, (image) => {
    return (image.naturalWidth * image.naturalHeight) <= maxRes && (image.naturalWidth * image.naturalHeight) >= minRes;
  })
};


module.exports = {
  parseTestResults: parseTestResults,
  parseTestResponse: parseTestResponse
};
