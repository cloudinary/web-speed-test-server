require('dotenv').config();
const conf = {
  "images": {
    "maxNumberOfImages": process.env.MAX_IMGES || 50,
    "maxImageSize": process.env.MAX_IMAGE_SIZE || 5,
    "minImageSize": process.env.MIN_IMAGE_SIZE || 5000,
    "maxImageRes": process.env.MAX_IMAGE_RES || 9000000,
    "minImageRes": process.env.MIN_IMAGE_RES || 20,
  },
  "wtp": {
    "apiKey": process.env.WTP_API_KEY,
    "imageScript": "[CloudinaryImages] var getStyle = function (el, styleProp) { var value, defaultView = (el.ownerDocument || document).defaultView; if (defaultView && defaultView.getComputedStyle) { styleProp = styleProp.replace(/([A-Z])/g, '-$1').toLowerCase(); return defaultView.getComputedStyle(el, null).getPropertyValue(styleProp); } else if (el.currentStyle) { /* IE */ styleProp = styleProp.replace(/\-(\w)/g, function(str, letter) { return letter.toUpperCase(); }); value = el.currentStyle[styleProp]; if (/^\d+(em|pt|%|ex)?$/i.test(value)) { return (function(value) { var oldLeft = el.style.left, oldRsLeft = el.runtimeStyle.left; el.runtimeStyle.left = el.currentStyle.left; el.style.left = value || 0; value = el.style.pixelLeft + 'px'; el.style.left = oldLeft; el.runtimeStyle.left = oldRsLeft; return value; })(value); } return value; } }; var bgSizeFromContainer = function(styleLength, containerSize) { if (styleLength == undefined) return null; if (/px/.test(styleLength)) { return parseInt(styleLength); } else { /* percent */ return Math.round(containerSize * parseInt(styleLength) / 100); } }; var wptImages = function(win) { win = win || window; var doc = win.document; var images = []; var elements = doc.getElementsByTagName('*'); for (var i = 0; i < elements.length; i++) { var el = elements[i]; if (el.tagName == 'IMG') { images.push({'url': el.currentSrc || el.src, 'width': el.width, 'height': el.height, 'naturalWidth': el.naturalWidth, 'naturalHeight': el.naturalHeight}); } else { var backgroundImage = getStyle(el, 'backgroundImage'); if ((backgroundImage != '') && (getStyle(el, 'backgroundRepeat') == 'no-repeat')) { var regex = /^url\(['']?(http[^'')]*)['']?\)$/i; var match = regex.exec(backgroundImage); if (match) { url = match[1]; var image = new Image(); image.src = url; var containerWidth = el.offsetWidth, containerHeight = el.offsetHeight; var naturalWidth = image.width || containerWidth, naturalHeight = image.height || containerHeight; var width, height; var backgroundSize = getStyle(el, 'backgroundSize'); switch(backgroundSize) { case 'auto': case '': width = naturalWidth; height = naturalHeight; break; case 'cover': var scaleRatio = Math.max(containerWidth / naturalWidth, containerHeight / naturalHeight); width = Math.round(naturalWidth * scaleRatio); height = Math.round(naturalHeight * scaleRatio); break; case 'contain': var scaleRatio = Math.min(containerWidth / naturalWidth, containerHeight / naturalHeight); width = Math.round(naturalWidth * scaleRatio); height = Math.round(naturalHeight * scaleRatio); break; default: var widthAndHeight = backgroundSize.split(' '), styleWidth = widthAndHeight[0], styleHeight = widthAndHeight[1]; width = bgSizeFromContainer(styleWidth, containerWidth) || naturalWidth; height = bgSizeFromContainer(styleHeight, containerHeight) || Math.round(width * naturalHeight / naturalWidth); } images.push({'url': url, 'width': width, 'height': height, 'naturalWidth': naturalWidth, 'naturalHeight': naturalHeight }); } } } if (el.tagName == 'IFRAME') { try { var im = wptImages(el.contentWindow); if (im && im.length) { images = images.concat(im); } } catch(e) {} } } return images; }; return JSON.stringify(wptImages()); ",
    "paths": {
      "imageList": process.env.WTP_IMAGE_LIST_PATH || 'data.median.firstView.CloudinaryImages',
      "imageListFallback": process.env.WTP_IMAGE_FALLBACK_PATH || 'data.median.firstView.Images',
      "rawData": process.env.WTP_IMAGE_RAW_DATA || 'data.median.firstView.requests',
      "dpi": process.env.WTP_DPI_PATH || 'data.median.firstView.Dpi',
      "resolution": process.env.WTP_RES_PATH  || 'data.median.firstView.Resolution',
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
    "transformations": process.env.CLOUDINARY_TRANSF || [
      {quality: 'auto', crop: 'fit'},
      {quality: 'auto', fetch_format: 'webp', crop: 'fit'},
      {quality: 'auto', fetch_format: 'wdp', crop: 'fit'},
      {quality: 'auto', fetch_format: 'png', crop: 'fit'}
    ]
  }
};

module.exports = conf;
