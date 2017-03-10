(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

(function (root) {

  // Store setTimeout reference so promise-polyfill will be unaffected by
  // other code modifying setTimeout (like sinon.useFakeTimers())
  var setTimeoutFunc = setTimeout;

  function noop() {}

  // Polyfill for Function.prototype.bind
  function bind(fn, thisArg) {
    return function () {
      fn.apply(thisArg, arguments);
    };
  }

  function Promise(fn) {
    if (_typeof(this) !== 'object') throw new TypeError('Promises must be constructed via new');
    if (typeof fn !== 'function') throw new TypeError('not a function');
    this._state = 0;
    this._handled = false;
    this._value = undefined;
    this._deferreds = [];

    doResolve(fn, this);
  }

  function handle(self, deferred) {
    while (self._state === 3) {
      self = self._value;
    }
    if (self._state === 0) {
      self._deferreds.push(deferred);
      return;
    }
    self._handled = true;
    Promise._immediateFn(function () {
      var cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
      if (cb === null) {
        (self._state === 1 ? resolve : reject)(deferred.promise, self._value);
        return;
      }
      var ret;
      try {
        ret = cb(self._value);
      } catch (e) {
        reject(deferred.promise, e);
        return;
      }
      resolve(deferred.promise, ret);
    });
  }

  function resolve(self, newValue) {
    try {
      // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
      if (newValue === self) throw new TypeError('A promise cannot be resolved with itself.');
      if (newValue && ((typeof newValue === 'undefined' ? 'undefined' : _typeof(newValue)) === 'object' || typeof newValue === 'function')) {
        var then = newValue.then;
        if (newValue instanceof Promise) {
          self._state = 3;
          self._value = newValue;
          finale(self);
          return;
        } else if (typeof then === 'function') {
          doResolve(bind(then, newValue), self);
          return;
        }
      }
      self._state = 1;
      self._value = newValue;
      finale(self);
    } catch (e) {
      reject(self, e);
    }
  }

  function reject(self, newValue) {
    self._state = 2;
    self._value = newValue;
    finale(self);
  }

  function finale(self) {
    if (self._state === 2 && self._deferreds.length === 0) {
      Promise._immediateFn(function () {
        if (!self._handled) {
          Promise._unhandledRejectionFn(self._value);
        }
      });
    }

    for (var i = 0, len = self._deferreds.length; i < len; i++) {
      handle(self, self._deferreds[i]);
    }
    self._deferreds = null;
  }

  function Handler(onFulfilled, onRejected, promise) {
    this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
    this.onRejected = typeof onRejected === 'function' ? onRejected : null;
    this.promise = promise;
  }

  /**
   * Take a potentially misbehaving resolver function and make sure
   * onFulfilled and onRejected are only called once.
   *
   * Makes no guarantees about asynchrony.
   */
  function doResolve(fn, self) {
    var done = false;
    try {
      fn(function (value) {
        if (done) return;
        done = true;
        resolve(self, value);
      }, function (reason) {
        if (done) return;
        done = true;
        reject(self, reason);
      });
    } catch (ex) {
      if (done) return;
      done = true;
      reject(self, ex);
    }
  }

  Promise.prototype['catch'] = function (onRejected) {
    return this.then(null, onRejected);
  };

  Promise.prototype.then = function (onFulfilled, onRejected) {
    var prom = new this.constructor(noop);

    handle(this, new Handler(onFulfilled, onRejected, prom));
    return prom;
  };

  Promise.all = function (arr) {
    var args = Array.prototype.slice.call(arr);

    return new Promise(function (resolve, reject) {
      if (args.length === 0) return resolve([]);
      var remaining = args.length;

      function res(i, val) {
        try {
          if (val && ((typeof val === 'undefined' ? 'undefined' : _typeof(val)) === 'object' || typeof val === 'function')) {
            var then = val.then;
            if (typeof then === 'function') {
              then.call(val, function (val) {
                res(i, val);
              }, reject);
              return;
            }
          }
          args[i] = val;
          if (--remaining === 0) {
            resolve(args);
          }
        } catch (ex) {
          reject(ex);
        }
      }

      for (var i = 0; i < args.length; i++) {
        res(i, args[i]);
      }
    });
  };

  Promise.resolve = function (value) {
    if (value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && value.constructor === Promise) {
      return value;
    }

    return new Promise(function (resolve) {
      resolve(value);
    });
  };

  Promise.reject = function (value) {
    return new Promise(function (resolve, reject) {
      reject(value);
    });
  };

  Promise.race = function (values) {
    return new Promise(function (resolve, reject) {
      for (var i = 0, len = values.length; i < len; i++) {
        values[i].then(resolve, reject);
      }
    });
  };

  // Use polyfill for setImmediate for performance gains
  Promise._immediateFn = typeof setImmediate === 'function' && function (fn) {
    setImmediate(fn);
  } || function (fn) {
    setTimeoutFunc(fn, 0);
  };

  Promise._unhandledRejectionFn = function _unhandledRejectionFn(err) {
    if (typeof console !== 'undefined' && console) {
      console.warn('Possible Unhandled Promise Rejection:', err); // eslint-disable-line no-console
    }
  };

  /**
   * Set the immediate function to execute callbacks
   * @param fn {function} Function to execute
   * @deprecated
   */
  Promise._setImmediateFn = function _setImmediateFn(fn) {
    Promise._immediateFn = fn;
  };

  /**
   * Change the function to execute on unhandled rejection
   * @param {function} fn Function to execute on unhandled rejection
   * @deprecated
   */
  Promise._setUnhandledRejectionFn = function _setUnhandledRejectionFn(fn) {
    Promise._unhandledRejectionFn = fn;
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Promise;
  } else if (!root.Promise) {
    root.Promise = Promise;
  }
})(undefined);

},{}],2:[function(require,module,exports){
(function (process,global){
"use strict";

(function (global, undefined) {
    "use strict";

    if (global.setImmediate) {
        return;
    }

    var nextHandle = 1; // Spec says greater than zero
    var tasksByHandle = {};
    var currentlyRunningATask = false;
    var doc = global.document;
    var registerImmediate;

    function setImmediate(callback) {
        // Callback can either be a function or a string
        if (typeof callback !== "function") {
            callback = new Function("" + callback);
        }
        // Copy function arguments
        var args = new Array(arguments.length - 1);
        for (var i = 0; i < args.length; i++) {
            args[i] = arguments[i + 1];
        }
        // Store and register the task
        var task = { callback: callback, args: args };
        tasksByHandle[nextHandle] = task;
        registerImmediate(nextHandle);
        return nextHandle++;
    }

    function clearImmediate(handle) {
        delete tasksByHandle[handle];
    }

    function run(task) {
        var callback = task.callback;
        var args = task.args;
        switch (args.length) {
            case 0:
                callback();
                break;
            case 1:
                callback(args[0]);
                break;
            case 2:
                callback(args[0], args[1]);
                break;
            case 3:
                callback(args[0], args[1], args[2]);
                break;
            default:
                callback.apply(undefined, args);
                break;
        }
    }

    function runIfPresent(handle) {
        // From the spec: "Wait until any invocations of this algorithm started before this one have completed."
        // So if we're currently running a task, we'll need to delay this invocation.
        if (currentlyRunningATask) {
            // Delay by doing a setTimeout. setImmediate was tried instead, but in Firefox 7 it generated a
            // "too much recursion" error.
            setTimeout(runIfPresent, 0, handle);
        } else {
            var task = tasksByHandle[handle];
            if (task) {
                currentlyRunningATask = true;
                try {
                    run(task);
                } finally {
                    clearImmediate(handle);
                    currentlyRunningATask = false;
                }
            }
        }
    }

    function installNextTickImplementation() {
        registerImmediate = function registerImmediate(handle) {
            process.nextTick(function () {
                runIfPresent(handle);
            });
        };
    }

    function canUsePostMessage() {
        // The test against `importScripts` prevents this implementation from being installed inside a web worker,
        // where `global.postMessage` means something completely different and can't be used for this purpose.
        if (global.postMessage && !global.importScripts) {
            var postMessageIsAsynchronous = true;
            var oldOnMessage = global.onmessage;
            global.onmessage = function () {
                postMessageIsAsynchronous = false;
            };
            global.postMessage("", "*");
            global.onmessage = oldOnMessage;
            return postMessageIsAsynchronous;
        }
    }

    function installPostMessageImplementation() {
        // Installs an event handler on `global` for the `message` event: see
        // * https://developer.mozilla.org/en/DOM/window.postMessage
        // * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages

        var messagePrefix = "setImmediate$" + Math.random() + "$";
        var onGlobalMessage = function onGlobalMessage(event) {
            if (event.source === global && typeof event.data === "string" && event.data.indexOf(messagePrefix) === 0) {
                runIfPresent(+event.data.slice(messagePrefix.length));
            }
        };

        if (global.addEventListener) {
            global.addEventListener("message", onGlobalMessage, false);
        } else {
            global.attachEvent("onmessage", onGlobalMessage);
        }

        registerImmediate = function registerImmediate(handle) {
            global.postMessage(messagePrefix + handle, "*");
        };
    }

    function installMessageChannelImplementation() {
        var channel = new MessageChannel();
        channel.port1.onmessage = function (event) {
            var handle = event.data;
            runIfPresent(handle);
        };

        registerImmediate = function registerImmediate(handle) {
            channel.port2.postMessage(handle);
        };
    }

    function installReadyStateChangeImplementation() {
        var html = doc.documentElement;
        registerImmediate = function registerImmediate(handle) {
            // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
            // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
            var script = doc.createElement("script");
            script.onreadystatechange = function () {
                runIfPresent(handle);
                script.onreadystatechange = null;
                html.removeChild(script);
                script = null;
            };
            html.appendChild(script);
        };
    }

    function installSetTimeoutImplementation() {
        registerImmediate = function registerImmediate(handle) {
            setTimeout(runIfPresent, 0, handle);
        };
    }

    // If supported, we should attach to the prototype of global, since that is where setTimeout et al. live.
    var attachTo = Object.getPrototypeOf && Object.getPrototypeOf(global);
    attachTo = attachTo && attachTo.setTimeout ? attachTo : global;

    // Don't get fooled by e.g. browserify environments.
    if ({}.toString.call(global.process) === "[object process]") {
        // For Node.js before 0.9
        installNextTickImplementation();
    } else if (canUsePostMessage()) {
        // For non-IE10 modern browsers
        installPostMessageImplementation();
    } else if (global.MessageChannel) {
        // For web workers, where supported
        installMessageChannelImplementation();
    } else if (doc && "onreadystatechange" in doc.createElement("script")) {
        // For IE 6–8
        installReadyStateChangeImplementation();
    } else {
        // For older browsers
        installSetTimeoutImplementation();
    }

    attachTo.setImmediate = setImmediate;
    attachTo.clearImmediate = clearImmediate;
})(typeof self === "undefined" ? typeof global === "undefined" ? undefined : global : self);

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"_process":5}],3:[function(require,module,exports){
/*
MIT LICENSE
Copyright (c) 2016 iTisso
https://github.com/iTisso/CanvasObjLibrary
varsion:2.0
*/
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.requestIdleCallback = exports.CanvasObjLibrary = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

require('../lib/setImmediate/setImmediate.js');

var _promise = require('../lib/promise/promise.js');

var _promise2 = _interopRequireDefault(_promise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

if (!window.Promise) window.Promise = _promise2.default;

var defProp = Object.defineProperty;

//class:CanvasObjLibrary

var CanvasObjLibrary = function () {
	function CanvasObjLibrary(canvas) {
		var _this = this;

		_classCallCheck(this, CanvasObjLibrary);

		if (canvas instanceof HTMLCanvasElement === false) throw new TypeError('canvas required');
		var COL = this;
		Object.assign(this, {
			/*The main canvas*/
			canvas: canvas,
			/*Canvas' context*/
			context: canvas.getContext('2d'),
			default: {
				/*default font*/
				font: {
					fontStyle: null,
					fontWeight: null,
					fontVariant: null,
					color: "#000",
					textAlign: 'start', //left right center start end
					lineHeight: null,
					fontSize: 14,
					fontFamily: "Arial",
					strokeWidth: 0,
					strokeColor: "#000",
					shadowBlur: 0,
					shadowColor: "#000",
					shadowOffsetX: 0,
					shadowOffsetY: 0,
					fill: true,
					reverse: false
				},
				style: {
					width: 1,
					height: 1,
					hidden: false,
					opacity: 1,
					clipOverflow: false,
					backgroundColor: null,
					composite: null,
					debugBorderColor: 'black',
					x: 0,
					y: 0,
					zoomX: 1,
					zoomY: 1,
					rotate: 0,
					rotatePointX: 0,
					rotatePointY: 0,
					positionPointX: 0,
					positionPointY: 0,
					zoomPointX: 0,
					zoomPointY: 0,
					skewX: 1,
					skewY: 1,
					skewPointX: 0,
					skewPointY: 0
				}
			},
			stat: {
				mouse: {
					x: null,
					y: null,
					previousX: null,
					previousY: null
				},
				/*The currently focused on obj*/
				onfocus: null,
				/*The currently mouseover obj*/
				onover: null,
				canvasOnFocus: false,
				canvasOnover: false

			},
			tmp: {
				graphID: 0,
				onOverGraph: null,
				toClickGraph: null,
				matrix1: new Float32Array([1, 0, 0, 0, 1, 0]),
				matrix2: new Float32Array([1, 0, 0, 0, 1, 0]),
				matrix3: new Float32Array([1, 0, 0, 0, 1, 0])
			},

			root: null, //root Graph

			class: {},

			autoClear: true,
			//Debug info
			debug: {
				switch: false,
				count: 0,
				frame: 0,
				FPS: 0,
				_lastFrameTime: Date.now(),
				on: function on() {
					this.switch = true;
				},
				off: function off() {
					this.switch = false;
				}
			}
		});
		//set classes
		for (var c in COL_Class) {
			this.class[c] = COL_Class[c](this);
		} //init root graph
		this.root = new this.class.FunctionGraph();
		this.root.name = 'root';
		//prevent root's parentNode being modified
		defProp(this.root, 'parentNode', { configurable: false });

		//adjust canvas drawing size
		this.adjustCanvas();

		//const canvas=this.canvas;
		//add events
		addEvents(canvas, {
			mouseout: function mouseout(e) {
				_this.stat.canvasOnover = false;
				//clear mouse pos data
				_this.stat.mouse.x = null;
				_this.stat.mouse.y = null;
				//clear onover obj
				var onover = _this.stat.onover;
				_this._commonEventHandle(e);
				_this.stat.onover = null;
			},
			mouseover: function mouseover(e) {
				_this.stat.canvasOnover = true;
			},
			mousemove: function mousemove(e) {
				_this.tmp.toClick = false;
				_this._commonEventHandle(e);
			},
			mousedown: function mousedown(e) {
				_this.tmp.toClickGraph = _this.stat.onover;
				_this.stat.canvasOnFocus = true;
				_this.stat.onfocus = _this.stat.onover;
				_this._commonEventHandle(e);
			},
			mouseup: function mouseup(e) {
				return _this._commonEventHandle(e);
			},
			click: function click(e) {
				if (_this.tmp.toClickGraph) _this._commonEventHandle(e);
			},
			dblclick: function dblclick(e) {
				return _this._commonEventHandle(e);
			},
			selectstart: function selectstart(e) {
				return e.preventDefault();
			},
			wheel: function wheel(e) {
				var ce = new _this.class.WheelEvent('wheel');
				ce.origin = e;
				(_this.stat.onover || _this.root).emit(ce);
			}
		});
		addEvents(document, {
			mousedown: function mousedown(e) {
				if (e.target !== _this.canvas) {
					_this.stat.canvasOnFocus = false;
				}
			},
			mouseout: function mouseout(e) {
				if (_this.stat.mouse.x !== null) {
					var eve = new window.MouseEvent('mouseout');
					_this.canvas.dispatchEvent(eve);
				}
			},
			keydown: function keydown(e) {
				return _this._commonEventHandle(e);
			},
			keyup: function keyup(e) {
				return _this._commonEventHandle(e);
			},
			keypress: function keypress(e) {
				return _this._commonEventHandle(e);
			}

		});
	}

	_createClass(CanvasObjLibrary, [{
		key: 'generateGraphID',
		value: function generateGraphID() {
			return ++this.tmp.graphID;
		}
	}, {
		key: 'adjustCanvas',
		value: function adjustCanvas() {
			var width = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.canvas.offsetWidth;
			var height = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.canvas.offsetHeight;

			this.root.style.width = this.canvas.width = width;
			this.root.style.height = this.canvas.height = height;
			var ce = new this.class.Event('resize');
			this.root.emit(ce);
		}
	}, {
		key: '_commonEventHandle',
		value: function _commonEventHandle(e) {
			if (e instanceof MouseEvent) {
				this.stat.previousX = this.stat.mouse.x;
				this.stat.previousY = this.stat.mouse.y;
				if (e.type === 'mouseout') {
					this.stat.mouse.x = null;
					this.stat.mouse.y = null;
				} else {
					this.stat.mouse.x = e.layerX;
					this.stat.mouse.y = e.layerY;
				}
				var ce = new this.class.MouseEvent(e.type);
				ce.origin = e;
				(this.stat.onover || this.root).emit(ce);
			} else if (e instanceof KeyboardEvent) {
				if (!this.stat.canvasOnFocus) return;
				var _ce = new this.class.KeyboardEvent(e.type);
				_ce.origin = e;
				(this.stat.onfocus || this.root).emit(_ce);
			}
		}
	}, {
		key: 'clear',
		value: function clear() {
			this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		}
	}, {
		key: 'draw',
		value: function draw() {
			this.debug.count = 0;
			this.debug.frame++;
			this.autoClear && this.clear();
			this.traverseGraphTree(0);
			this.debug.switch && this.drawDebug();
		}
		/*
  	traverse mode
  		0	draw graphs and check onover graph
  		1	check onover graph
  */

	}, {
		key: 'traverseGraphTree',
		value: function traverseGraphTree() {
			var mode = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

			this.context.setTransform(1, 0, 0, 1, 0, 0);
			this.drawGraph(this.root, mode);
			var oldOnover = this.stat.onover;
			if (this.tmp.onOverGraph !== oldOnover) {
				//new onover graph
				this.tmp.toClickGraph = null;
				this.stat.onover = this.tmp.onOverGraph;
				if (oldOnover) oldOnover.emit(new this.class.MouseEvent('mouseout'));
				if (this.stat.onover) this.stat.onover.emit(new this.class.MouseEvent('mouseover'));
			}
			this.tmp.onOverGraph = null;
		}
	}, {
		key: 'drawDebug',
		value: function drawDebug() {
			var ct = this.context,
			    d = this.debug,
			    s = this.stat,
			    n = Date.now(),
			    x = this.stat.mouse.x,
			    y = this.stat.mouse.y;
			//fps
			d.FPS = 1000 / (n - d._lastFrameTime) + 0.5 | 0;
			d._lastFrameTime = n;
			//draw
			ct.save();
			ct.beginPath();
			ct.setTransform(1, 0, 0, 1, 0, 0);
			ct.font = "16px Arial";
			ct.textBaseline = "bottom";
			ct.globalCompositeOperation = "lighter";
			ct.fillStyle = "red";
			ct.fillText("point:" + String(x) + "," + String(y) + " FPS:" + d.FPS + " Items:" + d.count + " Frame:" + d.frame, 0, this.canvas.height);
			ct.fillText("onover:" + (s.onover ? s.onover.GID : "null") + " onfocus:" + (s.onfocus ? s.onfocus.GID : "null"), 0, this.canvas.height - 20);
			ct.strokeStyle = "red";
			ct.globalCompositeOperation = "source-over";
			ct.moveTo(x, y + 6);
			ct.lineTo(x, y - 6);
			ct.moveTo(x - 6, y);
			ct.lineTo(x + 6, y);
			ct.stroke();
			ct.restore();
		}
	}, {
		key: 'drawGraph',
		value: function drawGraph(g) {
			var mode = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

			if (g.style.hidden === true) return;
			var ct = this.context,
			    style = g.style,
			    M = this.tmp.matrix1,
			    tM = this.tmp.matrix2,
			    _M = this.tmp.matrix3;
			this.debug.count++;
			ct.save();
			if (mode === 0) {
				if (style.composite) ct.globalCompositeOperation = style.composite;
				if (style.opacity !== ct.globalAlpha) ct.globalAlpha = style.opacity;
			}
			//position & offset
			M[0] = 1;M[1] = 0;M[2] = style.x - style.positionPointX;
			M[3] = 0;M[4] = 1;M[5] = style.y - style.positionPointY;
			if (style.skewX !== 1 || style.skewY !== 1) {
				if (style.skewPointX !== 0 || style.skewPointY !== 0) {
					_M[0] = 1;_M[1] = 0;_M[2] = style.skewPointX;_M[3] = 0;_M[4] = 1;_M[5] = style.skewPointY;
					multiplyMatrix(M, _M, tM);
					_M[0] = style.skewX;_M[2] = 0;_M[4] = style.skewY;_M[5] = 0;
					multiplyMatrix(tM, _M, M);
					_M[0] = 1;_M[2] = -style.skewPointX;_M[4] = 1;_M[5] = -style.skewPointY;
					multiplyMatrix(M, _M, tM);
				} else {
					_M[0] = style.skewX;_M[1] = 0;_M[2] = 0;_M[3] = 0;_M[4] = style.skewY;_M[5] = 0;
					multiplyMatrix(M, _M, tM);
				}
				M.set(tM);
			}
			//rotate
			if (style.rotate !== 0) {
				var s = Math.sin(style.rotate * 0.0174532925),
				    c = Math.cos(style.rotate * 0.0174532925);
				if (style.rotatePointX !== 0 || style.rotatePointY !== 0) {
					_M[0] = 1;_M[1] = 0;_M[2] = style.rotatePointX;_M[3] = 0;_M[4] = 1;_M[5] = style.rotatePointY;
					multiplyMatrix(M, _M, tM);
					_M[0] = c;_M[1] = -s;_M[2] = 0;_M[3] = s;_M[4] = c;_M[5] = 0;
					multiplyMatrix(tM, _M, M);
					_M[0] = 1;_M[1] = 0;_M[2] = -style.rotatePointX;_M[3] = 0;_M[4] = 1;_M[5] = -style.rotatePointY;
					multiplyMatrix(M, _M, tM);
				} else {
					_M[0] = c;_M[1] = -s;_M[2] = 0;_M[3] = s;_M[4] = c;_M[5] = 0;
					multiplyMatrix(M, _M, tM);
				}
				M.set(tM);
			}
			//zoom
			if (style.zoomX !== 1 || style.zoomY !== 1) {
				if (style.zoomPointX !== 0 || style.zoomPointY !== 0) {
					_M[0] = 1;_M[1] = 0;_M[2] = style.zoomPointX;_M[3] = 0;_M[4] = 1;_M[5] = style.zoomPointY;
					multiplyMatrix(M, _M, tM);
					_M[0] = style.zoomX;_M[2] = 0;_M[4] = style.zoomY;_M[5] = 0;
					multiplyMatrix(tM, _M, M);
					_M[0] = 1;_M[2] = -style.zoomPointX;_M[4] = 1;_M[5] = -style.zoomPointY;
					multiplyMatrix(M, _M, tM);
				} else {
					_M[0] = style.zoomX;_M[1] = 0;_M[2] = 0;_M[3] = 0;_M[4] = style.zoomY;_M[5] = 0;
					multiplyMatrix(M, _M, tM);
				}
				M.set(tM);
			}
			ct.transform(M[0], M[3], M[1], M[4], M[2], M[5]);
			if (this.debug.switch && mode === 0) {
				ct.save();
				ct.beginPath();
				ct.globalAlpha = 0.5;
				ct.globalCompositeOperation = 'source-over';
				ct.strokeStyle = style.debugBorderColor;
				ct.strokeWidth = 1.5;
				ct.strokeRect(0, 0, style.width, style.height);
				ct.strokeWidth = 1;
				ct.globalAlpha = 1;
				ct.strokeStyle = 'green';
				ct.strokeRect(style.positionPointX - 5, style.positionPointY - 5, 10, 10);
				ct.strokeStyle = 'blue';
				ct.strokeRect(style.rotatePointX - 4, style.rotatePointX - 4, 8, 8);
				ct.strokeStyle = 'olive';
				ct.strokeRect(style.zoomPointX - 3, style.zoomPointX - 3, 6, 6);
				ct.strokeStyle = '#6cf';
				ct.strokeRect(style.skewPointX - 2, style.skewPointX - 2, 4, 4);
				ct.restore();
			}
			if (style.clipOverflow) {
				ct.beginPath();
				ct.rect(0, 0, style.width, style.height);
				ct.clip();
			}
			if (mode === 0) {
				g.drawer && g.drawer(ct);
			} else if (mode === 1) {
				g.checkIfOnOver(true, mode);
			}
			for (var i = 0; i < g.childNodes.length; i++) {
				this.drawGraph(g.childNodes[i], mode);
			}ct.restore();
		}
	}]);

	return CanvasObjLibrary;
}();

var COL_Class = {
	Event: function Event(host) {
		var COL = host;
		return function Event(type) {
			_classCallCheck(this, Event);

			this.type = type;
			this.timeStamp = Date.now();
		};
	},
	GraphEvent: function GraphEvent(host) {
		var COL = host;
		return function (_host$class$Event) {
			_inherits(GraphEvent, _host$class$Event);

			function GraphEvent(type) {
				_classCallCheck(this, GraphEvent);

				var _this2 = _possibleConstructorReturn(this, (GraphEvent.__proto__ || Object.getPrototypeOf(GraphEvent)).call(this, type));

				_this2.propagation = true;
				_this2.stoped = false;
				_this2.target = null;
				return _this2;
			}

			_createClass(GraphEvent, [{
				key: 'stopPropagation',
				value: function stopPropagation() {
					this.propagation = false;
				}
			}, {
				key: 'stopImmediatePropagation',
				value: function stopImmediatePropagation() {
					this.stoped = true;
				}
			}, {
				key: 'altKey',
				get: function get() {
					return this.origin.altKey;
				}
			}, {
				key: 'ctrlKey',
				get: function get() {
					return this.origin.ctrlKey;
				}
			}, {
				key: 'metaKey',
				get: function get() {
					return this.origin.metaKey;
				}
			}, {
				key: 'shiftKey',
				get: function get() {
					return this.origin.shiftKey;
				}
			}]);

			return GraphEvent;
		}(host.class.Event);
	},
	MouseEvent: function MouseEvent(host) {
		return function (_host$class$GraphEven) {
			_inherits(MouseEvent, _host$class$GraphEven);

			function MouseEvent() {
				_classCallCheck(this, MouseEvent);

				return _possibleConstructorReturn(this, (MouseEvent.__proto__ || Object.getPrototypeOf(MouseEvent)).apply(this, arguments));
			}

			_createClass(MouseEvent, [{
				key: 'button',
				get: function get() {
					return this.origin.button;
				}
			}, {
				key: 'buttons',
				get: function get() {
					return this.origin.buttons;
				}
			}, {
				key: 'movementX',
				get: function get() {
					return host.stat.mouse.x - host.stat.previousX;
				}
			}, {
				key: 'movementY',
				get: function get() {
					return host.stat.mouse.y - host.stat.previousY;
				}
			}]);

			return MouseEvent;
		}(host.class.GraphEvent);
	},
	WheelEvent: function WheelEvent(host) {
		return function (_host$class$MouseEven) {
			_inherits(WheelEvent, _host$class$MouseEven);

			function WheelEvent() {
				_classCallCheck(this, WheelEvent);

				return _possibleConstructorReturn(this, (WheelEvent.__proto__ || Object.getPrototypeOf(WheelEvent)).apply(this, arguments));
			}

			_createClass(WheelEvent, [{
				key: 'deltaX',
				get: function get() {
					return this.origin.deltaX;
				}
			}, {
				key: 'deltaY',
				get: function get() {
					return this.origin.deltaY;
				}
			}, {
				key: 'deltaZ',
				get: function get() {
					return this.origin.deltaZ;
				}
			}, {
				key: 'deltaMode',
				get: function get() {
					return this.origin.deltaMode;
				}
			}]);

			return WheelEvent;
		}(host.class.MouseEvent);
	},
	KeyboardEvent: function KeyboardEvent(host) {
		return function (_host$class$GraphEven2) {
			_inherits(KeyboardEvent, _host$class$GraphEven2);

			function KeyboardEvent() {
				_classCallCheck(this, KeyboardEvent);

				return _possibleConstructorReturn(this, (KeyboardEvent.__proto__ || Object.getPrototypeOf(KeyboardEvent)).apply(this, arguments));
			}

			_createClass(KeyboardEvent, [{
				key: 'key',
				get: function get() {
					return this.origin.key;
				}
			}, {
				key: 'code',
				get: function get() {
					return this.origin.code;
				}
			}, {
				key: 'repeat',
				get: function get() {
					return this.origin.repeat;
				}
			}, {
				key: 'keyCode',
				get: function get() {
					return this.origin.keyCode;
				}
			}, {
				key: 'charCode',
				get: function get() {
					return this.origin.charCode;
				}
			}, {
				key: 'location',
				get: function get() {
					return this.origin.location;
				}
			}]);

			return KeyboardEvent;
		}(host.class.GraphEvent);
	},
	GraphEventEmitter: function GraphEventEmitter(host) {
		var COL = host;
		return function () {
			function GraphEventEmitter() {
				_classCallCheck(this, GraphEventEmitter);

				this._events = {};
			}

			_createClass(GraphEventEmitter, [{
				key: 'emit',
				value: function emit(e) {
					if (e instanceof host.class.Event === false) return;
					e.target = this;
					this._resolve(e);
				}
			}, {
				key: '_resolve',
				value: function _resolve(e) {
					if (e.type in this._events) {
						var hs = this._events[e.type];
						try {
							for (var i = 0; i < hs.length; i++) {
								hs[i].call(this, e);
								if (e.stoped) return;
							}
						} catch (e) {
							console.error(e);
						}
					}
					if (e.propagation === true && this.parentNode) this.parentNode._resolve(e);
				}
			}, {
				key: 'on',
				value: function on(name, handle) {
					if (!(handle instanceof Function)) return;
					if (!(name in this._events)) this._events[name] = [];
					this._events[name].push(handle);
				}
			}, {
				key: 'removeEvent',
				value: function removeEvent(name, handle) {
					if (!(name in this._events)) return;
					if (arguments.length === 1) {
						delete this._events[name];return;
					}
					var ind = void 0;
					if (ind = this._events[name].indexOf(handle) >= 0) this._events[name].splice(ind, 1);
					if (this._events[name].length === 0) delete this._events[name];
				}
			}]);

			return GraphEventEmitter;
		}();
	},
	GraphStyle: function GraphStyle(host) {
		return function () {
			function GraphStyle(inhertFrom) {
				_classCallCheck(this, GraphStyle);

				if (inhertFrom && this.inhert(inhertFrom)) return;
				this.__proto__.__proto__ = host.default.style;
				this._calculatableStyleChanged = false;
			}

			_createClass(GraphStyle, [{
				key: 'inhertGraph',
				value: function inhertGraph(graph) {
					//inhert a graph's style
					if (!(graph instanceof host.class.Graph)) throw new TypeError('graph is not a Graph instance');
					this.inhertStyle(graph.style);
					return true;
				}
			}, {
				key: 'inhertStyle',
				value: function inhertStyle(style) {
					if (!(style instanceof host.class.GraphStyle)) throw new TypeError('graph is not a Graph instance');
					this.__proto__ = style;
					return true;
				}
			}, {
				key: 'inhert',
				value: function inhert(from) {
					if (from instanceof host.class.Graph) {
						this.inhertGraph(from);
						return true;
					} else if (from instanceof host.class.GraphStyle) {
						this.inhertStyle(from);
						return true;
					}
					return false;
				}
			}, {
				key: 'cancelInhert',
				value: function cancelInhert() {
					this.__proto__ = Object.prototype;
				}
			}, {
				key: 'getPoint',
				value: function getPoint(name) {
					switch (name) {
						case 'center':
							{
								return [this.width / 2, this.height / 2];
							}
					}
					return [0, 0];
				}
			}, {
				key: 'position',
				value: function position(x, y) {
					this.x = x;
					this.y = y;
				}
			}, {
				key: 'zoom',
				value: function zoom(x, y) {
					if (arguments.length == 1) {
						this.zoomX = this.zoomY = x;
					} else {
						this.zoomX = x;
						this.zoomY = y;
					}
				}
			}, {
				key: 'size',
				value: function size(w, h) {
					this.width = w;
					this.height = h;
				}
			}, {
				key: 'setRotatePoint',
				value: function setRotatePoint(x, y) {
					if (arguments.length == 2) {
						this.rotatePointX = x;
						this.rotatePointY = y;
					} else if (arguments.length == 1) {
						var _getPoint = this.getPoint(x);

						var _getPoint2 = _slicedToArray(_getPoint, 2);

						this.rotatePointX = _getPoint2[0];
						this.rotatePointY = _getPoint2[1];
					}
				}
			}, {
				key: 'setPositionPoint',
				value: function setPositionPoint(x, y) {
					if (arguments.length == 2) {
						this.positionPointX = x;
						this.positionPointY = y;
					} else if (arguments.length == 1) {
						var _getPoint3 = this.getPoint(x);

						var _getPoint4 = _slicedToArray(_getPoint3, 2);

						this.positionPointX = _getPoint4[0];
						this.positionPointY = _getPoint4[1];
					}
				}
			}, {
				key: 'setZoomPoint',
				value: function setZoomPoint(x, y) {
					if (arguments.length == 2) {
						this.zoomPointX = x;
						this.zoomPointY = y;
					} else if (arguments.length == 1) {
						var _getPoint5 = this.getPoint(x);

						var _getPoint6 = _slicedToArray(_getPoint5, 2);

						this.zoomPointX = _getPoint6[0];
						this.zoomPointY = _getPoint6[1];
					}
				}
			}, {
				key: 'setSkewPoint',
				value: function setSkewPoint(x, y) {
					if (arguments.length == 2) {
						this.skewPointX = x;
						this.skewPointY = y;
					} else if (arguments.length == 1) {
						var _getPoint7 = this.getPoint(x);

						var _getPoint8 = _slicedToArray(_getPoint7, 2);

						this.skewPointX = _getPoint8[0];
						this.skewPointY = _getPoint8[1];
					}
				}
			}]);

			return GraphStyle;
		}();
	},
	Graph: function Graph(host) {
		return function (_host$class$GraphEven3) {
			_inherits(Graph, _host$class$GraphEven3);

			function Graph() {
				_classCallCheck(this, Graph);

				//this.name=name;
				var _this6 = _possibleConstructorReturn(this, (Graph.__proto__ || Object.getPrototypeOf(Graph)).call(this));

				_this6.host = host;
				_this6.GID = _this6.host.generateGraphID();
				_this6.onoverCheck = true;
				Object.defineProperties(_this6, {
					style: { value: new host.class.GraphStyle(), configurable: true },
					childNodes: { value: [] },
					parentNode: { value: undefined, configurable: true }
				});
				return _this6;
			}

			_createClass(Graph, [{
				key: 'createShadow',
				value: function createShadow() {
					var shadow = Object.create(this);
					shadow.GID = this.host.generateGraphID();
					shadow.shadowParent = this;
					Object.defineProperties(shadow, {
						style: { value: new host.class.GraphStyle(this.style), configurable: true },
						parentNode: { value: undefined, configurable: true }
					});
					return shadow;
				}
				//add a graph to childNodes' end

			}, {
				key: 'appendChild',
				value: function appendChild(graph) {
					if (!(graph instanceof host.class.Graph)) throw new TypeError('graph is not a Graph instance');
					if (graph === this) throw new Error('can not add myself as a child');
					if (graph.parentNode !== this) {
						defProp(graph, 'parentNode', {
							value: this
						});
					} else {
						var i = this.findChild(graph);
						if (i >= 0) this.childNodes.splice(i, 1);
					}
					this.childNodes.push(graph);
				}
				//insert this graph after the graph

			}, {
				key: 'insertAfter',
				value: function insertAfter(graph) {
					if (!(graph instanceof host.class.Graph)) throw new TypeError('graph is not a Graph instance');
					if (graph === this) throw new Error('can not add myself as a child');
					var p = graph.parentNode,
					    io = void 0,
					    it = void 0;
					if (!p) throw new Error('no parentNode');
					it = p.findChild(graph);
					//if(it<0)return false;
					if (p !== this.parentNode) {
						defProp(this, 'parentNode', {
							value: p
						});
					} else {
						io = p.findChild(this);
						if (io >= 0) p.childNodes.splice(io, 1);
					}
					p.childNodes.splice(io < it ? it : it + 1, 0, this);
				}
				//insert this graph before the graph

			}, {
				key: 'insertBefore',
				value: function insertBefore(graph) {
					if (!(graph instanceof host.class.Graph)) throw new TypeError('graph is not a Graph instance');
					if (graph === this) throw new Error('can not add myself as a child');
					var p = graph.parentNode,
					    io = void 0,
					    it = void 0;
					if (!p) throw new Error('no parentNode');
					it = p.findChild(graph);
					//if(it<0)return false;
					if (p !== this.parentNode) {
						defProp(this, 'parentNode', {
							value: p
						});
					} else {
						io = p.findChild(this);
						if (io >= 0) p.childNodes.splice(io, 1);
					}
					p.childNodes.splice(io < it ? it - 1 : it, 0, this);
				}
			}, {
				key: 'findChild',
				value: function findChild(graph) {
					for (var i = this.childNodes.length; i--;) {
						if (this.childNodes[i] === graph) return i;
					}return -1;
				}
			}, {
				key: 'removeChild',
				value: function removeChild(graph) {
					var i = this.findChild(graph);
					if (i < 0) return;
					this.childNodes.splice(i, 1);
					defProp(this, 'parentNode', {
						value: undefined
					});
				}
			}, {
				key: 'checkIfOnOver',
				value: function checkIfOnOver() {
					var runHitRange = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
					var mode = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

					if (this.onoverCheck === false || !this.hitRange) return false;
					var m = this.host.stat.mouse;
					if (m.x === null) return false;
					if (this === this.host.tmp.onOverGraph) return true;
					runHitRange && this.hitRange(this.host.context);
					if (mode === 0 && this.host.debug.switch) {
						this.host.context.save();
						this.host.context.strokeStyle = 'yellow';
						this.host.context.stroke();
						this.host.context.restore();
					}
					if (this.host.context.isPointInPath(m.x, m.y)) {
						this.host.tmp.onOverGraph = this;
						return true;
					}
					return false;
				}
			}, {
				key: 'delete',
				value: function _delete() {
					//remove it from the related objects
					if (this.parentNode) this.parentNode.removeChild(this);
					if (this.host.stat.onover === this) this.host.stat.onover = null;
					if (this.host.stat.onfocus === this) this.host.stat.onfocus = null;
				}
			}]);

			return Graph;
		}(host.class.GraphEventEmitter);
	},
	FunctionGraph: function FunctionGraph(host) {
		return function (_host$class$Graph) {
			_inherits(FunctionGraph, _host$class$Graph);

			function FunctionGraph(drawer) {
				_classCallCheck(this, FunctionGraph);

				var _this7 = _possibleConstructorReturn(this, (FunctionGraph.__proto__ || Object.getPrototypeOf(FunctionGraph)).call(this));

				if (drawer instanceof Function) {
					_this7.drawer = drawer;
				}
				_this7.style.debugBorderColor = '#f00';
				return _this7;
			}

			_createClass(FunctionGraph, [{
				key: 'drawer',
				value: function drawer(ct) {
					//onover point check
					this.checkIfOnOver(true);
				}
			}, {
				key: 'hitRange',
				value: function hitRange(ct) {
					ct.beginPath();
					ct.rect(0, 0, this.style.width, this.style.height);
				}
			}]);

			return FunctionGraph;
		}(host.class.Graph);
	},
	ImageGraph: function ImageGraph(host) {
		return function (_host$class$FunctionG) {
			_inherits(ImageGraph, _host$class$FunctionG);

			function ImageGraph(image) {
				_classCallCheck(this, ImageGraph);

				var _this8 = _possibleConstructorReturn(this, (ImageGraph.__proto__ || Object.getPrototypeOf(ImageGraph)).call(this));

				if (image) _this8.use(image);
				_this8.useImageBitmap = true;
				_this8.style.debugBorderColor = '#0f0';
				return _this8;
			}

			_createClass(ImageGraph, [{
				key: 'use',
				value: function use(image) {
					var _this9 = this;

					if (image instanceof Image) {
						this.image = image;
						if (!image.complete) {
							image.addEventListener('load', function (e) {
								_this9.resetStyleSize();
								_this9._createBitmap();
							});
						} else {
							this.resetStyleSize();
							this._createBitmap();
						}
						return true;
					} else if (image instanceof HTMLCanvasElement) {
						this.image = image;
						this.resetStyleSize();
						return true;
					}
					throw new TypeError('Wrong image type');
				}
			}, {
				key: '_createBitmap',
				value: function _createBitmap() {
					var _this10 = this;

					if (this.useImageBitmap && typeof createImageBitmap === 'function') {
						//use ImageBitmap
						createImageBitmap(this.image).then(function (bitmap) {
							if (_this10._bitmap) _this10._bitmap.close();
							_this10._bitmap = bitmap;
						});
					}
				}
			}, {
				key: 'resetStyleSize',
				value: function resetStyleSize() {
					this.style.width = this.width;
					this.style.height = this.height;
				}
			}, {
				key: 'drawer',
				value: function drawer(ct) {
					//onover point check
					//ct.beginPath();
					ct.drawImage(this.useImageBitmap && this._bitmap ? this._bitmap : this.image, 0, 0);
					this.checkIfOnOver(true);
				}
			}, {
				key: 'hitRange',
				value: function hitRange(ct) {
					ct.beginPath();
					ct.rect(0, 0, this.style.width, this.style.height);
				}
			}, {
				key: 'width',
				get: function get() {
					if (this.image instanceof Image) return this.image.naturalWidth;
					if (this.image instanceof HTMLCanvasElement) return this.image.width;
					return 0;
				}
			}, {
				key: 'height',
				get: function get() {
					if (this.image instanceof Image) return this.image.naturalHeight;
					if (this.image instanceof HTMLCanvasElement) return this.image.height;
					return 0;
				}
			}]);

			return ImageGraph;
		}(host.class.FunctionGraph);
	},
	CanvasGraph: function CanvasGraph(host) {
		return function (_host$class$ImageGrap) {
			_inherits(CanvasGraph, _host$class$ImageGrap);

			function CanvasGraph() {
				_classCallCheck(this, CanvasGraph);

				var _this11 = _possibleConstructorReturn(this, (CanvasGraph.__proto__ || Object.getPrototypeOf(CanvasGraph)).call(this));

				_this11.image = document.createElement('canvas');
				_this11.context = _this11.image.getContext('2d');
				_this11.useImageBitmap = false;
				_this11.autoClear = true;
				return _this11;
			}

			_createClass(CanvasGraph, [{
				key: 'draw',
				value: function draw(func) {
					if (this.autoClear) this.context.clearRect(0, 0, this.width, this.height);
					func(this.context, this.canvas);
					if (this.useImageBitmap) this._createBitmap();
				}
			}, {
				key: 'width',
				set: function set(w) {
					this.image.width = w;
				}
			}, {
				key: 'height',
				set: function set(h) {
					this.image.height = h;
				}
			}]);

			return CanvasGraph;
		}(host.class.ImageGraph);
	},
	TextGraph: function TextGraph(host) {
		return function (_host$class$FunctionG2) {
			_inherits(TextGraph, _host$class$FunctionG2);

			function TextGraph() {
				var text = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

				_classCallCheck(this, TextGraph);

				//this._cache=null;
				var _this12 = _possibleConstructorReturn(this, (TextGraph.__proto__ || Object.getPrototypeOf(TextGraph)).call(this));

				_this12._fontString = '';
				_this12._renderList = null;
				_this12.autoSize = true;
				_this12.font = Object.create(host.default.font);
				_this12.realtimeRender = false;
				_this12.useImageBitmap = true;
				_this12.style.debugBorderColor = '#00f';
				_this12.text = text;
				_this12._renderToCache = _this12._renderToCache.bind(_this12);
				defProp(_this12, '_cache', { configurable: true });
				return _this12;
			}

			_createClass(TextGraph, [{
				key: 'prepare',
				value: function prepare() {
					var async = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
					//prepare text details
					if (!this._cache && !this.realtimeRender) {
						defProp(this, '_cache', { value: document.createElement("canvas") });
					}
					var font = "";
					this.font.fontStyle && (font = this.font.fontStyle);
					this.font.fontVariant && (font = font + ' ' + this.font.fontVariant);
					this.font.fontWeight && (font = font + ' ' + this.font.fontWeight);
					font = font + ' ' + this.font.fontSize + 'px';
					this.font.fontFamily && (font = font + ' ' + this.font.fontFamily);
					this._fontString = font;

					if (this.realtimeRender) return;
					var imgobj = this._cache,
					    ct = imgobj.ctx2d || (imgobj.ctx2d = imgobj.getContext("2d"));
					ct.font = font;
					this._renderList = this.text.split(/\n/g);
					this.estimatePadding = Math.max(this.font.shadowBlur + 5 + Math.max(Math.abs(this.font.shadowOffsetY), Math.abs(this.font.shadowOffsetX)), this.font.strokeWidth + 3);
					if (this.autoSize) {
						var w = 0,
						    tw = void 0,
						    lh = typeof this.font.lineHeigh === 'number' ? this.font.lineHeigh : this.font.fontSize;
						for (var i = this._renderList.length; i--;) {
							tw = ct.measureText(this._renderList[i]).width;
							tw > w && (w = tw); //max
						}
						imgobj.width = (this.style.width = w) + this.estimatePadding * 2;
						imgobj.height = (this.style.height = this._renderList.length * lh) + (lh < this.font.fontSize ? this.font.fontSize * 2 : 0) + this.estimatePadding * 2;
					} else {
						imgobj.width = this.style.width;
						imgobj.height = this.style.height;
					}
					ct.translate(this.estimatePadding, this.estimatePadding);
					if (async) {
						requestIdleCallback(this._renderToCache);
					} else {
						this._renderToCache();
					}
				}
			}, {
				key: '_renderToCache',
				value: function _renderToCache() {
					var _this13 = this;

					this.render(this._cache.ctx2d);
					if (this.useImageBitmap && typeof createImageBitmap === 'function') {
						//use ImageBitmap
						createImageBitmap(this._cache).then(function (bitmap) {
							if (_this13._bitmap) _this13._bitmap.close();
							_this13._bitmap = bitmap;
						});
					}
				}
			}, {
				key: 'render',
				value: function render(ct) {
					//render text
					if (!this._renderList) return;
					ct.save();
					ct.font = this._fontString; //set font
					ct.textBaseline = 'top';
					ct.lineWidth = this.font.strokeWidth;
					ct.fillStyle = this.font.color;
					ct.strokeStyle = this.font.strokeColor;
					ct.shadowBlur = this.font.shadowBlur;
					ct.shadowColor = this.font.shadowColor;
					ct.shadowOffsetX = this.font.shadowOffsetX;
					ct.shadowOffsetY = this.font.shadowOffsetY;
					ct.textAlign = this.font.textAlign;
					var lh = typeof this.font.lineHeigh === 'number' ? this.font.lineHeigh : this.font.fontSize,
					    x = void 0;
					switch (this.font.textAlign) {
						case 'left':case 'start':
							{
								x = 0;break;
							}
						case 'center':
							{
								x = this.style.width / 2;break;
							}
						case 'right':case 'end':
							{
								x = this.style.width;
							}
					}

					for (var i = this._renderList.length; i--;) {
						this.font.strokeWidth && ct.strokeText(this._renderList[i], x, lh * i);
						this.font.fill && ct.fillText(this._renderList[i], x, lh * i);
					}
					ct.restore();
				}
			}, {
				key: 'drawer',
				value: function drawer(ct) {
					//ct.beginPath();
					if (this.realtimeRender) {
						//realtime render the text
						//onover point check
						this.checkIfOnOver(true);
						this.render(ct);
					} else {
						//draw the cache
						if (!this._cache) {
							this.prepare();
						}
						ct.drawImage(this.useImageBitmap && this._bitmap ? this._bitmap : this._cache, -this.estimatePadding, -this.estimatePadding);
						this.checkIfOnOver(true);
					}
				}
			}, {
				key: 'hitRange',
				value: function hitRange(ct) {
					ct.beginPath();
					ct.rect(0, 0, this.style.width, this.style.height);
				}
			}]);

			return TextGraph;
		}(host.class.FunctionGraph);
	}
};

function addEvents(target) {
	var events = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

	for (var e in events) {
		target.addEventListener(e, events[e]);
	}
}

function multiplyMatrix(m1, m2, r) {
	r[0] = m1[0] * m2[0] + m1[1] * m2[3];
	r[1] = m1[0] * m2[1] + m1[1] * m2[4];
	r[2] = m1[0] * m2[2] + m1[1] * m2[5] + m1[2];
	r[3] = m1[3] * m2[0] + m1[4] * m2[3];
	r[4] = m1[3] * m2[1] + m1[4] * m2[4];
	r[5] = m1[3] * m2[2] + m1[4] * m2[5] + m1[5];
}

//code from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
if (typeof Object.assign != 'function') Object.assign = function (target) {
	'use strict';
	// We must check against these specific cases.

	if (target === undefined || target === null) {
		throw new TypeError('Cannot convert undefined or null to object');
	}
	var output = Object(target);
	for (var index = 1; index < arguments.length; index++) {
		var source = arguments[index];
		if (source !== undefined && source !== null) {
			for (var nextKey in source) {
				if (source.hasOwnProperty(nextKey)) {
					output[nextKey] = source[nextKey];
				}
			}
		}
	}
	return output;
};

if (!Float32Array.__proto__.from) {
	(function () {
		var copy_data = [];
		Float32Array.__proto__.from = function (obj, func, thisObj) {
			var typedArrayClass = Float32Array.__proto__;
			if (typeof this !== "function") throw new TypeError("# is not a constructor");
			if (this.__proto__ !== typedArrayClass) throw new TypeError("this is not a typed array.");
			func = func || function (elem) {
				return elem;
			};
			if (typeof func !== "function") throw new TypeError("specified argument is not a function");
			obj = Object(obj);
			if (!obj["length"]) return new this(0);
			copy_data.length = 0;
			for (var i = 0; i < obj.length; i++) {
				copy_data.push(obj[i]);
			}
			copy_data = copy_data.map(func, thisObj);
			var typed_array = new this(copy_data.length);
			for (var _i = 0; _i < typed_array.length; _i++) {
				typed_array[_i] = copy_data[_i];
			}
			return typed_array;
		};
	})();
}

(function () {
	if (window.requestAnimationFrame) return;
	var lastTime = 0;
	var vendors = ['ms', 'moz', 'webkit', 'o'];
	for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
		window.cancelRequestAnimationFrame = window[vendors[x] + 'CancelRequestAnimationFrame'];
	}
	if (!window.requestAnimationFrame) window.requestAnimationFrame = function (callback, element, interval) {
		var currTime = Date.now();
		var timeToCall = interval || Math.max(0, 1000 / 60 - (currTime - lastTime));
		callback(0);
		var id = window.setTimeout(function () {
			callback(currTime + timeToCall);
		}, timeToCall);
		lastTime = currTime + timeToCall;
		return id;
	};
	if (!window.cancelAnimationFrame) window.cancelAnimationFrame = function (id) {
		clearTimeout(id);
	};
})();

var requestIdleCallback = window.requestIdleCallback || setImmediate;

exports.default = CanvasObjLibrary;
exports.CanvasObjLibrary = CanvasObjLibrary;
exports.requestIdleCallback = requestIdleCallback;

},{"../lib/promise/promise.js":1,"../lib/setImmediate/setImmediate.js":2}],4:[function(require,module,exports){
'use strict';

var _CanvasObjLibrary = require('./CanvasObjLibrary.js');

var _CanvasObjLibrary2 = _interopRequireDefault(_CanvasObjLibrary);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

if (!window.CanvasObjLibrary) window.CanvasObjLibrary = _CanvasObjLibrary2.default;

},{"./CanvasObjLibrary.js":3}],5:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}]},{},[4])

//# sourceMappingURL=CanvasObjLibrary.js.map
