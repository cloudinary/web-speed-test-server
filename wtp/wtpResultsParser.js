/**
 * Created by yaniv on 5/3/17.
 */

'use strict';


const _ = require('lodash');
const config = require('config');
const bytes = require('bytes');
const logger = require('../logger').logger;
const URL = require('url');
const path = require('path');

const parseTestResults = (testJson) => {
  let rollBarMsg = {testId: testJson.data.id, analyzedUrl: testJson.data.testUrl, thirdPartyErrorCode: "", file: path.basename((__filename))};
  try {
    let browserName = _.get(testJson, 'data.location', 'somePlace:N/A').split(':')[1];
    if ('firefox' === browserName.toLowerCase()) {
      logger.warning("Test run with firefox that is not supported", rollBarMsg);
      return {status: 'error', message: 'firefox'};
    }
    let origImageList = _.get(testJson, config.get('wtp.paths.imageList'), _.get(testJson, config.get('wtp.paths.imageListFallback'), null));
    if (typeof origImageList === 'string') {
      origImageList = JSON.parse(origImageList);
    }
    let requestsData = _.get(testJson, config.get('wtp.paths.rawData'), null);
    if (!origImageList || !requestsData) {
      logger.error("WPT test data is missing information", rollBarMsg);
      return {status: 'error', message: 'wpt_failure'}
    }
    let imageList = _.uniqWith(origImageList, (arrVal, othVal) => {
      return (arrVal.width === othVal.width) && (arrVal.height === othVal.height) && (arrVal.url === othVal.url);
    });
    imageList = filterByResolution(imageList);
    imageList = filterNotRendered(imageList);
    let origLength = imageList.length;
    imageList = _.sortBy(imageList, (img) => {
      return img.width * img.height;
    });
    imageList = _.reverse(imageList);
    imageList = imageList.splice(0, config.get('images.maxNumberOfImages'));
    let headers = _.get(requestsData[0], 'headers.request').filter((head) => {
      return (head.toLowerCase().startsWith('user-agent: ') || head.toLowerCase().startsWith('accept: '));
    });
    const url = _.get(testJson, config.get('wtp.paths.url'));
    const dpi = JSON.parse(_.get(testJson, config.get('wtp.paths.dpi')));
    const resolution = JSON.parse(_.get(testJson, config.get('wtp.paths.resolution'), _.get(testJson, config.get('wtp.paths.resolutionFallback'))));
    const viewportSize = resolution.viewport ? resolution.viewport : resolution.available;
    const screenShot = _.get(testJson, config.get('wtp.paths.screenShot'));
    let location = _.get(testJson, config.get('wtp.paths.location'));
    const lcpURL = _.get(testJson, config.get('wtp.paths.lcpURL'))
    const lcp = extractLCP(_.get(testJson, config.get('wtp.paths.lcp')));
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
    // make sure LCP image is in image list to analyze
    const inList = imageList.findIndex((image) => {
      return image.url === lcpURL;
    });
    if (inList === -1) {
      imageList.push(origImageList.find((image) => {
        return image.url === lcpURL;
      }));
    }

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
        lcpURL: lcpURL,
        lcpEvent: lcp,
        imageList: {isCut: imageList.length < origLength, origLength:origLength}
      }
    };
  } catch (e) {
    logger.error('Error parsing WTP results', e, rollBarMsg);
    return {status: 'error', message: 'wpt_failure'};
  }
};

/*
const extractFileName = (uri) => {
  let parsedUrl = url.parse(uri);
  return path.basename(parsedUrl.pathname)
};
*/

const parseTestResponse = (body, rollBarMsg) => {
  if (body.statusText !== 'Ok') {
    rollBarMsg.thirdPartyErrorCode = body?.statusCode;
    rollBarMsg.responseBody = body.statusText;
    logger.warn('WPT returned an error', rollBarMsg);
    return {status: 'error', message: 'wpt_failure'}
  }
  return body.data.testId;
};

const extractLCP = (paintsArray) => {
  let paints = paintsArray.filter((p) => {
    return p.event === 'LargestContentfulPaint';
  });
  paints.sort((a, b) => {
    return a.time - b.time;
  }).reverse()

  return paints[0];
}

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

const filterNotRendered = (imageList) => {
  return _.filter(imageList, (image) => {
    return !(image.width === 0 || image.height === 0)
  })
}


module.exports = {
  parseTestResults: parseTestResults,
  parseTestResponse: parseTestResponse
};
