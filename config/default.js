require('dotenv').config();

const fs = require('fs');

const CUSTOM_SCRIPT = fs.readFileSync('config/wpt/custom_metrics.min.js', 'utf8');

const conf = {
  "rollbar": {
    postToken: process.env.ROLLBAR_TOKEN || "dummy"
  },
  "images": {
    "maxNumberOfImages": process.env.MAX_IMGES || 50,
    "maxImageSize": process.env.MAX_IMAGE_SIZE || 5,
    "minImageSize": process.env.MIN_IMAGE_SIZE || 5000,
    "maxImageRes": process.env.MAX_IMAGE_RES || 9000000,
    "minImageRes": process.env.MIN_IMAGE_RES || 20,
  },
  "wtp": {
    "apiKey": process.env.WTP_API_KEY || "dummy",
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
      "browserVer": process.env.WTP_BROWSER_VER_PATH || 'data.median.firstView.browser_version',
      "lcp": process.env.LCP_PATH || "data.median.firstView.largestPaints",
      "lcpURL": process.env.LCP_URL_PATH || "data.median.firstView.LargestContentfulPaintImageURL"
    },
    timeout: process.env.WTP_TIMEOUT || 30000,
    "locationSelector": {
      "enabled": process.env.WTP_LS_ENABLED === 'true',
      "allowedLocationsRegex": process.env.WTP_LS_ALLOWED_LOCATIONS_REGEX || '_US_',
      "cacheTtl": process.env.WTP_LS_CACHE_TTL || 10,
      "updateTimeout": process.env.WTP_LS_UPDATE_TIMEOUT || 20,
      "defaultLocation": process.env.WTP_LS_DEFAULT_LOCATION || "IAD_US_01"
    }
  },
  "cloudinary": {
    "cloudName": process.env.CLOUDINARY_NAME,
    "apiKey": process.env.CLOUDINARY_API,
    "secret": process.env.CLOUDINARY_SEACRET,
    "batchSize": process.env.CLOUDINARY_BATCH || 50,
    "serverHeadTimeout": process.env.HEAD_TIMEOUT || 5000,
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
