require('dotenv').config();

const fs = require('fs');

const CUSTOM_SCRIPT = fs.readFileSync('config/wpt/custom_metrics.min.js', 'utf8');

const conf = {
  "rollbar": {
    postToken: process.env.ROLLBAR_TOKEN || null
  },
  "images": {
    "maxNumberOfImages": process.env.MAX_IMGES || 50,
    "maxImageSize": process.env.MAX_IMAGE_SIZE || 5,
    "minImageSize": process.env.MIN_IMAGE_SIZE || 5000,
    "maxImageRes": process.env.MAX_IMAGE_RES || 9000000,
    "minImageRes": process.env.MIN_IMAGE_RES || 20,
  },
  "wtp": {
    "apiKey": process.env.WTP_API_KEY,
    "imageScript": process.env.WTP_CUSTOM || CUSTOM_SCRIPT,
    "viewportWidth": 1366,
    "viewportHeight": 784,
    "paths": {
      "imageList": process.env.WTP_IMAGE_LIST_PATH || 'data.median.firstView.CloudinaryImages',
      "imageListFallback": process.env.WTP_IMAGE_FALLBACK_PATH || 'data.median.firstView.Images',
      "rawData": process.env.WTP_IMAGE_RAW_DATA || 'data.median.firstView.requests',
      "dpi": process.env.WTP_DPI_PATH || 'data.median.firstView.Dpi',
      "resolution": process.env.WTP_RES_PATH || 'data.median.firstView.CloudinaryResolution',
      "resolutionFallback": process.env.WTP_RES_FALLBACK_PATH  || 'data.median.firstView.Resolution',
      "screenShot": process.env.WTP_SCREENSHOT_PATH || 'data.median.firstView.images.screenShot',
      "location": process.env.WTP_LOCATION_PATH || 'data.location',
      "url": process.env.WTP_URL_PATH || 'data.url',
      "browserName": process.env.WTP_BROWSER_NAME_PATH || 'data.median.firstView.browser_name',
      "browserVer": process.env.WTP_BROWSER_VER_PATH || 'data.median.firstView.browser_version'
    },
    timeout: process.env.WTP_TIMEOUT || 30000
  },
  "cloudinary": {
    "cloudName": process.env.CLOUDINARY_NAME,
    "apiKey": process.env.CLOUDINARY_API,
    "secret": process.env.CLOUDINARY_SEACRET,
    "batchSize": process.env.CLOUDINARY_BATCH || 50,
    "serverHeadTimeout": process.env.HEAD_TIMEOUT || 1000,
    "transformations": process.env.CLOUDINARY_TRANSF || [
      {quality: 'auto', crop: 'limit'},
      {quality: 'auto', fetch_format: 'webp', flags: 'awebp', crop: 'limit'},
      {quality: 'auto', fetch_format: 'jp2', crop: 'limit'},
      {quality: 'auto', fetch_format: 'avif', crop: 'limit'},
      {quality: 'auto', fetch_format: 'wdp', crop: 'limit'},
      {quality: 'auto', fetch_format: 'png', flags: 'apng', crop: 'limit'}
    ]
  }
};

module.exports = conf;
