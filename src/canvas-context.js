// https://developer.mozilla.org/en-US/Add-ons/Code_snippets/Canvas
//
// Create chainable canvas context object.


function Canvas2DContext(c) {
  if (typeof c === 'string') {
    c = document.getElementById(c);
  }
  if (!(this instanceof Canvas2DContext)) {
    return new Canvas2DContext(c);
  }
  this.context = this.ctx = c.getContext('2d');
  if (!Canvas2DContext.prototype.arc) {
    Canvas2DContext.setup.call(this, this.ctx);
  }
}

Canvas2DContext.setup = function (thisCtx) {
  var methods = ['arc','arcTo','beginPath','bezierCurveTo','clearRect','clip',
    'closePath','drawImage','fill','fillRect','fillText','lineTo','moveTo',
    'quadraticCurveTo','rect','restore','rotate','save','scale','setTransform',
    'stroke','strokeRect','strokeText','transform','translate'];

  var getterMethods = ['createPattern','drawFocusRing','isPointInPath','measureText',
    // drawFocusRing not currently supported
    // The following might instead be wrapped to be able to chain their child objects
    'createImageData','createLinearGradient',
    'createRadialGradient', 'getImageData','putImageData'
  ];

  var props = ['canvas','fillStyle','font','globalAlpha','globalCompositeOperation',
  'lineCap','lineJoin','lineWidth','miterLimit','shadowOffsetX','shadowOffsetY',
  'shadowBlur','shadowColor','strokeStyle','textAlign','textBaseline'];

  /** Setup delegated methods.
   */
  var gmethl, propl;
  for (var i = 0, methl = methods.length; i < methl; i++) {
    var m = methods[i];
    Canvas2DContext.prototype[m] = (function (m) {return function () {
      this.ctx[m].apply(this.ctx, arguments);
      return this;
    };}(m));
  }

  /** Setup getters.
   */
  for (i = 0, gmethl = getterMethods.length; i < gmethl; i++) {
    var gm = getterMethods[i];
    Canvas2DContext.prototype[gm] = (function (gm) {return function () {
      return this.ctx[gm].apply(this.ctx, arguments);
    };}(gm));
  }

  /** Setup property access methods.
   */
  for (i = 0, propl = props.length; i < propl; i++) {
    var p = props[i];
    Canvas2DContext.prototype[p] = (function (p) {return function (value) {
      if (typeof value === 'undefined') {
        return this.ctx[p];
      }
      this.ctx[p] = value;
      return this;
    };}(p));
  }
};


/** Reset the context quickly.
 */
Canvas2DContext.prototype.clearCanvas = function () {
  // return this.clearRect(0, 0, this.canvas().width, this.canvas().height);
  var c = this.canvas();
  c.width = c.width;
  return this;
};

/** Invoke layer function with keeping current drawing style state.
 * @param {layerFn} layer function
 * @param {...} arguments passed to the layer function
 */
Canvas2DContext.prototype.layer = function (layerFn) {
  this.save();
  try {
    return this.layer0.apply(this, arguments);
  } finally {
    this.restore();
  }
};


/** Invoke layer function in context of this proxy object.
 *
 *  // Example
 *  (Canvas2DContext '#cnv').layer(function (label) {
 *    this.translate(label.x, label.y).
 *      font('11px Comic Sans').
 *      fillText(label.text);
 *  }, myLabel);
 * @param {Function} layer function
 * @param {...} arguments passed to the layer function
 */
Canvas2DContext.prototype.layer0 = function (layerFn) {
  var args = Array.prototype.slice.call(arguments, 1);
  return layerFn.apply(this, args), this;
};


/** Fill text, cut when text box width exceeds maxWidth.
 * @param {String} text
 * @param {Number} base x coordinate
 * @param {Number} base y coordinate
 * @param {Number} maximum text box width
 * @param {String} tail. Defaults to ' ...'.
 */
Canvas2DContext.prototype.fillTextEllipsize = function (text, x, y, maxWidth, tail) {
  var xtext = text, len = xtext.length;

  if (typeof tail === 'undefined') {
    tail = ' ...';
  }

  while (0 < len && maxWidth < this.measureText(xtext).width) {
    xtext = text.substr(0, --len) + tail;
  }

  if (0 < len) this.fillText(xtext, x, y, maxWidth);

  return this;
};


/** Fill text paragraph wrapped by maximum width.
 * @param {String} paragraph text
 * @param {Number} base x coordinate
 * @param {Number} base y coordinate
 * @param {Number} maximum paragraph width
 * @param {Number} line height
 */
Canvas2DContext.prototype.fillTextWrap = function (text, x, y, maxWidth, lineHeight) {
  var line = [], para = [], words = text.split(/\s+/);

  while (words.length) {
    line.push(words.shift());

    if (maxWidth < this.measureText(line.join(' ')).width) {
      para.push(line);
      line = [line.pop()];
    }
  }

  if (line.length) {
    para.push(line);
  }

  return this.layer(function () {
    var k, kk, line;

    this.translate(x, y);

    for (k = 0, kk = para.length; k < kk; ++k) {
      if ((line = para[k]).length) {
        this.fillText(line.join(' '), 0, 0).
        translate(0, lineHeight);
      }
    }
  });
};


/** Draws a rounded rectangle using the current state of the canvas.
 * If you omit the last three params, it will draw a rectangle
 * outline with a 5 pixel border radius
 * @param {Number} x The top left x coordinate
 * @param {Number} y The top left y coordinate
 * @param {Number} width The width of the rectangle
 * @param {Number} height The height of the rectangle
 * @param {Number} radius The corner radius. Defaults to 5;
 * @param {Boolean} fill Whether to fill the rectangle. Defaults to false.
 * @param {Boolean} stroke Whether to stroke the rectangle. Defaults to true.
 */
Canvas2DContext.prototype.roundRect = function (x, y, width, height, radius, fill, stroke) {
  if (typeof stroke === "undefined" ) {
    stroke = true;
  }

  if (typeof radius === "undefined") {
    radius = 5;
  }

  this.beginPath().
    moveTo(x + radius, y).
    lineTo(x + width - radius, y).
    quadraticCurveTo(x + width, y, x + width, y + radius).
    lineTo(x + width, y + height - radius).
    quadraticCurveTo(x + width, y + height, x + width - radius, y + height).
    lineTo(x + radius, y + height).
    quadraticCurveTo(x, y + height, x, y + height - radius).
    lineTo(x, y + radius).
    quadraticCurveTo(x, y, x + radius, y).
    closePath();

  if (fill) {
    this.fill();
  }

  if (stroke) {
    this.stroke();
  }

  return this;
};
