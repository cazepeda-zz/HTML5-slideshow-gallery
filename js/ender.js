/*!
  * Ender: open module JavaScript framework
  * copyright Dustin Diaz & Jacob Thornton 2011 (@ded @fat)
  * https://ender.no.de
  * License MIT
  * Build: ender -b jeesh emile reqwest bowser underscore morpheus
  */
!function (context) {

  function aug(o, o2) {
    for (var k in o2) {
      k != 'noConflict' && k != '_VERSION' && (o[k] = o2[k]);
    }
    return o;
  }

  function boosh(s, r) {
    var els;
    if (ender._select && typeof s == 'string' || s.nodeName || s.length && 'item' in s || s == window) { //string || node || nodelist || window
      els = ender._select(s, r);
      els.selector = s;
    } else {
      els = isFinite(s.length) ? s : [s];
    }
    return aug(els, boosh);
  }

  function ender(s, r) {
    return boosh(s, r);
  }

  aug(ender, {
    _VERSION: '0.2.0',
    ender: function (o, chain) {
      aug(chain ? boosh : ender, o);
    }
  });

  aug(boosh, {
    forEach: function (fn, scope) {
      // opt out of native forEach so we can intentionally call our own scope
      // defaulting to the current item
      for (var i = 0, l = this.length; i < l; ++i) {
        i in this && fn.call(scope || this[i], this[i], i, this);
      }
      // return self for chaining
      return this;
    }
  });

  var old = context.$;
  ender.noConflict = function () {
    context.$ = old;
    return this;
  };

  (typeof module !== 'undefined') && module.exports && (module.exports = ender);
  // use subscript notation as extern for Closure compilation
  context['ender'] = context['$'] = ender;

}(this);
/*!
  * emile.js (c) 2009 - 2011 Thomas Fuchs
  * Licensed under the terms of the MIT license.
  */
!function (context) {
  var parseEl = document.createElement('div'),
      prefixes = ["webkit", "Moz", "O"],
      j = 3,
      prefix,
      _prefix,
      d = /\d+$/,
      animationProperties = {},
      baseProps = 'backgroundColor borderBottomColor borderLeftColor ' +
        'borderRightColor borderTopColor color fontWeight lineHeight ' +
        'opacity outlineColor zIndex',
      pixelProps = 'top bottom left right ' +
        'borderWidth borderBottomWidth borderLeftWidth borderRightWidth borderTopWidth ' +
        'borderSpacing borderRadius ' +
        'marginBottom marginLeft marginRight marginTop ' +
        'width height ' +
        'maxHeight maxWidth minHeight minWidth ' +
        'paddingBottom paddingLeft paddingRight paddingTop ' +
        'fontSize wordSpacing textIndent letterSpacing ' +
        'outlineWidth outlineOffset',

      props = (baseProps + ' ' + pixelProps).split(' ');

  while (j--) {
    _prefix = prefixes[j];
    parseEl.style.cssText = "-" + _prefix.toLowerCase() + "-transition-property:opacity;";
    if (typeof parseEl.style[_prefix + "TransitionProperty"] != "undefined") {
      prefix = _prefix;
    }
  }
  var transitionEnd = /^w/.test(prefix) ? 'webkitTransitionEnd' : 'transitionend';
  for (var p = pixelProps.split(' '), i = p.length; i--;) {
    animationProperties[p[i]] = 1;
  }

  function map(o, fn, scope) {
    var a = [], i;
    for (i in o) {
      a.push(fn.call(scope, o[i], i, o));
    }
    return a;
  }

  function camelize(s) {
    return s.replace(/-(.)/g, function (m, m1) {
      return m1.toUpperCase();
    });
  }

  function serialize(o, modify) {
    return map(o, function (v, k) {
      var kv = modify ? modify(k, v) : [k, v];
      return kv[0] + ':' + kv[1] + ';';
    }).join('');
  }

  function camelToDash(s) {
    if (s.toUpperCase() === s) {
      return s;
    }
    return s.replace(/([a-zA-Z0-9])([A-Z])/g, function (m, m1, m2) {
      return (m1 + "-" + m2);
    }).toLowerCase();
  }

  function interpolate(source, target, pos) {
    return (source + (target - source) * pos).toFixed(3);
  }

  function s(str, p, c) {
    return str.substr(p, c || 1);
  }

  function color(source, target, pos) {
    var i = 2, j, c, tmp, v = [], r = [];
    while ((j = 3) && (c = arguments[i - 1]) && i--) {
      if (s(c, 0) == 'r') {
        c = c.match(/\d+/g);
        while (j--) {
          v.push(~~c[j]);
        }
      } else {
        if (c.length == 4) {
          c = '#' + s(c, 1) + s(c, 1) + s(c, 2) + s(c, 2) + s(c, 3) + s(c, 3);
        }
        while (j--) {
          v.push(parseInt(s(c, 1 + j * 2, 2), 16));
        }
      }
    }
    while (j--) {
      tmp = ~~(v[j + 3] + (v[j] - v[j + 3]) * pos);
      r.push(tmp < 0 ? 0 : tmp > 255 ? 255 : tmp);
    }
    return 'rgb(' + r.join(',') + ')';
  }

  function parse(prop) {
    var p = parseFloat(prop), q = prop ? prop.replace(/^[\-\d\.]+/, '') : prop;
    return isNaN(p) ?
      { v: q,
        f: color,
        u: ''
      } :
      {
        v: p,
        f: interpolate,
        u: q
      };
  }

  function normalize(style) {
    var css, rules = {}, i = props.length, v;
    parseEl.innerHTML = '<div style="' + style + '"></div>';
    css = parseEl.childNodes[0].style;
    while (i--) {
      (v = css[props[i]]) && (rules[props[i]] = parse(v));
    }
    return rules;
  }

  function _emile(el, style, opts, after) {
    opts = opts || {};
    var target = normalize(style),
        comp = el.currentStyle ? el.currentStyle : getComputedStyle(el, null),
        current = {}, start = +new Date(), prop,
        dur = opts.duration || 200, finish = start + dur, interval,
        easing = opts.easing || function (pos) {
          return (-Math.cos(pos * Math.PI) / 2) + 0.5;
        };
    for (prop in target) {
      current[prop] = parse(comp[prop]);
    }
    interval = setInterval(function () {
      var time = +new Date(), p, pos = time > finish ? 1 : (time - start) / dur;
      for (p in target) {
        el.style[p] = target[p].f(current[p].v, target[p].v, easing(pos)) + target[p].u;
      }
      if (time > finish) {
        clearInterval(interval);
        opts.after && opts.after();
        after && setTimeout(after, 1);
      }
    }, 10);
  }

  function nativeAnim(el, o, opts) {
    var props = [],
        styles = [],
        duration = opts.duration || 1000,
        easing = opts.easing || 'ease-out',
        newStyle = '';
    duration = duration + 'ms';
    el.addEventListener(transitionEnd, function f() {
	  el.setAttribute('style', newStyle);
      if(opts.after) opts.after();
      el.removeEventListener(transitionEnd, f, true);
    }, true);

    setTimeout(function () {
      var k;
      for (k in o) {
        o.hasOwnProperty(k) && props.push(camelToDash(k) + ' ' + duration + ' ' + easing);
      }
      for (k in o) {
        var v = (camelize(k) in animationProperties) && d.test(o[k]) ? o[k] + 'px' : o[k];
        o.hasOwnProperty(k) && (el.style[camelize(k)] = v);
      }
      newStyle = el.getAttribute('style');
      props = props.join(',');
      el.style[prefix + 'Transition'] = props;
    }, 10);

  }

  function clone(o) {
    var r = {};
    for (var k in o) {
      r[k] = o[k];
      (k == 'after') && delete o[k];
    }
    return r;
  }

  function emile(el, o) {
    el = typeof el == 'string' ? document.getElementById(el) : el;
    o = clone(o);
    var opts = {
      duration: o.duration,
      easing: o.easing,
      after: o.after
    };
    delete o.duration;
    delete o.easing;
    delete o.after;
    if (prefix && (typeof opts.easing !== 'function')) {
      return nativeAnim(el, o, opts);
    }
    var serial = serialize(o, function (k, v) {
      k = camelToDash(k);
      return (camelize(k) in animationProperties) && d.test(v) ?
        [k, v + 'px'] :
        [k, v];
    });
    _emile(el, serial, opts);
  }

  var old = context.emile;
  emile.noConflict = function () {
    context.emile = old;
    return this;
  };
  context.emile = emile;

}(this);
!function () {
  var e = emile.noConflict();
  var getOptions = function (duration, callback) {
    var d = typeof duration == 'number' ? duration : 1000;
    var cb = typeof callback == 'function' ? callback : typeof duration == 'function' ? duration : function(){};
    return [d, cb]
  };

  function fade(duration, callback, to) {
    var opts = getOptions(duration, callback);
    for (var i = 0, l = this.length; i < l; i++) {
      this[i].currentStyle || (this[i].style.opacity = to ? 0 : 1);
      this[i].currentStyle && (this[i].style.filter = 'alpha(opacity=' + (to ? 0 : 1 ) * 100 + ')');
      this[i].currentStyle && !this[i].currentStyle.hasLayout && (this[i].style.zoom = 1);
      this[i].style.display = '';
    }
    return this.animate({
      opacity: to,
      duration: opts[0],
      after: opts[1]
    });
  }

  $.ender({
    animate: function (o) {
      var self = this;
      // quick! look! over there! someone is kicking a puppy!
      setTimeout(function () {
        for (var i = 0, l = self.length; i < l; i++) {
          e(self[i], o);
        }
      }, 0);
      return this;
    },

    fadeIn: function (duration, callback) {
      return fade.call(this, duration, callback, 1);
    },

    fadeOut: function (duration, callback) {
      return fade.call(this, duration, callback, 0);
    }
  }, true);
}();
!function () { var exports = {}, module = { exports: exports }; /*!
  * Bowser - a browser detector
  * copyright Dustin Diaz 2011
  * https://github.com/ded/bowser
  * MIT License
  */
/*!
  * Bowser - a browser detector
  * copyright Dustin Diaz 2011
  * https://github.com/ded/bowser
  * MIT License
  */
!function (context) {
  /**
    * navigator.userAgent =>
    * Chrome:  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_7) AppleWebKit/534.24 (KHTML, like Gecko) Chrome/11.0.696.57 Safari/534.24"
    * Opera:   "Opera/9.80 (Macintosh; Intel Mac OS X 10.6.7; U; en) Presto/2.7.62 Version/11.01"
    * Safari:  "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_7; en-us) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1"
    * IE:      "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1; Trident/5.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; .NET4.0C)"
    * Firefox: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.6; rv:2.0) Gecko/20100101 Firefox/4.0"
    */

  var ua = navigator.userAgent,
      ie = /msie/i.test(ua),
      chrome = /chrome/i.test(ua),
      safari = /safari/i.test(ua) && !chrome,
      opera = /opera/i.test(ua),
      firefox = /firefox/i.test(ua),
      gecko = /gecko\//i.test(ua);

  function detect() {

    if (ie) {
      return {
        msie: 1,
        version: ua.match(/msie (\d+(\.\d+)?);/i)[1]
      };
    }
    if (chrome) {
      return {
        webkit: 1,
        chrome: 1,
        version: ua.match(/chrome\/(\d+(\.\d+)?)/i)[1]
      };
    }
    if (safari) {
      return {
        webkit: 1,
        safari: 1,
        version: ua.match(/version\/(\d+(\.\d+)?)/i)[1]
      };
    }
    if (opera) {
      return {
        opera: 1,
        version: ua.match(/version\/(\d+(\.\d+)?)/i)[1]
      };
    }
    if (gecko) {
      var o = {
        gecko: 1,
        version: ua.match(/firefox\/(\d+(\.\d+)?)/i)[1]
      };
      if (firefox) {
        o.firefox = 1;
      }
      return o;
    }

  }

  var bowser = detect();

  // Graded Browser Support
  // http://developer.yahoo.com/yui/articles/gbs
  if ((bowser.msie && bowser.version >= 6) ||
      (bowser.chrome && bowser.version >= 8) ||
      (bowser.firefox && bowser.version >= 3.6) ||
      (bowser.safari && bowser.version >= 5) ||
      (bowser.opera && bowser.version >= 9.5)) {
    bowser.a = true;
  }

  else if ((bowser.msie && bowser.version < 6) ||
      (bowser.chrome && bowser.version < 8) ||
      (bowser.firefox && bowser.version < 3.6) ||
      (bowser.safari && bowser.version < 5) ||
      (bowser.opera && bowser.version < 9.5)) {
    bowser.c = true;
  } else {
    bowser.x = true;
  }

  typeof module !== 'undefined' && module.exports ?
    (module.exports.browser = bowser) :
    (context.bowser = bowser);

}(this);
 $.ender(module.exports); }.call($);
