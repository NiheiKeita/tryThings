/*! Stereogram.js (https://github.com/peeinears/Stereogram.js)
 *
 *  MIT License (http://www.opensource.org/licenses/mit-license.html)
 *  Copyright (c) 2014 Ian Pearce
 */

!(function(){
  'use strict';

  var Stereogram = {

    render: function (opts) {
      opts = opts || {};

      var defaultOptions = {
        width: null,
        height: null,
        depthMap: null,
        depthMapper: new Stereogram.DepthMapper(),
        imageType: 'png',
        colors: [
          [255, 255, 255, 255],
          [0, 0, 0, 255]
        ]
      };

      for (var property in defaultOptions) {
        if( ! opts.hasOwnProperty(property) ) opts[property] = defaultOptions[property];
      }

      var element, width, height, depthMap, pixelData, i;

      // find and set element
      if (opts.el) {
        element = (typeof opts.el === 'string' ? document.getElementById(opts.el) : opts.el);
        if (!element || !element.tagName) throw('Stereogram: Could not find element: ' + opts.el);
      }

      // use element's height and width unless height and width is provided
      width = opts.width || element.width;
      if (!width) throw('Stereogram: width not set and could not be inferred from element: ' + opts.el);
      height = opts.height || element.height;
      if (!height) throw('Stereogram: height not set and could not be inferred from element: ' + opts.el);

      // use depthMap if provided, otherwise use depthMap generated by given depthMapper
      if (opts.depthMap) {
        depthMap = opts.depthMap;
      } else if (opts.depthMapper) {
        depthMap = opts.depthMapper.generate(width, height);
      } else throw('Stereogram: no depthMap or depthMapper opts given');

      // convert hex colors to RGBa
      for (i = 0; i < opts.colors.length; i++) {
        if (typeof opts.colors[i] === 'string') {
          opts.colors[i] = this.helpers.hexToRGBa(opts.colors[i]);
        }
      }

      pixelData = this.generatePixelData({
        width: width,
        height: height,
        depthMap: depthMap,
        colors: opts.colors
      });

      switch (element.tagName) {
      case 'CANVAS':
        this.renderToCanvas(element, pixelData, width, height);
        break;

      case 'IMG':
        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        this.renderToCanvas(canvas, pixelData, width, height);
        element.src = canvas.toDataURL('image/' + (opts.imageType || 'png'));
        break;

      default:
        throw('Stereogram: el must be either a <canvas> or an <img>');
      }

      return this;
    },

    renderToCanvas: function (canvas, pixelData, width, height) {
      var context = canvas.getContext("2d"),
          imageData = context.createImageData(width, height);
      imageData.data.set(pixelData);
      context.putImageData(imageData, 0, 0);
    },

    generatePixelData: function (opts) {

      /*
       * This algorithm was published in a paper authored by by Harold W.
       * Thimbleby, Stuart Inglis, and Ian H. Witten. The following code was
       * translated from the C code that was featured in the article.
       * http://www.cs.sfu.ca/CourseCentral/414/li/material/refs/SIRDS-Computer-94.pdf
       */

      var x, y, i, left, right, visible, t, zt, k, sep, z, pixelOffset, rgba,
          width = opts.width,
          height = opts.height,
          depthMap = opts.depthMap,
          numColors = opts.colors.length,
          same, // points to a pixel to the right
          dpi = 72, // assuming output of 72 dots per inch
          eyeSep = Math.round(2.5 * dpi), // eye separation assumed to be 2.5 inches
          mu = (1 / 3), // depth of field (fraction of viewing distance)
          pixels = new Uint8ClampedArray(width * height * 4);

      // for each row
      for (y = 0; y < height; y++) {
        // max image width (for Uint16Array) is 65536
        same = new Uint16Array(width); // points to a pixel to the right

        for (x = 0; x < width; x++) {
          same[x] = x; // each pixel is initially linked with itself
        }

        // for each column
        for (x = 0; x < width; x++) {

          z = depthMap[y][x];

          // stereo separation corresponding to z
          sep = Math.round((1 - (mu * z)) * eyeSep / (2 - (mu * z)));

          // x-values corresponding to left and right eyes
          left = Math.round(x - ((sep + (sep & y & 1)) / 2));
          right = left + sep;

          if (0 <= left && right < width) {

            // remove hidden surfaces
            t = 1;
            do {
              zt = z + (2 * (2 - (mu * z)) * t / (mu * eyeSep));
              visible = (depthMap[y][x-t] < zt) && (depthMap[y][x+t] < zt); // false if obscured
              t++;
            } while (visible && zt < 1);

            if (visible) {
              // record that left and right pixels are the same
              for (k = same[left]; k !== left && k !== right; k = same[left]) {
                if (k < right) {
                  left = k;
                } else {
                  left = right;
                  right = k;
                }
              }
              same[left] = right;
            }
          }
        }

        for (x = (width - 1); x >= 0; x--) {
          pixelOffset = (y * width * 4) + (x * 4);
          if (same[x] === x) {
            // set random color
            rgba = opts.colors[Math.floor(Math.random() * numColors)];
            for (i = 0; i < 4; i++) {
              pixels[pixelOffset + i] = rgba[i];
            }
          } else {
            // constrained pixel, obey constraint
            pixelOffset = (y * width * 4) + (x * 4);
            for (i = 0; i < 4; i++) {
              pixels[pixelOffset + i] = pixels[(y * width * 4) + (same[x] * 4) + i];
            }
          }
        }
      }

      return pixels;
    },

    helpers: {

      // http://stackoverflow.com/a/5624139
      hexToRGBa: function (hex) {
        // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
        var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, function(m, r, g, b) {
          return r + r + g + g + b + b;
        });

        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16),
          255
        ] : null;
      }
    }

  };


