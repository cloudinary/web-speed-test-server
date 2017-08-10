// Minification is currently manual, copy-paste each metric function into https://javascript-minifier.com/
// (without the "return result;", then can remove the result var and return directly
[CloudinaryResolution]
var result = function() {
  /* https://andylangton.co.uk/blog/development/get-viewportwindow-size-width-and-height-javascript */
  function calcViewport() {
      var e = window, a = 'inner';
      if (!('innerWidth' in window )) {
          a = 'client';
          e = document.documentElement || document.body;
      }
      return { width : e[ a+'Width' ] , height : e[ a+'Height' ] };
  }

  var calcRes = function() {
    var viewport = calcViewport();
    return {
      screen: {
        absolute: {
          height: window.screen.height,
          width: window.screen.width
        },
        available: {
          height: window.screen.availHeight,
          width: window.screen.availWidth
        }
      },
      viewport: {
        width: viewport['width'],
        height: viewport['height']
      }
    };
  };

  return JSON.stringify(calcRes());
}();

return result;

[CloudinaryImages]
var result = function() {

  /* from https://stackoverflow.com/a/2664055/750452 */
  var getStyle = function (el, styleProp) {
    var value, defaultView = (el.ownerDocument || document).defaultView;
    /* W3C standard way: */
    if (defaultView && defaultView.getComputedStyle) {
      /* sanitize property name to css notation (hypen separated words eg. font-Size) */
      styleProp = styleProp.replace(/([A-Z])/g, '-$1').toLowerCase();
      return defaultView.getComputedStyle(el, null).getPropertyValue(styleProp);
    } else if (el.currentStyle) { /* IE */
      /* sanitize property name to camelCase */
      styleProp = styleProp.replace(/\-(\w)/g, function(str, letter) {
        return letter.toUpperCase();
      });
      value = el.currentStyle[styleProp];
      /* convert other units to pixels on IE */
      if (/^\d+(em|pt|%|ex)?$/i.test(value)) { 
        return (function(value) {
          var oldLeft = el.style.left, oldRsLeft = el.runtimeStyle.left;
          el.runtimeStyle.left = el.currentStyle.left;
          el.style.left = value || 0;
          value = el.style.pixelLeft + 'px';
          el.style.left = oldLeft;
          el.runtimeStyle.left = oldRsLeft;
          return value;
        })(value);
      }
      return value;
    } else {
      return '';
    }
  };

  var bgSizeFromContainer = function(styleLength, containerSize) {
    if (styleLength == undefined)
      return null;
    if (/px/.test(styleLength)) {
      return parseInt(styleLength);
    } else { /* percent */
      return Math.round(containerSize * parseInt(styleLength) / 100); 
    }
  };

  var testImage; /* reuse the test Image */
  var naturalImageSize = function(url) {
    /* We should use testImage.onload before fetching width and height but we can't use non-blocking operations in WPT custom metrics */
    testImage = testImage || new Image();
    testImage.src = url;
    return { width: testImage.width, height: testImage.height };
  }

  var images = [];
  var wptImages = function(imageRoots) {
    try {
      imageRoots = imageRoots || window.document.children;
      var elements = [];
      for (var imageRootIndex = 0; imageRootIndex < imageRoots.length; imageRootIndex++) {
        elements.push(imageRoots[imageRootIndex]);
        var rootElements = imageRoots[imageRootIndex].getElementsByTagName('*');
        for (var elementIndex = 0; elementIndex < rootElements.length; elementIndex++) {
          elements.push(rootElements[elementIndex]);
        }
      }

      for (var i = 0; i < elements.length; i++) {
        if (images.length > 10000) { return; } // safety

        var el = elements[i];

        if (getStyle(el, 'display') == 'none' || getStyle(el, 'visibility') == 'hidden') {
          continue;
        }

        if (el.tagName == 'IMG') {
          var url = el.currentSrc || el.src;
          if (url && url.indexOf('http') === 0) {
            var naturalSize = naturalImageSize(url);
            images.push({'url': url, 'width': el.width, 'height': el.height, 'naturalWidth': naturalSize['width'] || el.naturalWidth, 'naturalHeight': naturalSize['height'] || el.naturalHeight});
          }
        } else {
          var backgroundImage = getStyle(el, 'backgroundImage');
          if ((backgroundImage != '') && (getStyle(el, 'backgroundRepeat').indexOf('round') == -1)) {
            var regex = /^url\(["']?(http[^'")]*)["']?\)$/i;
            var match = regex.exec(backgroundImage);
            if (match) {
              var url = match[1];
              var naturalSize = naturalImageSize(url);
              var containerWidth = el.offsetWidth, containerHeight = el.offsetHeight;
              var naturalWidth = naturalSize['width'] || containerWidth, naturalHeight = naturalSize['height'] || containerHeight;
              var backgroundSize = getStyle(el, 'backgroundSize');
              var width, height;
              switch(backgroundSize) {
                case 'auto':
                case '':
                  width = naturalWidth;
                  height = naturalHeight;
                  break;
                case 'cover':
                  var scaleRatio = Math.max(containerWidth / naturalWidth, containerHeight / naturalHeight);
                  width = Math.round(naturalWidth * scaleRatio);
                  height = Math.round(naturalHeight * scaleRatio);
                  break;
                case 'contain':
                  var scaleRatio = Math.min(containerWidth / naturalWidth, containerHeight / naturalHeight);
                  width = Math.round(naturalWidth * scaleRatio);
                  height = Math.round(naturalHeight * scaleRatio);
                  break;
                default:
                  var widthAndHeight = backgroundSize.split(' '), styleWidth = widthAndHeight[0], styleHeight = widthAndHeight[1];
                  width = bgSizeFromContainer(styleWidth, containerWidth) || naturalWidth;
                  height = bgSizeFromContainer(styleHeight, containerHeight) || Math.round(width * naturalHeight / naturalWidth);
              }
              if (width && height) {
                images.push({'url': url, 'width': width, 'height': height, 'naturalWidth': naturalWidth, 'naturalHeight': naturalHeight });
              }
            }
          }
        }

        /* handle subdocuments recursively */
        if (el.tagName == 'IFRAME' || el.shadowRoot) {
          try {
            var imageRoots;
            if (el.shadowRoot) {
              imageRoots = el.shadowRoot.children;
            } else {
              var subWindow = el.contentWindow;
              // In some cases, element.contentWindow defaults to top-level window
              if (subWindow != window) {
                imageRoots = subWindow.document.children;
              }
            }
            if (imageRoots && imageRoots.length) {
              wptImages(imageRoots);
            }
          } catch(e) {
          }
        }
      }
      return;
    } catch(e) { 
      return; 
    }
  };

  wptImages();
  return JSON.stringify(images);
}();

return result;