/*!
  * Morpheus - A Brilliant Animator
  * https://github.com/ded/morpheus - (c) Dustin Diaz 2011
  * License MIT
  */
!function (context, doc, win) {

  var html = doc.documentElement,
      rgbOhex = /^rgb\(|#/,
      relVal = /^([+\-])=([\d\.]+)/,
      numUnit = /^(?:[\+\-]=)?\d+(?:\.\d+)?(%|in|cm|mm|em|ex|pt|pc|px)$/,
      // does this browser support the opacity property?
      opasity = function () {
        return typeof doc.createElement('a').style.opacity !== 'undefined';
      }(),
      // these elements do not require 'px'
      unitless = { lineHeight: 1, zoom: 1, zIndex: 1, opacity: 1 },

      // initial style is determined by the elements themselves
      getStyle = doc.defaultView && doc.defaultView.getComputedStyle ?
        function (el, property) {
          var value = null;
          var computed = doc.defaultView.getComputedStyle(el, '');
          computed && (value = computed[camelize(property)]);
          return el.style[property] || value;
        } : html.currentStyle ?

        function (el, property) {
          property = camelize(property);

          if (property == 'opacity') {
            var val = 100;
            try {
              val = el.filters['DXImageTransform.Microsoft.Alpha'].opacity;
            } catch (e1) {
              try {
                val = el.filters('alpha').opacity;
              } catch (e2) {}
            }
            return val / 100;
          }
          var value = el.currentStyle ? el.currentStyle[property] : null;
          return el.style[property] || value;
        } :

        function (el, property) {
          return el.style[camelize(property)];
        },

      rgb = function (r, g, b) {
        return '#' + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
      },

      // convert rgb and short hex to long hex
      toHex = function (c) {
        var m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(c);
        return (m ? rgb(m[1], m[2], m[3]) : c)
        .replace(/#(\w)(\w)(\w)$/, '#$1$1$2$2$3$3'); // short to long
      },

      // change font-size => fontSize etc.
      camelize = function (s) {
        return s.replace(/-(.)/g, function (m, m1) {
          return m1.toUpperCase();
        });
      },

      fun = function (f) {
        return typeof f == 'function';
      },

      frame = function () {
        // native animation frames
        // http://webstuff.nfshost.com/anim-timing/Overview.html
        // http://dev.chromium.org/developers/design-documents/requestanimationframe-implementation
        return win.requestAnimationFrame  ||
          win.webkitRequestAnimationFrame ||
          win.mozRequestAnimationFrame    ||
          win.oRequestAnimationFrame      ||
          win.msRequestAnimationFrame     ||
          function (callback) {
            win.setTimeout(function () {
              callback(+new Date());
            }, 10);
          };
      }();

  /**
    * Core tween method that requests each frame
    * @param duration: time in milliseconds. defaults to 1000
    * @param fn: tween frame callback function receiving 'position'
    * @param done {optional}: complete callback function
    * @param ease {optional}: easing method. defaults to easeOut
    * @param from {optional}: integer to start from
    * @param to {optional}: integer to end at
    * @returns method to stop the animation
    */
  function tween(duration, fn, done, ease, from, to) {
    ease = ease || function (t) {
      // default to a pleasant-to-the-eye easeOut (like native animations)
      return Math.sin(t * Math.PI / 2)
    };
    var time = duration || 1000,
        diff = to - from,
        start = +new Date(),
        stop = 0,
        end = 0;
    frame(run);

    function run(t) {
      var delta = t - start;
      if (delta > time || stop) {
        to = isFinite(to) ? to : 1;
        stop ? end && fn(to) : fn(to);
        done && done();
        return;
      }
      // if you don't specify a 'to' you can use tween as a generic delta tweener
      // cool, eh?
      isFinite(to) ?
        fn((diff * ease(delta / time)) + from) :
        fn(ease(delta / time));
      frame(run);
    }
    return {
      stop: function (jump) {
        stop = 1;
        end = jump; // jump to end of animation?
      }
    }
  }

  /**
    * generic bezier method for animating x|y coordinates
    * minimum of 2 points required (start and end).
    * first point start, last point end
    * additional control points are optional (but why else would you use this anyway ;)
    * @param points: array containing control points
       [[0, 0], [100, 200], [200, 100]]
    * @param pos: current be(tween) position represented as float  0 - 1
    * @return [x, y]
    */
  function bezier(points, pos) {
    var n = points.length, r = [], i, j;
    for (i = 0; i < n; ++i) {
      r[i] = [points[i][0], points[i][1]];
    }
    for (j = 1; j < n; ++j) {
      for (i = 0; i < n - j; ++i) {
        r[i][0] = (1 - pos) * r[i][0] + pos * r[parseInt(i + 1, 10)][0];
        r[i][1] = (1 - pos) * r[i][1] + pos * r[parseInt(i + 1, 10)][1];
      }
    }
    return [r[0][0], r[0][1]];
  }

  // this gets you the next hex in line according to a 'position'
  function nextColor(pos, start, finish) {
    var r = [], i, e;
    for (i = 0; i < 6; i++) {
      from = Math.min(15, parseInt(start.charAt(i),  16));
      to   = Math.min(15, parseInt(finish.charAt(i), 16));
      e = Math.floor((to - from) * pos + from);
      e = e > 15 ? 15 : e < 0 ? 0 : e;
      r[i] = e.toString(16);
    }
    return '#' + r.join('');
  }

  // this retreives the frame value within a sequence
  function getTweenVal(pos, units, begin, end, k, i, v) {
    if (typeof begin[i][k] == 'string') {
      return nextColor(pos, begin[i][k], end[i][k]);
    } else {
      // round so we don't get crazy long floats
      v = Math.round(((end[i][k] - begin[i][k]) * pos + begin[i][k]) * 1000) / 1000;
      // some css properties don't require a unit (like zIndex, lineHeight, opacity)
      !(k in unitless) && (v += units[i][k] || 'px');
      return v;
    }
  }

  // support for relative movement via '+=n' or '-=n'
  function by(val, start, m, r, i) {
    return (m = relVal.exec(val)) ?
      (i = parseFloat(m[2])) && (r = (start + i)) && m[1] == '+' ?
      r : start - i :
      parseFloat(val);
  }

  /**
    * morpheus:
    * @param element(s): HTMLElement(s)
    * @param options: mixed bag between CSS Style properties & animation options
    *  - {n} CSS properties|values
    *     - value can be strings, integers,
    *     - or callback function that receives element to be animated. method must return value to be tweened
    *     - relative animations start with += or -= followed by integer
    *  - duration: time in ms - defaults to 1000(ms)
    *  - easing: a transition method - defaults to an 'easeOut' algorithm
    *  - complete: a callback method for when all elements have finished
    *  - bezier: array of arrays containing x|y coordinates that define the bezier points. defaults to none
    *     - this may also be a function that receives element to be animated. it must return a value
    */
  function morpheus(elements, options) {
    var els = elements ? (els = isFinite(elements.length) ? elements : [elements]) : [], i,
        complete = options.complete,
        duration = options.duration,
        ease = options.easing,
        points = options.bezier,
        begin = [],
        end = [],
        units = [],
        bez = [],
        originalLeft,
        originalTop;

    delete options.complete;
    delete options.duration;
    delete options.easing;
    delete options.bezier;

    if (points) {
      // remember the original values for top|left
      originalLeft = options.left;
      originalTop = options.top;
      delete options.right;
      delete options.bottom;
      delete options.left;
      delete options.top;
    }

    for (i = els.length; i--;) {

      // record beginning and end states to calculate positions
      begin[i] = {};
      end[i] = {};
      units[i] = {};

      // are we 'moving'?
      if (points) {

        var left = getStyle(els[i], 'left'),
            top = getStyle(els[i], 'top'),
            xy = [by(fun(originalLeft) ? originalLeft(els[i]) : originalLeft || 0, parseFloat(left)),
                  by(fun(originalTop) ? originalTop(els[i]) : originalTop || 0, parseFloat(top))];

        bez[i] = fun(points) ? points(els[i], xy) : points;
        bez[i].push(xy);
        bez[i].unshift([
          parseInt(left, 10),
          parseInt(top, 10)
        ]);
      }

      for (var k in options) {
        var v = getStyle(els[i], k), unit,
            tmp = fun(options[k]) ? options[k](els[i]) : options[k]
        if (typeof tmp == 'string' &&
            rgbOhex.test(tmp) &&
            !rgbOhex.test(v)) {
          delete options[k]; // remove key :(
          continue; // cannot animate colors like 'orange' or 'transparent'
                    // only #xxx, #xxxxxx, rgb(n,n,n)
        }

        begin[i][k] = typeof tmp == 'string' && rgbOhex.test(tmp) ?
          toHex(v).slice(1) :
          parseFloat(v);
        end[i][k] = typeof tmp == 'string' && tmp.charAt(0) == '#' ?
          toHex(tmp).slice(1) :
          by(tmp, parseFloat(v));
        // record original unit
        typeof tmp == 'string' && (unit = tmp.match(numUnit)) && (units[i][k] = unit[1]);
      }
    }
    // ONE TWEEN TO RULE THEM ALL
    return tween(duration, function (pos, v, xy) {
      // normally not a fan of optimizing for() loops, but we want something
      // fast for animating
      for (i = els.length; i--;) {
        if (points) {
          xy = bezier(bez[i], pos);
          els[i].style.left = xy[0] + 'px';
          els[i].style.top = xy[1] + 'px';
        }
        for (var k in options) {
          v = getTweenVal(pos, units, begin, end, k, i);
          k == 'opacity' && !opasity ?
            (els[i].style.filter = 'alpha(opacity=' + (v * 100) + ')') :
            (els[i].style[camelize(k)] = v);
        }
      }
    }, complete, ease);
  }

  // expose useful methods
  morpheus.tween = tween;
  morpheus.getStyle = getStyle;
  morpheus.bezier = bezier;

  typeof module !== 'undefined' && module.exports &&
    (module.exports = morpheus);
  context['morpheus'] = morpheus;

}(this, document, window);!function ($) {
  $.ender({
    animate: function (options) {
      morpheus(this, options);
      return this;
    },
    fadeIn: function (d, fn) {
      morpheus(this, {
        duration: d,
        opacity: 1,
        complete: fn
      });
      return this;
    },
    fadeOut: function (d, fn) {
      morpheus(this, {
        duration: d,
        opacity: 0,
        complete: fn
      });
      return this;
    }
  }, true);
  $.ender({
    tween: morpheus.tween
  })
}(ender);
!function () { var exports = {}, module = { exports: exports }; //     Underscore.js 1.1.6
//     (c) 2011 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore is freely distributable under the MIT license.
//     Portions of Underscore are inspired or borrowed from Prototype,
//     Oliver Steele's Functional, and John Resig's Micro-Templating.
//     For all details and documentation:
//     http://documentcloud.github.com/underscore

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var slice            = ArrayProto.slice,
      unshift          = ArrayProto.unshift,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) { return new wrapper(obj); };

  // Export the Underscore object for **CommonJS**, with backwards-compatibility
  // for the old `require()` API. If we're not in CommonJS, add `_` to the
  // global object.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = _;
    _._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.1.6';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects implementing `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (_.isNumber(obj.length)) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results[results.length] = iterator.call(context, value, index, list);
    });
    return results;
  };

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = memo !== void 0;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial && index === 0) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError("Reduce of empty array with no initial value");
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return memo !== void 0 ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var reversed = (_.isArray(obj) ? obj.slice() : _.toArray(obj)).reverse();
    return _.reduce(reversed, iterator, memo, context);
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    each(obj, function(value, index, list) {
      if (!iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result = iterator.call(context, value, index, list)) return breaker;
    });
    return result;
  };

  // Determine if a given value is included in the array or object using `===`.
  // Aliased as `contains`.
  _.include = _.contains = function(obj, target) {
    var found = false;
    if (obj == null) return found;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    any(obj, function(value) {
      if (found = value === target) return true;
    });
    return found;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    return _.map(obj, function(value) {
      return (method.call ? method || value : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Return the maximum element or (element-based computation).
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj)) return Math.max.apply(Math, obj);
    var result = {computed : -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed >= result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj)) return Math.min.apply(Math, obj);
    var result = {computed : Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, iterator, context) {
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria, b = right.criteria;
      return a < b ? -1 : a > b ? 1 : 0;
    }), 'value');
  };

  // Use a comparator function to figure out at what index an object should
  // be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator) {
    iterator || (iterator = _.identity);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >> 1;
      iterator(array[mid]) < iterator(obj) ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely convert anything iterable into a real, live array.
  _.toArray = function(iterable) {
    if (!iterable)                return [];
    if (iterable.toArray)         return iterable.toArray();
    if (_.isArray(iterable))      return iterable;
    if (_.isArguments(iterable))  return slice.call(iterable);
    return _.values(iterable);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    return _.toArray(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head`. The **guard** check allows it to work
  // with `_.map`.
  _.first = _.head = function(array, n, guard) {
    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
  };

  // Returns everything but the first entry of the array. Aliased as `tail`.
  // Especially useful on the arguments object. Passing an **index** will return
  // the rest of the values in the array from that index onward. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = function(array, index, guard) {
    return slice.call(array, (index == null) || guard ? 1 : index);
  };

  // Get the last element of an array.
  _.last = function(array) {
    return array[array.length - 1];
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, function(value){ return !!value; });
  };

  // Return a completely flattened version of an array.
  _.flatten = function(array) {
    return _.reduce(array, function(memo, value) {
      if (_.isArray(value)) return memo.concat(_.flatten(value));
      memo[memo.length] = value;
      return memo;
    }, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    var values = slice.call(arguments, 1);
    return _.filter(array, function(value){ return !_.include(values, value); });
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted) {
    return _.reduce(array, function(memo, el, i) {
      if (0 == i || (isSorted === true ? _.last(memo) != el : !_.include(memo, el))) memo[memo.length] = el;
      return memo;
    }, []);
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersect = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var args = slice.call(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i = 0; i < length; i++) results[i] = _.pluck(args, "" + i);
    return results;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i, l;
    if (isSorted) {
      i = _.sortedIndex(array, item);
      return array[i] === item ? i : -1;
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item);
    for (i = 0, l = array.length; i < l; i++) if (array[i] === item) return i;
    return -1;
  };


  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item) {
    if (array == null) return -1;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) return array.lastIndexOf(item);
    var i = array.length;
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Binding with arguments is also known as `curry`.
  // Delegates to **ECMAScript 5**'s native `Function.bind` if available.
  // We check for `func.bind` first, to fail fast when `func` is undefined.
  _.bind = function(func, obj) {
    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    var args = slice.call(arguments, 2);
    return function() {
      return func.apply(obj, args.concat(slice.call(arguments)));
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length == 0) funcs = _.functions(obj);
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return hasOwnProperty.call(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(func, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Internal function used to implement `_.throttle` and `_.debounce`.
  var limit = function(func, wait, debounce) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var throttler = function() {
        timeout = null;
        func.apply(context, args);
      };
      if (debounce) clearTimeout(timeout);
      if (debounce || !timeout) timeout = setTimeout(throttler, wait);
    };
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time.
  _.throttle = function(func, wait) {
    return limit(func, wait, false);
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds.
  _.debounce = function(func, wait) {
    return limit(func, wait, true);
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      return memo = func.apply(this, arguments);
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func].concat(slice.call(arguments));
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = slice.call(arguments);
    return function() {
      var args = slice.call(arguments);
      for (var i=funcs.length-1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) { return func.apply(this, arguments); }
    };
  };


  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (hasOwnProperty.call(obj, key)) keys[keys.length] = key;
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    return _.map(obj, _.identity);
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    return _.filter(_.keys(obj), function(key){ return _.isFunction(obj[key]); }).sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      for (var prop in source) {
        if (source[prop] !== void 0) obj[prop] = source[prop];
      }
    });
    return obj;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      for (var prop in source) {
        if (obj[prop] == null) obj[prop] = source[prop];
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    // Check object identity.
    if (a === b) return true;
    // Different types?
    var atype = typeof(a), btype = typeof(b);
    if (atype != btype) return false;
    // Basic equality test (watch out for coercions).
    if (a == b) return true;
    // One is falsy and the other truthy.
    if ((!a && b) || (a && !b)) return false;
    // Unwrap any wrapped objects.
    if (a._chain) a = a._wrapped;
    if (b._chain) b = b._wrapped;
    // One of them implements an isEqual()?
    if (a.isEqual) return a.isEqual(b);
    // Check dates' integer values.
    if (_.isDate(a) && _.isDate(b)) return a.getTime() === b.getTime();
    // Both are NaN?
    if (_.isNaN(a) && _.isNaN(b)) return false;
    // Compare regular expressions.
    if (_.isRegExp(a) && _.isRegExp(b))
      return a.source     === b.source &&
             a.global     === b.global &&
             a.ignoreCase === b.ignoreCase &&
             a.multiline  === b.multiline;
    // If a is not an object by this point, we can't handle it.
    if (atype !== 'object') return false;
    // Check for different array lengths before comparing contents.
    if (a.length && (a.length !== b.length)) return false;
    // Nothing else worked, deep compare the contents.
    var aKeys = _.keys(a), bKeys = _.keys(b);
    // Different object sizes?
    if (aKeys.length != bKeys.length) return false;
    // Recursive comparison of contents.
    for (var key in a) if (!(key in b) || !_.isEqual(a[key], b[key])) return false;
    return true;
  };

  // Is a given array or object empty?
  _.isEmpty = function(obj) {
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (hasOwnProperty.call(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType == 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an arguments object?
  _.isArguments = function(obj) {
    return !!(obj && hasOwnProperty.call(obj, 'callee'));
  };

  // Is a given value a function?
  _.isFunction = function(obj) {
    return !!(obj && obj.constructor && obj.call && obj.apply);
  };

  // Is a given value a string?
  _.isString = function(obj) {
    return !!(obj === '' || (obj && obj.charCodeAt && obj.substr));
  };

  // Is a given value a number?
  _.isNumber = function(obj) {
    return !!(obj === 0 || (obj && obj.toExponential && obj.toFixed));
  };

  // Is the given value `NaN`? `NaN` happens to be the only value in JavaScript
  // that does not equal itself.
  _.isNaN = function(obj) {
    return obj !== obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false;
  };

  // Is a given value a date?
  _.isDate = function(obj) {
    return !!(obj && obj.getTimezoneOffset && obj.setUTCFullYear);
  };

  // Is the given value a regular expression?
  _.isRegExp = function(obj) {
    return !!(obj && obj.test && obj.exec && (obj.ignoreCase || obj.ignoreCase === false));
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function (n, iterator, context) {
    for (var i = 0; i < n; i++) iterator.call(context, i);
  };

  // Add your own custom functions to the Underscore object, ensuring that
  // they're correctly added to the OOP wrapper as well.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
      addToWrapper(name, _[name] = obj[name]);
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = idCounter++;
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(str, data) {
    var c  = _.templateSettings;
    var tmpl = 'var __p=[],print=function(){__p.push.apply(__p,arguments);};' +
      'with(obj||{}){__p.push(\'' +
      str.replace(/\\/g, '\\\\')
         .replace(/'/g, "\\'")
         .replace(c.interpolate, function(match, code) {
           return "'," + code.replace(/\\'/g, "'") + ",'";
         })
         .replace(c.evaluate || null, function(match, code) {
           return "');" + code.replace(/\\'/g, "'")
                              .replace(/[\r\n\t]/g, ' ') + "__p.push('";
         })
         .replace(/\r/g, '\\r')
         .replace(/\n/g, '\\n')
         .replace(/\t/g, '\\t')
         + "');}return __p.join('');";
    var func = new Function('obj', tmpl);
    return data ? func(data) : func;
  };

  // The OOP Wrapper
  // ---------------

  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.
  var wrapper = function(obj) { this._wrapped = obj; };

  // Expose `wrapper.prototype` as `_.prototype`
  _.prototype = wrapper.prototype;

  // Helper function to continue chaining intermediate results.
  var result = function(obj, chain) {
    return chain ? _(obj).chain() : obj;
  };

  // A method to easily add functions to the OOP wrapper.
  var addToWrapper = function(name, func) {
    wrapper.prototype[name] = function() {
      var args = slice.call(arguments);
      unshift.call(args, this._wrapped);
      return result(func.apply(_, args), this._chain);
    };
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    wrapper.prototype[name] = function() {
      method.apply(this._wrapped, arguments);
      return result(this._wrapped, this._chain);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    wrapper.prototype[name] = function() {
      return result(method.apply(this._wrapped, arguments), this._chain);
    };
  });

  // Start chaining a wrapped Underscore object.
  wrapper.prototype.chain = function() {
    this._chain = true;
    return this;
  };

  // Extracts the result from a wrapped and chained object.
  wrapper.prototype.value = function() {
    return this._wrapped;
  };

})();
 $.ender(module.exports); }.call($);
/*!
  * bean.js - copyright Jacob Thornton 2011
  * https://github.com/fat/bean
  * MIT License
  * special thanks to:
  * dean edwards: http://dean.edwards.name/
  * dperini: https://github.com/dperini/nwevents
  * the entire mootools team: github.com/mootools/mootools-core
  */
!function (context) {
  var __uid = 1, registry = {}, collected = {},
      overOut = /over|out/,
      namespace = /[^\.]*(?=\..*)\.|.*/,
      stripName = /\..*/,
      addEvent = 'addEventListener',
      attachEvent = 'attachEvent',
      removeEvent = 'removeEventListener',
      detachEvent = 'detachEvent',
      doc = context.document || {},
      root = doc.documentElement || {},
      W3C_MODEL = root[addEvent],
      eventSupport = W3C_MODEL ? addEvent : attachEvent,

  isDescendant = function (parent, child) {
    var node = child.parentNode;
    while (node != null) {
      if (node == parent) {
        return true;
      }
      node = node.parentNode;
    }
  },

  retrieveUid = function (obj, uid) {
    return (obj.__uid = uid || obj.__uid || __uid++);
  },

  retrieveEvents = function (element) {
    var uid = retrieveUid(element);
    return (registry[uid] = registry[uid] || {});
  },

  listener = W3C_MODEL ? function (element, type, fn, add) {
    element[add ? addEvent : removeEvent](type, fn, false);
  } : function (element, type, fn, add, custom) {
    custom && add && (element['_on' + custom] = element['_on' + custom] || 0);
    element[add ? attachEvent : detachEvent]('on' + type, fn);
  },

  nativeHandler = function (element, fn, args) {
    return function (event) {
      event = fixEvent(event || ((this.ownerDocument || this.document || this).parentWindow || context).event);
      return fn.apply(element, [event].concat(args));
    };
  },

  customHandler = function (element, fn, type, condition, args) {
    return function (event) {
      if (condition ? condition.call(this, event) : W3C_MODEL ? true : event && event.propertyName == '_on' + type || !event) {
        fn.apply(element, [event].concat(args));
      }
    };
  },

  addListener = function (element, orgType, fn, args) {
    var type = orgType.replace(stripName, ''),
        events = retrieveEvents(element),
        handlers = events[type] || (events[type] = {}),
        uid = retrieveUid(fn, orgType.replace(namespace, ''));
    if (handlers[uid]) {
      return element;
    }
    var custom = customEvents[type];
    if (custom) {
      fn = custom.condition ? customHandler(element, fn, type, custom.condition) : fn;
      type = custom.base || type;
    }
    var isNative = nativeEvents[type];
    fn = isNative ? nativeHandler(element, fn, args) : customHandler(element, fn, type, false, args);
    isNative = W3C_MODEL || isNative;
    if (type == 'unload') {
      var org = fn;
      fn = function () {
        removeListener(element, type, fn) && org();
      };
    }
    element[eventSupport] && listener(element, isNative ? type : 'propertychange', fn, true, !isNative && type);
    handlers[uid] = fn;
    fn.__uid = uid;
    return type == 'unload' ? element : (collected[retrieveUid(element)] = element);
  },

  removeListener = function (element, orgType, handler) {
    var uid, names, uids, i, events = retrieveEvents(element), type = orgType.replace(stripName, '');
    if (!events || !events[type]) {
      return element;
    }
    names = orgType.replace(namespace, '');
    uids = names ? names.split('.') : [handler.__uid];
    for (i = uids.length; i--;) {
      uid = uids[i];
      handler = events[type][uid];
      delete events[type][uid];
      if (element[eventSupport]) {
        type = customEvents[type] ? customEvents[type].base : type;
        var isNative = W3C_MODEL || nativeEvents[type];
        listener(element, isNative ? type : 'propertychange', handler, false, !isNative && type);
      }
    }
    return element;
  },

  del = function (selector, fn, $) {
    return function (e) {
      var array = typeof selector == 'string' ? $(selector, this) : selector;
      for (var target = e.target; target && target != this; target = target.parentNode) {
        for (var i = array.length; i--;) {
          if (array[i] == target) {
            return fn.apply(target, arguments);
          }
        }
      }
    };
  },

  add = function (element, events, fn, delfn, $) {
    if (typeof events == 'object' && !fn) {
      for (var type in events) {
        events.hasOwnProperty(type) && add(element, type, events[type]);
      }
    } else {
      var isDel = typeof fn == 'string', types = (isDel ? fn : events).split(' ');
      fn = isDel ? del(events, delfn, $) : fn;
      for (var i = types.length; i--;) {
        addListener(element, types[i], fn, Array.prototype.slice.call(arguments, isDel ? 4 : 3));
      }
    }
    return element;
  },

  remove = function (element, orgEvents, fn) {
    var k, type, events,
        isString = typeof(orgEvents) == 'string',
        names = isString && orgEvents.replace(namespace, ''),
        rm = removeListener,
        attached = retrieveEvents(element);
    if (isString && /\s/.test(orgEvents)) {
      orgEvents = orgEvents.split(' ');
      var i = orgEvents.length - 1;
      while (remove(element, orgEvents[i]) && i--) {}
      return element;
    }
    events = isString ? orgEvents.replace(stripName, '') : orgEvents;
    if (!attached || (isString && !attached[events])) {
      return element;
    }
    if (typeof fn == 'function') {
      rm(element, events, fn);
    } else if (names) {
      rm(element, orgEvents);
    } else {
      rm = events ? rm : remove;
      type = isString && events;
      events = events ? (fn || attached[events] || events) : attached;
      for (k in events) {
        events.hasOwnProperty(k) && rm(element, type || k, events[k]);
      }
    }
    return element;
  },

  fire = function (element, type, args) {
    var evt, k, i, types = type.split(' ');
    for (i = types.length; i--;) {
      type = types[i].replace(stripName, '');
      var isNative = nativeEvents[type],
          isNamespace = types[i].replace(namespace, ''),
          handlers = retrieveEvents(element)[type];
      if (isNamespace) {
        isNamespace = isNamespace.split('.');
        for (k = isNamespace.length; k--;) {
          handlers[isNamespace[k]] && handlers[isNamespace[k]].apply(element, args);
        }
      } else if (!args && element[eventSupport]) {
        fireListener(isNative, type, element);
      } else {
        for (k in handlers) {
          handlers.hasOwnProperty(k) && handlers[k].apply(element, args);
        }
      }
    }
    return element;
  },

  fireListener = W3C_MODEL ? function (isNative, type, element) {
    evt = document.createEvent(isNative ? "HTMLEvents" : "UIEvents");
    evt[isNative ? 'initEvent' : 'initUIEvent'](type, true, true, context, 1);
    element.dispatchEvent(evt);
  } : function (isNative, type, element) {
    isNative ? element.fireEvent('on' + type, document.createEventObject()) : element['_on' + type]++;
  },

  clone = function (element, from, type) {
    var events = retrieveEvents(from), obj, k;
    obj = type ? events[type] : events;
    for (k in obj) {
      obj.hasOwnProperty(k) && (type ? add : clone)(element, type || from, type ? obj[k] : k);
    }
    return element;
  },

  fixEvent = function (e) {
    var result = {};
    if (!e) {
      return result;
    }
    var type = e.type, target = e.target || e.srcElement;
    result.preventDefault = fixEvent.preventDefault(e);
    result.stopPropagation = fixEvent.stopPropagation(e);
    result.target = target && target.nodeType == 3 ? target.parentNode : target;
    if (~type.indexOf('key')) {
      result.keyCode = e.which || e.keyCode;
    } else if ((/click|mouse|menu/i).test(type)) {
      result.rightClick = e.which == 3 || e.button == 2;
      result.pos = { x: 0, y: 0 };
      if (e.pageX || e.pageY) {
        result.clientX = e.pageX;
        result.clientY = e.pageY;
      } else if (e.clientX || e.clientY) {
        result.clientX = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        result.clientY = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
      }
      overOut.test(type) && (result.relatedTarget = e.relatedTarget || e[(type == 'mouseover' ? 'from' : 'to') + 'Element']);
    }
    for (var k in e) {
      if (!(k in result)) {
        result[k] = e[k];
      }
    }
    return result;
  };

  fixEvent.preventDefault = function (e) {
    return function () {
      if (e.preventDefault) {
        e.preventDefault();
      }
      else {
        e.returnValue = false;
      }
    };
  };

  fixEvent.stopPropagation = function (e) {
    return function () {
      if (e.stopPropagation) {
        e.stopPropagation();
      } else {
        e.cancelBubble = true;
      }
    };
  };

  var nativeEvents = { click: 1, dblclick: 1, mouseup: 1, mousedown: 1, contextmenu: 1, //mouse buttons
    mousewheel: 1, DOMMouseScroll: 1, //mouse wheel
    mouseover: 1, mouseout: 1, mousemove: 1, selectstart: 1, selectend: 1, //mouse movement
    keydown: 1, keypress: 1, keyup: 1, //keyboard
    orientationchange: 1, // mobile
    touchstart: 1, touchmove: 1, touchend: 1, touchcancel: 1, // touch
    gesturestart: 1, gesturechange: 1, gestureend: 1, // gesture
    focus: 1, blur: 1, change: 1, reset: 1, select: 1, submit: 1, //form elements
    load: 1, unload: 1, beforeunload: 1, resize: 1, move: 1, DOMContentLoaded: 1, readystatechange: 1, //window
    error: 1, abort: 1, scroll: 1 }; //misc

  function check(event) {
    var related = event.relatedTarget;
    if (!related) {
      return related == null;
    }
    return (related != this && related.prefix != 'xul' && !/document/.test(this.toString()) && !isDescendant(this, related));
  }

  var customEvents = {
    mouseenter: { base: 'mouseover', condition: check },
    mouseleave: { base: 'mouseout', condition: check },
    mousewheel: { base: /Firefox/.test(navigator.userAgent) ? 'DOMMouseScroll' : 'mousewheel' }
  };

  var bean = { add: add, remove: remove, clone: clone, fire: fire };

  var clean = function (el) {
    var uid = remove(el).__uid;
    if (uid) {
      delete collected[uid];
      delete registry[uid];
    }
  };

  if (context[attachEvent]) {
    add(context, 'unload', function () {
      for (var k in collected) {
        collected.hasOwnProperty(k) && clean(collected[k]);
      }
      context.CollectGarbage && CollectGarbage();
    });
  }

  var oldBean = context.bean;
  bean.noConflict = function () {
    context.bean = oldBean;
    return this;
  };

  (typeof module !== 'undefined' && module.exports) ?
    (module.exports = bean) :
    (context['bean'] = bean);

}(this);!function ($) {
  var b = bean.noConflict(),
      integrate = function (method, type, method2) {
        var _args = type ? [type] : [];
        return function () {
          for (var args, i = 0, l = this.length; i < l; i++) {
            args = [this[i]].concat(_args, Array.prototype.slice.call(arguments, 0));
            args.length == 4 && args.push($);
            !arguments.length && method == 'add' && type && (method = 'fire');
            b[method].apply(this, args);
          }
          return this;
        };
      };

  var add = integrate('add'),
      remove = integrate('remove'),
      fire = integrate('fire');

  var methods = {

    on: add,
    addListener: add,
    bind: add,
    listen: add,
    delegate: add,

    unbind: remove,
    unlisten: remove,
    removeListener: remove,
    undelegate: remove,

    emit: fire,
    trigger: fire,

    cloneEvents: integrate('clone'),

    hover: function (enter, leave) {
      for (var i = 0, l = this.length; i < l; i++) {
        b.add.call(this, this[i], 'mouseenter', enter);
        b.add.call(this, this[i], 'mouseleave', leave);
      }
      return this;
    }
  };

  var shortcuts = [
    'blur', 'change', 'click', 'dblclick', 'error', 'focus', 'focusin',
    'focusout', 'keydown', 'keypress', 'keyup', 'load', 'mousedown',
    'mouseenter', 'mouseleave', 'mouseout', 'mouseover', 'mouseup',
    'resize', 'scroll', 'select', 'submit', 'unload'
  ];

  for (var i = shortcuts.length; i--;) {
    var shortcut = shortcuts[i];
    methods[shortcut] = integrate('add', shortcut);
  }

  $.ender(methods, true);
}(ender);
/*!
  * bonzo.js - copyright @dedfat 2011
  * https://github.com/ded/bonzo
  * Follow our software http://twitter.com/dedfat
  * MIT License
  */
!function (context) {

  var doc = context.document,
      html = doc.documentElement,
      query = null,
      byTag = 'getElementsByTagName',
      specialAttributes = /^checked|value|selected$/,
      specialTags = /select|map|fieldset|table|tbody|tr|colgroup/i,
      tagMap = { select: 'option', table: 'tbody', tr: 'td' },
      stateAttributes = /^checked|selected$/,
      ie = /msie/i.test(navigator.userAgent),
      uidList = [],
      uuids = 0,
      digit = /^-?[\d\.]+$/,
      px = 'px',
      // commonly used methods
      setAttribute = 'setAttribute',
      getAttribute = 'getAttribute',
      trimReplace = /(^\s*|\s*$)/g,
      unitless = { lineHeight: 1, zoom: 1, zIndex: 1, opacity: 1 };

  function classReg(c) {
    return new RegExp("(^|\\s+)" + c + "(\\s+|$)");
  }

  function each(ar, fn, scope) {
    for (var i = 0, l = ar.length; i < l; i++) {
      fn.call(scope || ar[i], ar[i], i, ar);
    }
    return ar;
  }

  var trim = String.prototype.trim ?
    function (s) {
      return s.trim();
    } :
    function (s) {
      return s.replace(trimReplace, '');
    };

  function camelize(s) {
    return s.replace(/-(.)/g, function (m, m1) {
      return m1.toUpperCase();
    });
  }

  function is(node) {
    return node && node.nodeName && node.nodeType == 1;
  }

  function some(ar, fn, scope) {
    for (var i = 0, j = ar.length; i < j; ++i) {
      if (fn.call(scope, ar[i], i, ar)) {
        return true;
      }
    }
    return false;
  }

  var getStyle = doc.defaultView && doc.defaultView.getComputedStyle ?
    function (el, property) {
      var value = null;
      if (property == 'float') {
        property = 'cssFloat';
      }
      var computed = doc.defaultView.getComputedStyle(el, '');
      computed && (value = computed[camelize(property)]);
      return el.style[property] || value;

    } : (ie && html.currentStyle) ?

    function (el, property) {
      property = camelize(property);
      property = property == 'float' ? 'styleFloat' : property;

      if (property == 'opacity') {
        var val = 100;
        try {
          val = el.filters['DXImageTransform.Microsoft.Alpha'].opacity;
        } catch (e1) {
          try {
            val = el.filters('alpha').opacity;
          } catch (e2) {}
        }
        return val / 100;
      }
      var value = el.currentStyle ? el.currentStyle[property] : null;
      return el.style[property] || value;
    } :

    function (el, property) {
      return el.style[camelize(property)];
    };

  function insert(target, host, fn) {
    var i = 0, self = host || this, r = [];
    each(normalize(query ? query(target) : target), function (t) {
      each(self, function (el) {
        var n = el.cloneNode(true);
        fn(t, n);
        r[i] = n;
        i++;
      });
    }, this);
    each(r, function (e, i) {
      self[i] = e;
    });
    self.length = i;
    return self;
  }

  function xy(el, x, y) {
    var $el = bonzo(el),
        style = $el.css('position'),
        offset = $el.offset(),
        rel = 'relative',
        isRel = style == rel,
        delta = [parseInt($el.css('left'), 10), parseInt($el.css('top'), 10)];

    if (style == 'static') {
      $el.css('position', rel);
      style = rel;
    }

    isNaN(delta[0]) && (delta[0] = isRel ? 0 : el.offsetLeft);
    isNaN(delta[1]) && (delta[1] = isRel ? 0 : el.offsetTop);

    x !== null && (el.style.left = x - offset.left + delta[0] + 'px');
    y !== null && (el.style.top = y - offset.top + delta[1] + 'px');

  }

  function Bonzo(elements) {
    this.length = 0;
    this.original = elements;
    if (elements) {
      elements = typeof elements !== 'string' &&
        !elements.nodeType &&
        typeof elements.length !== 'undefined' ?
          elements :
          [elements];
      this.length = elements.length;
      for (var i = 0; i < elements.length; i++) {
        this[i] = elements[i];
      }
    }
  }

  Bonzo.prototype = {

    each: function (fn, scope) {
      return each(this, fn, scope);
    },

    map: function (fn, reject) {
      var m = [], n, i;
      for (i = 0; i < this.length; i++) {
        n = fn.call(this, this[i]);
        reject ? (reject(n) && m.push(n)) : m.push(n);
      }
      return m;
    },

    first: function () {
      return bonzo(this[0]);
    },

    last: function () {
      return bonzo(this[this.length - 1]);
    },

    html: function (h, text) {
      var method = text ?
        html.textContent == null ?
          'innerText' :
          'textContent' :
        'innerHTML', m;
      function append(el, tag) {
        while (el.firstChild) {
          el.removeChild(el.firstChild);
        }
        each(normalize(h, tag), function (node) {
          el.appendChild(node);
        });
      }
      return typeof h !== 'undefined' ?
          this.each(function (el) {
            (m = el.tagName.match(specialTags)) ?
              append(el, m[0]) :
              (el[method] = h);
          }) :
        this[0] ? this[0][method] : '';
    },

    text: function (text) {
      return this.html(text, 1);
    },

    addClass: function (c) {
      return this.each(function (el) {
        this.hasClass(el, c) || (el.className = trim(el.className + ' ' + c));
      }, this);
    },

    removeClass: function (c) {
      return this.each(function (el) {
        this.hasClass(el, c) && (el.className = trim(el.className.replace(classReg(c), ' ')));
      }, this);
    },

    hasClass: function (el, c) {
      return typeof c == 'undefined' ?
        some(this, function (i) {
          return classReg(el).test(i.className);
        }) :
        classReg(c).test(el.className);
    },

    toggleClass: function (c, condition) {
      if (typeof condition !== 'undefined' && !condition) {
        return this;
      }
      return this.each(function (el) {
        this.hasClass(el, c) ?
          (el.className = trim(el.className.replace(classReg(c), ' '))) :
          (el.className = trim(el.className + ' ' + c));
      }, this);
    },

    show: function (type) {
      return this.each(function (el) {
        el.style.display = type || '';
      });
    },

    hide: function (elements) {
      return this.each(function (el) {
        el.style.display = 'none';
      });
    },

    append: function (node) {
      return this.each(function (el) {
        each(normalize(node), function (i) {
          el.appendChild(i);
        });
      });
    },

    prepend: function (node) {
      return this.each(function (el) {
        var first = el.firstChild;
        each(normalize(node), function (i) {
          el.insertBefore(i, first);
        });
      });
    },

    appendTo: function (target, host) {
      return insert.call(this, target, host, function (t, el) {
        t.appendChild(el);
      });
    },

    prependTo: function (target, host) {
      return insert.call(this, target, host, function (t, el) {
        t.insertBefore(el, t.firstChild);
      });
    },

    next: function () {
      return this.related('nextSibling');
    },

    previous: function () {
      return this.related('previousSibling');
    },

    related: function (method) {
      return this.map(
        function (el) {
          el = el[method];
          while (el && el.nodeType !== 1) {
            el = el[method];
          }
          return el || 0;
        },
        function (el) {
          return el;
        }
      );
    },

    before: function (node) {
      return this.each(function (el) {
        each(bonzo.create(node), function (i) {
          el.parentNode.insertBefore(i, el);
        });
      });
    },

    after: function (node) {
      return this.each(function (el) {
        each(bonzo.create(node), function (i) {
          el.parentNode.insertBefore(i, el.nextSibling);
        });
      });
    },

    insertBefore: function (target, host) {
      return insert.call(this, target, host, function (t, el) {
        t.parentNode.insertBefore(el, t);
      });
    },

    insertAfter: function (target, host) {
      return insert.call(this, target, host, function (t, el) {
        var sibling = t.nextSibling;
        if (sibling) {
          t.parentNode.insertBefore(el, sibling);
        }
        else {
          t.parentNode.appendChild(el);
        }
      });
    },

    css: function (o, v) {
      // is this a request for just getting a style?
      if (v === undefined && typeof o == 'string') {
        return getStyle(this[0], o);
      }
      var iter = o;
      if (typeof o == 'string') {
        iter = {};
        iter[o] = v;
      }

      if (ie && iter.opacity) {
        // oh this 'ol gamut
        iter.filter = 'alpha(opacity=' + (iter.opacity * 100) + ')';
        // give it layout
        iter.zoom = o.zoom || 1;
        delete iter.opacity;
      }

      if (v = iter['float']) {
        // float is a reserved style word. w3 uses cssFloat, ie uses styleFloat
        ie ? (iter.styleFloat = v) : (iter.cssFloat = v);
        delete iter['float'];
      }

      var fn = function (el, p, v) {
        for (var k in iter) {
          if (iter.hasOwnProperty(k)) {
            v = iter[k];
            // change "5" to "5px" - unless you're line-height, which is allowed
            (p = camelize(k)) && digit.test(v) && !(p in unitless) && (v += px);
            el.style[p] = v;
          }
        }
      };
      return this.each(fn);
    },

    offset: function (x, y) {
      if (x || y) {
        return this.each(function (el) {
          xy(el, x, y);
        });
      }
      var el = this[0];
      var width = el.offsetWidth;
      var height = el.offsetHeight;
      var top = el.offsetTop;
      var left = el.offsetLeft;
      while (el = el.offsetParent) {
        top = top + el.offsetTop;
        left = left + el.offsetLeft;
      }

      return {
        top: top,
        left: left,
        height: height,
        width: width
      };
    },

    attr: function (k, v) {
      var el = this[0];
      return typeof v == 'undefined' ?
        specialAttributes.test(k) ?
          stateAttributes.test(k) && typeof el[k] == 'string' ?
            true : el[k] : el[getAttribute](k) :
        this.each(function (el) {
          k == 'value' ? (el.value = v) : el[setAttribute](k, v);
        });
    },

    val: function (s) {
      return (typeof s == 'string') ? this.attr('value', s) : this[0].value;
    },

    removeAttr: function (k) {
      return this.each(function (el) {
        el.removeAttribute(k);
      });
    },

    data: function (k, v) {
      var el = this[0];
      if (typeof v === 'undefined') {
        el[getAttribute]('data-node-uid') || el[setAttribute]('data-node-uid', ++uuids);
        var uid = el[getAttribute]('data-node-uid');
        uidList[uid] || (uidList[uid] = {});
        return uidList[uid][k];
      } else {
        return this.each(function (el) {
          el[getAttribute]('data-node-uid') || el[setAttribute]('data-node-uid', ++uuids);
          var uid = el[getAttribute]('data-node-uid');
          var o = {};
          o[k] = v;
          uidList[uid] = o;
        });
      }
    },

    remove: function () {
      return this.each(function (el) {
        el.parentNode && el.parentNode.removeChild(el);
      });
    },

    empty: function () {
      return this.each(function (el) {
        while (el.firstChild) {
          el.removeChild(el.firstChild);
        }
      });
    },

    detach: function () {
      return this.map(function (el) {
        return el.parentNode.removeChild(el);
      });
    },

    scrollTop: function (y) {
      return scroll.call(this, null, y, 'y');
    },

    scrollLeft: function (x) {
      return scroll.call(this, x, null, 'x');
    }
  };

  function normalize(node, tag) {
    return typeof node == 'string' ? bonzo.create(node, tag) : is(node) ? [node] : node;
  }

  function scroll(x, y, type) {
    var el = this[0];
    if (x == null && y == null) {
      return (isBody(el) ? getWindowScroll() : { x: el.scrollLeft, y: el.scrollTop })[type];
    }
    if (isBody(el)) {
      window.scrollTo(x, y);
    } else {
      x != null && (el.scrollLeft = x);
      y != null && (el.scrollTop = y);
    }
    return this;
  }

  function isBody(element) {
    return element === window || (/^(?:body|html)$/i).test(element.tagName);
  }

  function getWindowScroll() {
    return { x: window.pageXOffset || html.scrollLeft, y: window.pageYOffset || html.scrollTop };
  }

  function bonzo(els, host) {
    return new Bonzo(els, host);
  }

  bonzo.setQueryEngine = function (q) {
    query = q;
    delete bonzo.setQueryEngine;
  };

  bonzo.aug = function (o, target) {
    for (var k in o) {
      o.hasOwnProperty(k) && ((target || Bonzo.prototype)[k] = o[k]);
    }
  };

  bonzo.create = function (node, tag) {
    return typeof node == 'string' ?
      function () {
        var t = tag ? tagMap[tag.toLowerCase()] : null;
        var el = doc.createElement(t || 'div'), els = [];
        if (tag) {
          var bitches = node.match(new RegExp("<" + t + ">.+?<\\/" + t + ">", "g"));
          each(bitches, function (m) {
            m = m.replace(/<(.+)>(.+?)<\/\1>/, '$2');
            var bah = doc.createElement(t);
            bah.appendChild(doc.createDocumentFragment(m));
            el.appendChild(bah);
          });
        } else {
          el.innerHTML = node;
        }
        var nodes = el.childNodes;
        el = el.firstChild;
        els.push(el);
        while (el = el.nextSibling) {
          (el.nodeType == 1) && els.push(el);
        }
        return els;

      }() : is(node) ? [node.cloneNode(true)] : [];
  };

  bonzo.doc = function () {
    var w = html.scrollWidth,
        h = html.scrollHeight,
        vp = this.viewport();
    return {
      width: Math.max(w, vp.width),
      height: Math.max(h, vp.height)
    };
  };

  bonzo.firstChild = function (el) {
    for (var c = el.childNodes, i = 0, j = (c && c.length) || 0, e; i < j; i++) {
      if (c[i].nodeType === 1) {
        e = c[j = i];
      }
    }
    return e;
  };

  bonzo.viewport = function () {
    var h = self.innerHeight,
        w = self.innerWidth;
    ie && (h = html.clientHeight) && (w = html.clientWidth);
    return {
      width: w,
      height: h
    };
  };

  bonzo.isAncestor = 'compareDocumentPosition' in html ?
    function (container, element) {
      return (container.compareDocumentPosition(element) & 16) == 16;
    } : 'contains' in html ?
    function (container, element) {
      return container !== element && container.contains(element);
    } :
    function (container, element) {
      while (element = element.parentNode) {
        if (element === container) {
          return true;
        }
      }
      return false;
    };

  var old = context.bonzo;
  bonzo.noConflict = function () {
    context.bonzo = old;
    return this;
  };
  context['bonzo'] = bonzo;

}(this);!function ($) {

  var b = bonzo;
  b.setQueryEngine($);
  $.ender(b);
  $.ender(b(), true);
  $.ender({
    create: function (node) {
      return $(b.create(node));
    }
  });

  $.id = function (id) {
    return $([document.getElementById(id)]);
  };

  function indexOf(ar, val) {
    for (var i = 0; i < ar.length; i++) {
      if (ar[i] === val) {
        return i;
      }
    }
    return -1;
  }

  function uniq(ar) {
    var a = [], i, j;
    label:
    for (i = 0; i < ar.length; i++) {
      for (j = 0; j < a.length; j++) {
        if (a[j] == ar[i]) {
          continue label;
        }
      }
      a[a.length] = ar[i];
    }
    return a;
  }

  $.ender({
    parents: function (selector, closest) {
      var collection = $(selector), j, k, p, r = [];
      for (j = 0, k = this.length; j < k; j++) {
        p = this[j];
        while (p = p.parentNode) {
          if (indexOf(collection, p) !== -1) {
            r.push(p);
            if (closest) break;
          }
        }
      }
      return $(uniq(r));
    },

    closest: function (selector) {
      return this.parents(selector, true);
    },

    first: function () {
      return $(this[0]);
    },

    last: function () {
      return $(this[this.length - 1]);
    },

    next: function () {
      return $(b(this).next());
    },

    previous: function () {
      return $(b(this).previous());
    },

    appendTo: function (t) {
      return b(this.selector).appendTo(t, this);
    },

    prependTo: function (t) {
      return b(this.selector).prependTo(t, this);
    },

    insertAfter: function (t) {
      return b(this.selector).insertAfter(t, this);
    },

    insertBefore: function (t) {
      return b(this.selector).insertBefore(t, this);
    },

    siblings: function () {
      var i, l, p, r = [];
      for (i = 0, l = this.length; i < l; i++) {
        p = this[i];
        while (p = p.previousSibling) {
          p.nodeType == 1 && r.push(p);
        }
        p = this[i];
        while (p = p.nextSibling) {
          p.nodeType == 1 && r.push(p);
        }
      }
      return $(r);
    },

    children: function () {
      var el, r = [];
      for (i = 0, l = this.length; i < l; i++) {
        if (!(el = b.firstChild(this[i]))) {
          continue;
        }
        r.push(el);
        while (el = el.nextSibling) {
          el.nodeType == 1 && r.push(el);
        }
      }
      return $(uniq(r));
    },

    height: function (v) {
      return v ? this.css('height', v) : parseInt(this.css('height'), 10);
    },

    width: function (v) {
      return v ? this.css('width', v) : parseInt(this.css('width'), 10);
    }
  }, true);

}(ender || $);

!function () { var exports = {}, module = { exports: exports }; !function (doc) {
  var loaded = 0, fns = [], ol, f = false,
      testEl = doc.createElement('a'),
      domContentLoaded = 'DOMContentLoaded',
      addEventListener = 'addEventListener',
      onreadystatechange = 'onreadystatechange';

  /^loade|c/.test(doc.readyState) && (loaded = 1);

  function flush() {
    loaded = 1;
    for (var i = 0, l = fns.length; i < l; i++) {
      fns[i]();
    }
  }
  doc[addEventListener] && doc[addEventListener](domContentLoaded, function fn() {
    doc.removeEventListener(domContentLoaded, fn, f);
    flush();
  }, f);


  testEl.doScroll && doc.attachEvent(onreadystatechange, (ol = function ol() {
    if (/^c/.test(doc.readyState)) {
      doc.detachEvent(onreadystatechange, ol);
      flush();
    }
  }));

  var domReady = testEl.doScroll ?
    function (fn) {
      self != top ?
        !loaded ?
          fns.push(fn) :
          fn() :
        !function () {
          try {
            testEl.doScroll('left');
          } catch (e) {
            return setTimeout(function() {
              domReady(fn);
            }, 50);
          }
          fn();
        }();
    } :
    function (fn) {
      loaded ? fn() : fns.push(fn);
    };

    (typeof module !== 'undefined') && module.exports ?
      (module.exports = {domReady: domReady}) :
      (window.domReady = domReady);

}(document); $.ender(module.exports); }.call($);
/*!
  * qwery.js - copyright @dedfat
  * https://github.com/ded/qwery
  * Follow our software http://twitter.com/dedfat
  * MIT License
  */

!function (context, doc) {

  var c, i, j, k, l, m, o, p, r, v,
      el, node, len, found, classes, item, items, token,
      id = /#([\w\-]+)/,
      clas = /\.[\w\-]+/g,
      idOnly = /^#([\w\-]+$)/,
      classOnly = /^\.([\w\-]+)$/,
      tagOnly = /^([\w\-]+)$/,
      tagAndOrClass = /^([\w]+)?\.([\w\-]+)$/,
      html = doc.documentElement,
      tokenizr = /\s(?![\s\w\-\/\?\&\=\:\.\(\)\!,@#%<>\{\}\$\*\^'"]*\])/,
      specialChars = /([.*+?\^=!:${}()|\[\]\/\\])/g,
      simple = /^([a-z0-9]+)?(?:([\.\#]+[\w\-\.#]+)?)/,
      attr = /\[([\w\-]+)(?:([\|\^\$\*\~]?\=)['"]?([ \w\-\/\?\&\=\:\.\(\)\!,@#%<>\{\}\$\*\^]+)["']?)?\]/,
      chunker = new RegExp(simple.source + '(' + attr.source + ')?');

  function array(ar) {
    r = [];
    for (i = 0, len = ar.length; i < len; i++) {
      r[i] = ar[i];
    }
    return r;
  }

  var cache = function () {
    this.c = {};
  };
  cache.prototype = {
    g: function (k) {
      return this.c[k] || undefined;
    },
    s: function (k, v) {
      this.c[k] = v;
      return v;
    }
  };

  var classCache = new cache(),
      cleanCache = new cache(),
      attrCache = new cache(),
      tokenCache = new cache();

  function q(query) {
    return query.match(chunker);
  }

  function interpret(whole, tag, idsAndClasses, wholeAttribute, attribute, qualifier, value) {
    var m, c, k;
    if (tag && this.tagName.toLowerCase() !== tag) {
      return false;
    }
    if (idsAndClasses && (m = idsAndClasses.match(id)) && m[1] !== this.id) {
      return false;
    }
    if (idsAndClasses && (classes = idsAndClasses.match(clas))) {
      for (i = classes.length; i--;) {
        c = classes[i].slice(1);
        if (!(classCache.g(c) || classCache.s(c, new RegExp('(^|\\s+)' + c + '(\\s+|$)'))).test(this.className)) {
          return false;
        }
      }
    }
    if (wholeAttribute && !value) {
      o = this.attributes;
      for (k in o) {
        if (Object.prototype.hasOwnProperty.call(o, k) && (o[k].name || k) == attribute) {
          return this;
        }
      }
    }
    if (wholeAttribute && !checkAttr(qualifier, this.getAttribute(attribute) || '', value)) {
      return false;
    }
    return this;
  }

  function loopAll(tokens) {
    var r = [], token = tokens.pop(), intr = q(token), tag = intr[1] || '*', i, l, els,
        root = tokens.length && (m = tokens[0].match(idOnly)) ? doc.getElementById(m[1]) : doc;
    if (!root) {
      return r;
    }
    els = root.getElementsByTagName(tag);
    for (i = 0, l = els.length; i < l; i++) {
      el = els[i];
      if (item = interpret.apply(el, intr)) {
        r.push(item);
      }
    }
    return r;
  }

  function clean(s) {
    return cleanCache.g(s) || cleanCache.s(s, s.replace(specialChars, '\\$1'));
  }

  function checkAttr(qualify, actual, val) {
    switch (qualify) {
    case '=':
      return actual == val;
    case '^=':
      return actual.match(attrCache.g('^=' + val) || attrCache.s('^=' + val, new RegExp('^' + clean(val))));
    case '$=':
      return actual.match(attrCache.g('$=' + val) || attrCache.s('$=' + val, new RegExp(clean(val) + '$')));
    case '*=':
      return actual.match(attrCache.g(val) || attrCache.s(val, new RegExp(clean(val))));
    case '~=':
      return actual.match(attrCache.g('~=' + val) || attrCache.s('~=' + val, new RegExp('(?:^|\\s+)' + clean(val) + '(?:\\s+|$)')));
    case '|=':
      return actual.match(attrCache.g('|=' + val) || attrCache.s('|=' + val, new RegExp('^' + clean(val) + '(-|$)')));
    }
    return false;
  }

  function _qwery(selector) {
    var r = [], ret = [], i, l,
        tokens = tokenCache.g(selector) || tokenCache.s(selector, selector.split(tokenizr));
    tokens = tokens.slice(0);
    if (!tokens.length) {
      return r;
    }
    r = loopAll(tokens);
    if (!tokens.length) {
      return r;
    }
    // loop through all descendent tokens
    for (j = 0, l = r.length, k = 0; j < l; j++) {
      node = r[j];
      p = node;
      // loop through each token
      for (i = tokens.length; i--;) {
        z: // loop through parent nodes
        while (p !== html && (p = p.parentNode)) {
          if (found = interpret.apply(p, q(tokens[i]))) {
            break z;
          }
        }
      }
      found && (ret[k++] = node);
    }
    return ret;
  }

  function boilerPlate(selector, _root, fn) {
    var root = (typeof _root == 'string') ? fn(_root)[0] : (_root || doc);
    if (selector === window || isNode(selector)) {
      return !_root || (selector !== window && isNode(root) && isAncestor(selector, root)) ? [selector] : [];
    }
    if (selector && typeof selector === 'object' && isFinite(selector.length)) {
      return array(selector);
    }
    if (m = selector.match(idOnly)) {
      return (el = doc.getElementById(m[1])) ? [el] : [];
    }
    if (m = selector.match(tagOnly)) {
      return array(root.getElementsByTagName(m[1]));
    }
    return false;
  }

  function isNode(el) {
    return (el && el.nodeType && (el.nodeType == 1 || el.nodeType == 9));
  }

  function uniq(ar) {
    var a = [], i, j;
    label:
    for (i = 0; i < ar.length; i++) {
      for (j = 0; j < a.length; j++) {
        if (a[j] == ar[i]) {
          continue label;
        }
      }
      a[a.length] = ar[i];
    }
    return a;
  }

  function qwery(selector, _root) {
    var root = (typeof _root == 'string') ? qwery(_root)[0] : (_root || doc);
    if (!root || !selector) {
      return [];
    }
    if (m = boilerPlate(selector, _root, qwery)) {
      return m;
    }
    return select(selector, root);
  }

  var isAncestor = 'compareDocumentPosition' in html ?
    function (element, container) {
      return (container.compareDocumentPosition(element) & 16) == 16;
    } : 'contains' in html ?
    function (element, container) {
      container = container == doc || container == window ? html : container;
      return container !== element && container.contains(element);
    } :
    function (element, container) {
      while (element = element.parentNode) {
        if (element === container) {
          return 1;
        }
      }
      return 0;
    },

  select = (doc.querySelector && doc.querySelectorAll) ?
    function (selector, root) {
      if (doc.getElementsByClassName && (m = selector.match(classOnly))) {
        return array((root).getElementsByClassName(m[1]));
      }
      return array((root).querySelectorAll(selector));
    } :
    function (selector, root) {
      var result = [], collection, collections = [], i;
      if (m = selector.match(tagAndOrClass)) {
        items = root.getElementsByTagName(m[1] || '*');
        r = classCache.g(m[2]) || classCache.s(m[2], new RegExp('(^|\\s+)' + m[2] + '(\\s+|$)'));
        for (i = 0, l = items.length, j = 0; i < l; i++) {
          r.test(items[i].className) && (result[j++] = items[i]);
        }
        return result;
      }
      for (i = 0, items = selector.split(','), l = items.length; i < l; i++) {
        collections[i] = _qwery(items[i]);
      }
      for (i = 0, l = collections.length; i < l && (collection = collections[i]); i++) {
        var ret = collection;
        if (root !== doc) {
          ret = [];
          for (j = 0, m = collection.length; j < m && (element = collection[j]); j++) {
            // make sure element is a descendent of root
            isAncestor(element, root) && ret.push(element);
          }
        }
        result = result.concat(ret);
      }
      return uniq(result);
    };

  qwery.uniq = uniq;
  var oldQwery = context.qwery;
  qwery.noConflict = function () {
    context.qwery = oldQwery;
    return this;
  };
  context['qwery'] = qwery;

}(this, document);!function (doc) {
  var q = qwery.noConflict();
  function create(node, root) {
    var el = (root || doc).createElement('div'), els = [];
    el.innerHTML = node;
    var nodes = el.childNodes;
    el = el.firstChild;
    els.push(el);
    while (el = el.nextSibling) {
      (el.nodeType == 1) && els.push(el);
    }
    return els;
  };
  $._select = function (s, r) {
    return /^\s*</.test(s) ? create(s, r) : q(s, r);
  };
  $.ender({
    find: function (s) {
      var r = [], i, l, j, k, els;
      for (i = 0, l = this.length; i < l; i++) {
        els = q(s, this[i]);
        for (j = 0, k = els.length; j < k; j++) {
          r.push(els[j]);
        }
      }
      return $(q.uniq(r));
    }
    , and: function (s) {
      var plus = $(s);
      for (var i = this.length, j = 0, l = this.length + plus.length; i < l; i++, j++) {
        this[i] = plus[j];
      }
      return this;
    }
  }, true);
}(document);

/*!
  * Valentine: JavaScript's Sister
  * copyright Dustin Diaz 2011 (@ded)
  * https://github.com/ded/valentine
  * License MIT
  */

!function (context) {

  var v = function (a, scope) {
        return new Valentine(a, scope);
      },
      ap = [],
      op = {},
      slice = ap.slice,
      nativ = 'map' in ap,
      nativ18 = 'reduce' in ap,
      trimReplace = /(^\s*|\s*$)/g;

  var iters = {
    each: nativ ?
      function (a, fn, scope) {
        ap.forEach.call(a, fn, scope);
      } :
      function (a, fn, scope) {
        for (var i = 0, l = a.length; i < l; i++) {
          i in a && fn.call(scope, a[i], i, a);
        }
      },
    map: nativ ?
      function (a, fn, scope) {
        return ap.map.call(a, fn, scope);
      } :
      function (a, fn, scope) {
        var r = [], i;
        for (i = 0, l = a.length; i < l; i++) {
          i in a && (r[i] = fn.call(scope, a[i], i, a));
        }
        return r;
      },
    some: nativ ?
      function (a, fn, scope) {
        return a.some(fn, scope);
      } :
      function (a, fn, scope) {
        for (var i = 0, l = a.length; i < l; i++) {
          if (i in a && fn.call(scope, a[i], i, a)) {
            return true;
          }
        }
        return false;
      },
    every: nativ ?
      function (a, fn, scope) {
        return a.every(fn, scope);
      } :
      function (a, fn, scope) {
        for (var i = 0, l = a.length; i < l; i++) {
          if (i in a && !fn.call(scope, a[i], i, a)) {
            return false;
          }
        }
        return true;
      },
    filter: nativ ?
      function (a, fn, scope) {
        return a.filter(fn, scope);
      } :
      function (a, fn, scope) {
        var r = [];
        for (var i = 0, j = 0, l = a.length; i < l; i++) {
          if (i in a) {
            if (!fn.call(scope, a[i], i, a)) {
              continue;
            }
            r[j++] = a[i];
          }
        }
        return r;
      },
    indexOf: nativ ?
      function (a, el, start) {
        return a.indexOf(el, isFinite(start) ? start : 0);
      } :
      function (a, el, start) {
        start = start || 0;
        for (var i = 0; i < a.length; i++) {
          if (i in a && a[i] === el) {
            return i;
          }
        }
        return -1;
      },

    lastIndexOf: nativ ?
      function (a, el, start) {
        return a.lastIndexOf(el, isFinite(start) ? start : a.length);
      } :
      function (a, el, start) {
        start = start || a.length;
        start = start >= a.length ? a.length :
          start < 0 ? a.length + start : start;
        for (var i = start; i >= 0; --i) {
          if (i in a && a[i] === el) {
            return i;
          }
        }
        return -1;
      },

    reduce: nativ18 ?
      function (o, i, m, c) {
        return ap.reduce.call(o, i, m, c);
      } :
      function (obj, iterator, memo, context) {
        !obj && (obj = []);
        var i = 0, l = obj.length;
        if (arguments.length < 3) {
          do {
            if (i in obj) {
              memo = obj[i++];
              break;
            }
            if (++i >= l) {
              throw new TypeError('Empty array');
            }
          } while (1);
        }
        for (; i < l; i++) {
          if (i in obj) {
            memo = iterator.call(context, memo, obj[i], i, obj);
          }
        }
        return memo;
      },

    reduceRight: nativ18 ?
      function (o, i, m, c) {
        return ap.reduceRight.call(o, i, m, c);
      } :
      function (obj, iterator, memo, context) {
        !obj && (obj = []);
        var l = obj.length, i = l - 1;
        if (arguments.length < 3) {
          do {
            if (i in obj) {
              memo = obj[i--];
              break;
            }
            if (--i < 0) {
              throw new TypeError('Empty array');
            }
          } while (1);
        }
        for (; i >= 0; i--) {
          if (i in obj) {
            memo = iterator.call(context, memo, obj[i], i, obj);
          }
        }
        return memo;
      },

    find: function (obj, iterator, context) {
      var result;
      iters.some(obj, function (value, index, list) {
        if (iterator.call(context, value, index, list)) {
          result = value;
          return true;
        }
      });
      return result;
    },

    reject: function (a, fn, scope) {
      var r = [];
      for (var i = 0, j = 0, l = a.length; i < l; i++) {
        if (i in a) {
          if (fn.call(scope, a[i], i, a)) {
            continue;
          }
          r[j++] = a[i];
        }
      }
      return r;
    },

    size: function (a) {
      return o.toArray(a).length;
    },

    pluck: function (a, k) {
      return iters.map(a, function (el) {
        return el[k];
      });
    },

    compact: function (a) {
      return iters.filter(a, function (value) {
        return !!value;
      });
    },

    flatten: function (a) {
      return iters.reduce(a, function (memo, value) {
        if (is.arr(value)) {
          return memo.concat(iters.flatten(value));
        }
        memo[memo.length] = value;
        return memo;
      }, []);
    },

    uniq: function (ar) {
      var a = [], i, j;
      label:
      for (i = 0; i < ar.length; i++) {
        for (j = 0; j < a.length; j++) {
          if (a[j] == ar[i]) {
            continue label;
          }
        }
        a[a.length] = ar[i];
      }
      return a;
    }

  };

  function aug(o, o2) {
    for (var k in o2) {
      o[k] = o2[k];
    }
  }

  var is = {
    fun: function (f) {
      return typeof f === 'function';
    },

    str: function (s) {
      return typeof s === 'string';
    },

    ele: function (el) {
      !!(el && el.nodeType && el.nodeType == 1);
    },

    arr: function (ar) {
      return ar instanceof Array;
    },

    arrLike: function (ar) {
      return (ar && ar.length && isFinite(ar.length));
    },

    num: function (n) {
      return typeof n === 'number';
    },

    bool: function (b) {
      return (b === true) || (b === false);
    },

    args: function (a) {
      return !!(a && op.hasOwnProperty.call(a, 'callee'));
    },

    emp: function (o) {
      var i = 0;
      return is.arr(o) ? o.length === 0 :
        is.obj(o) ? (function () {
          for (var k in o) {
            i++;
            break;
          }
          return (i === 0);
        }()) :
        o === '';
    },

    dat: function (d) {
      return !!(d && d.getTimezoneOffset && d.setUTCFullYear);
    },

    reg: function (r) {
      return !!(r && r.test && r.exec && (r.ignoreCase || r.ignoreCase === false));
    },

    nan: function (n) {
      return n !== n;
    },

    nil: function (o) {
      return o === null;
    },

    und: function (o) {
      return typeof o === 'undefined';
    },

    obj: function (o) {
      return o instanceof Object && !is.fun(o) && !is.arr(o);
    }
  };

  var o = {
    each: function (a, fn, scope) {
      is.arrLike(a) ?
        iters.each(a, fn, scope) : (function () {
          for (var k in a) {
            op.hasOwnProperty.call(a, k) && fn.call(scope, k, a[k], a);
          }
        }());
    },

    map: function (a, fn, scope) {
      var r = [], i = 0;
      return is.arrLike(a) ?
        iters.map(a, fn, scope) : !function () {
          for (var k in a) {
            op.hasOwnProperty.call(a, k) && (r[i++] = fn.call(scope, k, a[k], a));
          }
        }() && r;
    },

    toArray: function (a) {
      if (!a) {
        return [];
      }
      if (a.toArray) {
        return a.toArray();
      }
      if (is.arr(a)) {
        return a;
      }
      if (is.args(a)) {
        return slice.call(a);
      }
      return iters.map(a, function (k) {
        return k;
      });
    },

    first: function (a) {
      return a[0];
    },

    last: function (a) {
      return a[a.length - 1];
    },

    keys: Object.keys ?
      function (o) {
        return Object.keys(o);
      } :
      function (obj) {
        var keys = [];
        for (var key in obj) {
          op.hasOwnProperty.call(obj, key) && (keys[keys.length] = key);
        }
        return keys;
      },

    values: function (ob) {
      return o.map(ob, function (k, v) {
        return v;
      });
    },

    extend: function (ob) {
      o.each(slice.call(arguments, 1), function (source) {
        for (var prop in source) {
          !is.und(source[prop]) && (ob[prop] = source[prop]);
        }
      });
      return ob;
    },

    trim: String.prototype.trim ?
      function (s) {
        return s.trim();
      } :
      function (s) {
        return s.replace(trimReplace, '');
      },

    bind: function (scope, fn) {
      return function () {
        fn.apply(scope, arguments);
      };
    }

  };

  aug(v, iters);
  aug(v, o);
  v.is = is;

  // love thyself
  v.v = v;

  // peoples like the object style
  var Valentine = function (a, scope) {
    this.val = a;
    this._scope = scope || null;
    this._chained = 0;
  };

  v.each(v.extend({}, iters, o), function (name, fn) {
    Valentine.prototype[name] = function () {
      var a = v.toArray(arguments);
      a.unshift(this.val);
      var ret = fn.apply(this._scope, a);
      this.val = ret;
      return this._chained ? this : ret;
    };
  });

  // back compact to underscore (peoples like chaining)
  Valentine.prototype.chain = function () {
    this._chained = 1;
    return this;
  };

  Valentine.prototype.value = function () {
    return this.val;
  };

  var old = context.v;
  v.noConflict = function () {
    context.v = old;
    return this;
  };

  (typeof module !== 'undefined') && module.exports ?
    (module.exports = v) :
    (context['v'] = v);

}(this);ender.ender(v);
/*!
  * Reqwest! A x-browser general purpose XHR connection manager
  * copyright Dustin Diaz 2011
  * https://github.com/ded/reqwest
  * license MIT
  */
!function (window) {
  var twoHundo = /^20\d$/,
      doc = document,
      byTag = 'getElementsByTagName',
      head = doc[byTag]('head')[0],
      xhr = ('XMLHttpRequest' in window) ?
        function () {
          return new XMLHttpRequest();
        } :
        function () {
          return new ActiveXObject('Microsoft.XMLHTTP');
        };

  var uniqid = 0;
  // data stored by the most recent JSONP callback
  var lastValue;

  function readyState(o, success, error) {
    return function () {
      if (o && o.readyState == 4) {
        if (twoHundo.test(o.status)) {
          success(o);
        } else {
          error(o);
        }
      }
    };
  }

  function setHeaders(http, options) {
    var headers = options.headers || {};
    headers.Accept = 'text/javascript, text/html, application/xml, text/xml, */*';
    headers['X-Requested-With'] = headers['X-Requested-With'] || 'XMLHttpRequest';
    if (options.data) {
      headers['Content-type'] = 'application/x-www-form-urlencoded';
      for (var h in headers) {
        headers.hasOwnProperty(h) && http.setRequestHeader(h, headers[h], false);
      }
    }
  }

  function getCallbackName(o) {
    var callbackVar = o.jsonpCallback || "callback";
    if (o.url.slice(-(callbackVar.length + 2)) == (callbackVar + "=?")) {
      // Generate a guaranteed unique callback name
      var callbackName = "reqwest_" + uniqid++;

      // Replace the ? in the URL with the generated name
      o.url = o.url.substr(0, o.url.length - 1) + callbackName;
      return callbackName;
    } else {
      // Find the supplied callback name
      var regex = new RegExp(callbackVar + "=([\\w]+)");
      return o.url.match(regex)[1];
    }
  }

  // Store the data returned by the most recent callback
  function generalCallback(data) {
    lastValue = data;
  }

  function getRequest(o, fn, err) {
    if (o.type == 'jsonp') {
      var script = doc.createElement('script');

      // Add the global callback
      window[getCallbackName(o)] = generalCallback;

      // Setup our script element
      script.type = "text/javascript";
      script.src = o.url;
      script.async = true;
      
      var onload = function () {
        // Call the user callback with the last value stored
        // and clean up values and scripts.
        o.success && o.success(lastValue);
        lastValue = undefined;
        head.removeChild(script);
      };
      
      script.onload = onload;
      // onload for IE
      script.onreadystatechange = function () {
        script.readyState == "loaded" && onload();
      };
      
      // Add the script to the DOM head
      head.appendChild(script);
    } else {
      var http = xhr();
      http.open(o.method || 'GET', typeof o == 'string' ? o : o.url, true);
      setHeaders(http, o);
      http.onreadystatechange = readyState(http, fn, err);
      o.before && o.before(http);
      http.send(o.data || null);
      return http;
    }
  }

  function Reqwest(o, fn) {
    this.o = o;
    this.fn = fn;
    init.apply(this, arguments);
  }

  function setType(url) {
    if (/\.json$/.test(url)) {
      return 'json';
    }
    if (/\.jsonp$/.test(url)) {
      return 'jsonp';
    }
    if (/\.js$/.test(url)) {
      return 'js';
    }
    if (/\.html?$/.test(url)) {
      return 'html';
    }
    if (/\.xml$/.test(url)) {
      return 'xml';
    }
    return 'js';
  }

  function init(o, fn) {
    this.url = typeof o == 'string' ? o : o.url;
    this.timeout = null;
    var type = o.type || setType(this.url), self = this;
    fn = fn || function () {};

    if (o.timeout) {
      this.timeout = setTimeout(function () {
        self.abort();
        error();
      }, o.timeout);
    }

    function complete(resp) {
      o.complete && o.complete(resp);
    }

    function success(resp) {
      o.timeout && clearTimeout(self.timeout) && (self.timeout = null);
      var r = resp.responseText;

      switch (type) {
      case 'json':
        resp = eval('(' + r + ')');
        break;
      case 'js':
        resp = eval(r);
        break;
      case 'html':
        resp = r;
        break;
      // default is the response from server
      }

      fn(resp);
      o.success && o.success(resp);
      complete(resp);
    }

    function error(resp) {
      o.error && o.error(resp);
      complete(resp);
    }

    this.request = getRequest(o, success, error);
  }

  Reqwest.prototype = {
    abort: function () {
      this.request.abort();
    },

    retry: function () {
      init.call(this, this.o, this.fn);
    }
  };

  function reqwest(o, fn) {
    return new Reqwest(o, fn);
  }

  function enc(v) {
    return encodeURIComponent(v);
  }

  function serial(el) {
    var n = el.name;
    // don't serialize elements that are disabled or without a name
    if (el.disabled || !n) {
      return '';
    }
    n = enc(n);
    switch (el.tagName.toLowerCase()) {
    case 'input':
      switch (el.type) {
      // silly wabbit
      case 'reset':
      case 'button':
      case 'image':
      case 'file':
        return '';
      case 'checkbox':
      case 'radio':
        return el.checked ? n + '=' + (el.value ? enc(el.value) : true) + '&' : '';
      default: // text hidden password submit
        return n + '=' + (el.value ? enc(el.value) : true) + '&';
      }
      break;
    case 'textarea':
      return n + '=' + enc(el.value) + '&';
    case 'select':
      // @todo refactor beyond basic single selected value case
      return n + '=' + enc(el.options[el.selectedIndex].value) + '&';
    }
    return '';
  }

  reqwest.serialize = function (form) {
    var inputs = form[byTag]('input'),
        selects = form[byTag]('select'),
        texts = form[byTag]('textarea');
    return (v(inputs).chain().toArray().map(serial).value().join('') +
    v(selects).chain().toArray().map(serial).value().join('') +
    v(texts).chain().toArray().map(serial).value().join('')).replace(/&$/, '');
  };

  reqwest.serializeArray = function (f) {
    for (var pairs = this.serialize(f).split('&'), i = 0, l = pairs.length, r = [], o; i < l; i++) {
      pairs[i] && (o = pairs[i].split('=')) && r.push({name: o[0], value: o[1]});
    }
    return r;
  };

  var old = window.reqwest;
  reqwest.noConflict = function () {
    window.reqwest = old;
    return this;
  };

  // defined as extern for Closure Compilation
  // do not change to (dot) '.' syntax
  window['reqwest'] = reqwest;

}(this);
ender.ender({
  ajax: reqwest
});
ender.ender({
  serialize: function () {
    return reqwest.serialize(this[0]);
  }
  , serializeArray: function() {
    return reqwest.serializeArray(this[0]);
  }
}, true);