// -- DepthMapper --

  var DepthMapper = function () {};

  DepthMapper.prototype.autoResize = true;

  DepthMapper.prototype.make = function (width, height) {
    // !!! Overwrite this method
    return [[0]];
  };

  DepthMapper.prototype.generate = function (width, height) {
    if (this.autoResize) return this.resize(this.make(width, height), width, height);
    else return this.make(width, height);
  };

  DepthMapper.prototype.resize = function (origDepthMap, width, height) {
    var origDepthMapY, x, y,
        resizedDepthMap = [],
        origDepthMapHeight = origDepthMap.length,
        origDepthMapWidth = origDepthMap[0].length;

    if (origDepthMapWidth === width && origDepthMapHeight === height) {
      return origDepthMap;
    }

    for (y = 0; y < height; y++) {
      resizedDepthMap[y] = new Float32Array(width);
      origDepthMapY = Math.floor(y * origDepthMapHeight / height);
      for (x = 0; x < width; x++) {
        resizedDepthMap[y][x] = origDepthMap[origDepthMapY][Math.floor(x * origDepthMapWidth / width)];
      }
    }

    return resizedDepthMap;
  };

  // Credit: backbone, underscore
  DepthMapper.extend = function (protoProps) {
    var parent = this;
    var child;

    var extend = function(obj) {
      if (!obj || (typeof obj != 'function' && typeof obj != 'object')) return obj;
      var source, prop;
      for (var i = 1, length = arguments.length; i < length; i++) {
        source = arguments[i];
        for (prop in source) {
          obj[prop] = source[prop];
        }
      }
      return obj;
    };

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent's constructor.
    if (protoProps && hasOwnProperty.call(protoProps, 'constructor')) {
      child = protoProps.constructor;
    } else {
      child = function(){ return parent.apply(this, arguments); };
    }

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    var Surrogate = function(){ this.constructor = child; };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate;

    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) extend(child.prototype, protoProps);

    // Set a convenience property in case the parent's prototype is needed
    // later.
    child.__super__ = parent.prototype;

    return child;
  };

  Stereogram.DepthMapper = DepthMapper;


  this.Stereogram = Stereogram;
  // Backward compatibility
  this.MagicEye = this.Stereogram;

}).call(this);
