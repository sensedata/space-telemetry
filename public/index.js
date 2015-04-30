/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _interopRequireDefault = __webpack_require__(2)["default"];
	
	var _App = __webpack_require__(1);
	
	var _App2 = _interopRequireDefault(_App);
	
	_App2["default"].render();

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _createClass = __webpack_require__(6)["default"];
	
	var _classCallCheck = __webpack_require__(7)["default"];
	
	var _Object$defineProperty = __webpack_require__(12)["default"];
	
	var _interopRequireDefault = __webpack_require__(2)["default"];
	
	_Object$defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _import = __webpack_require__(3);
	
	var _import2 = _interopRequireDefault(_import);
	
	var _Flux = __webpack_require__(13);
	
	var _Flux2 = _interopRequireDefault(_Flux);
	
	var _IO = __webpack_require__(4);
	
	var _IO2 = _interopRequireDefault(_IO);
	
	var _React = __webpack_require__(5);
	
	var _React2 = _interopRequireDefault(_React);
	
	// import BulletChart from "./views/bullet_chart";
	
	var _Readout = __webpack_require__(8);
	
	var _Readout2 = _interopRequireDefault(_Readout);
	
	var _SparklineChart = __webpack_require__(9);
	
	var _SparklineChart2 = _interopRequireDefault(_SparklineChart);
	
	var _Telemetry = __webpack_require__(10);
	
	var _Telemetry2 = _interopRequireDefault(_Telemetry);
	
	var _TelemetryIndex = __webpack_require__(11);
	
	var _TelemetryIndex2 = _interopRequireDefault(_TelemetryIndex);
	
	var App = (function () {
	  function App() {
	    _classCallCheck(this, App);
	
	    this.dispatcher = new _Flux2["default"].Dispatcher();
	    this.socket = _IO2["default"]();
	    this.telemetry = new _Telemetry2["default"]({ dispatcher: this.dispatcher });
	  }
	
	  _createClass(App, [{
	    key: "render",
	    value: function render() {
	      var _this = this;
	
	      var views = {
	        // "bullet-chart": BulletChart,
	        readout: _Readout2["default"],
	        "sparkline-chart": _SparklineChart2["default"]
	      };
	
	      _import2["default"].forEach(views, function (view, className) {
	        _import2["default"].forEach(document.getElementsByClassName(className), function (e) {
	          var telemetryId = e.dataset.telemetryId;
	          if (!telemetryId) {
	            return;
	          }
	
	          var telemetryNumber = _TelemetryIndex2["default"].number(telemetryId);
	          var props = {
	            store: _this.telemetry.getStore(telemetryNumber),
	            target: e
	          };
	
	          _React2["default"].render(_React2["default"].createFactory(view)(props), e);
	        });
	      });
	    }
	  }]);
	
	  return App;
	})();
	
	exports["default"] = new App();
	module.exports = exports["default"];

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	exports["default"] = function (obj) {
	  return obj && obj.__esModule ? obj : {
	    "default": obj
	  };
	};
	
	exports.__esModule = true;

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = _;

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = io;

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = React;

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _Object$defineProperty = __webpack_require__(12)["default"];
	
	exports["default"] = (function () {
	  function defineProperties(target, props) {
	    for (var i = 0; i < props.length; i++) {
	      var descriptor = props[i];
	      descriptor.enumerable = descriptor.enumerable || false;
	      descriptor.configurable = true;
	      if ("value" in descriptor) descriptor.writable = true;
	
	      _Object$defineProperty(target, descriptor.key, descriptor);
	    }
	  }
	
	  return function (Constructor, protoProps, staticProps) {
	    if (protoProps) defineProperties(Constructor.prototype, protoProps);
	    if (staticProps) defineProperties(Constructor, staticProps);
	    return Constructor;
	  };
	})();
	
	exports.__esModule = true;

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	exports["default"] = function (instance, Constructor) {
	  if (!(instance instanceof Constructor)) {
	    throw new TypeError("Cannot call a class as a function");
	  }
	};
	
	exports.__esModule = true;

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _inherits = __webpack_require__(17)["default"];
	
	var _createClass = __webpack_require__(6)["default"];
	
	var _classCallCheck = __webpack_require__(7)["default"];
	
	var _Object$defineProperty = __webpack_require__(12)["default"];
	
	var _interopRequireDefault = __webpack_require__(2)["default"];
	
	_Object$defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _import = __webpack_require__(3);
	
	var _import2 = _interopRequireDefault(_import);
	
	var _Moment = __webpack_require__(14);
	
	var _Moment2 = _interopRequireDefault(_Moment);
	
	var _React = __webpack_require__(5);
	
	var _React2 = _interopRequireDefault(_React);
	
	var _BasicView2 = __webpack_require__(20);
	
	var _BasicView3 = _interopRequireDefault(_BasicView2);
	
	var _StatusIndex = __webpack_require__(21);
	
	var _StatusIndex2 = _interopRequireDefault(_StatusIndex);
	
	var Readout = (function (_BasicView) {
	  function Readout() {
	    _classCallCheck(this, Readout);
	
	    if (_BasicView != null) {
	      _BasicView.apply(this, arguments);
	    }
	  }
	
	  _inherits(Readout, _BasicView);
	
	  _createClass(Readout, [{
	    key: "formatDecimal",
	    value: function formatDecimal(raw) {
	      var formatted = raw.toFixed(this.props.target.dataset.scale);
	      if (this.props.target.dataset.zeroPad === "true") {
	        formatted = _import2["default"].leftPad(formatted, this.props.target.dataset.precision, "0");
	      }
	      return formatted;
	    }
	  }, {
	    key: "formatText",
	    value: function formatText(textKey) {
	      var values = _StatusIndex2["default"].get(this.props.telemetryNum);
	      var value = undefined;
	      if (values) {
	        value = values[textKey];
	      }
	
	      return typeof value === "undefined" ? "Unknown" : value;
	    }
	  }, {
	    key: "formatTimestamp",
	    value: function formatTimestamp(unixTime) {
	      return unixTime === 0 ? "-" : _Moment2["default"].unix(unixTime).utc().format("HH:mm:ss YYYY.MM.DD");
	    }
	  }, {
	    key: "renderWithState",
	    value: function renderWithState() {
	      var datum = this.state.data[0];
	
	      var value = undefined;
	      if (this.props.target.classList.contains("text")) {
	        value = this.formatText(datum.v);
	      } else if (this.props.target.classList.contains("timestamp")) {
	        value = this.formatTimestamp(datum.v);
	      } else if (this.props.target.classList.contains("decimal")) {
	        value = this.formatDecimal(datum.v);
	      }
	
	      return _React2["default"].createElement(
	        "span",
	        null,
	        value
	      );
	    }
	  }]);
	
	  return Readout;
	})(_BasicView3["default"]);
	
	exports["default"] = Readout;
	module.exports = exports["default"];

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _inherits = __webpack_require__(17)["default"];
	
	var _get = __webpack_require__(18)["default"];
	
	var _createClass = __webpack_require__(6)["default"];
	
	var _classCallCheck = __webpack_require__(7)["default"];
	
	var _Object$defineProperty = __webpack_require__(12)["default"];
	
	var _interopRequireDefault = __webpack_require__(2)["default"];
	
	_Object$defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _$ = __webpack_require__(15);
	
	var _$2 = _interopRequireDefault(_$);
	
	var _D3 = __webpack_require__(16);
	
	var _D32 = _interopRequireDefault(_D3);
	
	var _React = __webpack_require__(5);
	
	var _React2 = _interopRequireDefault(_React);
	
	var _BasicView2 = __webpack_require__(20);
	
	var _BasicView3 = _interopRequireDefault(_BasicView2);
	
	var SparklineChart = (function (_BasicView) {
	  function SparklineChart(props) {
	    _classCallCheck(this, SparklineChart);
	
	    _get(Object.getPrototypeOf(SparklineChart.prototype), "constructor", this).call(this, props);
	
	    var jTarget = _$2["default"](props.target);
	    this.height = jTarget.height();
	    this.width = jTarget.width();
	  }
	
	  _inherits(SparklineChart, _BasicView);
	
	  _createClass(SparklineChart, [{
	    key: "availablePoints",
	    value: function availablePoints() {
	      return Math.floor(this.width / 2);
	    }
	  }, {
	    key: "renderWithState",
	    value: function renderWithState() {
	      var height = this.height - 4;
	      var width = this.width - 2;
	
	      var line = _D32["default"].svg.line();
	      line.x(function (d) {
	        return x(d.t);
	      });
	      line.y(function (d) {
	        return y(d.v);
	      });
	
	      var x = _D32["default"].scale.linear().range([0, width]);
	      x.domain(_D32["default"].extent(this.state.data, function (d) {
	        return d.t;
	      }));
	
	      var y = _D32["default"].scale.linear().range([height, 0]);
	      y.domain(_D32["default"].extent(this.state.data, function (d) {
	        return d.v;
	      }));
	
	      var last = this.state.data[this.state.data.length - 1];
	
	      return _React2["default"].createElement(
	        "svg",
	        { className: "sparkline", height: height - 1, width: width },
	        _React2["default"].createElement(
	          "g",
	          { transform: "translate(0, 2)" },
	          _React2["default"].createElement("path", { d: line(this.state.data) }),
	          _React2["default"].createElement("circle", { cx: x(last.t), cy: y(last.v), r: "1.5" })
	        )
	      );
	    }
	  }]);
	
	  return SparklineChart;
	})(_BasicView3["default"]);
	
	exports["default"] = SparklineChart;
	module.exports = exports["default"];

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _createClass = __webpack_require__(6)["default"];
	
	var _classCallCheck = __webpack_require__(7)["default"];
	
	var _Object$defineProperty = __webpack_require__(12)["default"];
	
	var _interopRequireDefault = __webpack_require__(2)["default"];
	
	_Object$defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _App = __webpack_require__(1);
	
	var _App2 = _interopRequireDefault(_App);
	
	var _TelemetryStore = __webpack_require__(19);
	
	var _TelemetryStore2 = _interopRequireDefault(_TelemetryStore);
	
	var Telemetry = (function () {
	  function Telemetry(props) {
	    _classCallCheck(this, Telemetry);
	
	    this.props = props;
	    this.stores = [];
	    this.listeners = [];
	  }
	
	  _createClass(Telemetry, [{
	    key: "createStore",
	    value: function createStore(telemetryNumber) {
	      var store = new _TelemetryStore2["default"]({
	        telemetryNumber: telemetryNumber,
	        dispatcher: this.props.dispatcher
	      });
	
	      this.stores[telemetryNumber] = store;
	      return store;
	    }
	  }, {
	    key: "listenToServer",
	    value: function listenToServer(telemetryNumber) {
	      this.listeners[telemetryNumber] = _App2["default"].socket.on(telemetryNumber, function (data) {
	        _App2["default"].dispatcher.dispatch({
	          actionType: "new-data",
	          telemetryNumber: telemetryNumber,
	          data: data
	        });
	      });
	      _App2["default"].socket.emit(telemetryNumber, 1000000000, 100);
	    }
	  }, {
	    key: "getStore",
	    value: function getStore(telemetryNumber) {
	      var store = this.stores[telemetryNumber];
	      if (typeof store === "undefined") {
	        store = this.createStore(telemetryNumber);
	      }
	
	      if (!this.listeners[telemetryNumber]) {
	        this.listenToServer(telemetryNumber);
	      }
	
	      return store;
	    }
	  }]);
	
	  return Telemetry;
	})();
	
	exports["default"] = Telemetry;
	module.exports = exports["default"];

/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _createClass = __webpack_require__(6)["default"];
	
	var _classCallCheck = __webpack_require__(7)["default"];
	
	var _Object$defineProperty = __webpack_require__(12)["default"];
	
	_Object$defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var telemetryIds = ["AIRLOCK000001", "AIRLOCK000002", "AIRLOCK000003", "AIRLOCK000004", "AIRLOCK000005", "AIRLOCK000006", "AIRLOCK000007", "AIRLOCK000008", "AIRLOCK000009", "AIRLOCK000010", "AIRLOCK000011", "AIRLOCK000012", "AIRLOCK000013", "AIRLOCK000014", "AIRLOCK000015", "AIRLOCK000016", "AIRLOCK000017", "AIRLOCK000018", "AIRLOCK000019", "AIRLOCK000020", "AIRLOCK000021", "AIRLOCK000022", "AIRLOCK000023", "AIRLOCK000024", "AIRLOCK000025", "AIRLOCK000026", "AIRLOCK000027", "AIRLOCK000028", "AIRLOCK000029", "AIRLOCK000030", "AIRLOCK000031", "AIRLOCK000032", "AIRLOCK000033", "AIRLOCK000034", "AIRLOCK000035", "AIRLOCK000036", "AIRLOCK000037", "AIRLOCK000038", "AIRLOCK000039", "AIRLOCK000040", "AIRLOCK000041", "AIRLOCK000042", "AIRLOCK000043", "AIRLOCK000044", "AIRLOCK000045", "AIRLOCK000046", "AIRLOCK000047", "AIRLOCK000048", "AIRLOCK000049", "AIRLOCK000050", "AIRLOCK000051", "AIRLOCK000052", "AIRLOCK000053", "AIRLOCK000054", "AIRLOCK000055", "AIRLOCK000056", "AIRLOCK000057", "AIRLOCK000058", "NODE1000001", "NODE1000002", "NODE2000001", "NODE2000002", "NODE2000003", "NODE2000004", "NODE2000005", "NODE2000006", "NODE2000007", "NODE3000001", "NODE3000002", "NODE3000003", "NODE3000004", "NODE3000005", "NODE3000006", "NODE3000007", "NODE3000008", "NODE3000009", "NODE3000010", "NODE3000011", "NODE3000012", "NODE3000013", "NODE3000014", "NODE3000015", "NODE3000016", "NODE3000017", "NODE3000018", "NODE3000019", "NODE3000020", "P1000001", "P1000002", "P1000003", "P1000004", "P1000005", "P1000006", "P1000007", "P1000008", "P1000009", "P3000001", "P3000002", "P4000001", "P4000002", "P4000003", "P4000004", "P4000005", "P4000006", "P4000007", "P4000008", "P6000001", "P6000002", "P6000003", "P6000004", "P6000005", "P6000006", "P6000007", "P6000008", "RUSSEG000001", "RUSSEG000002", "RUSSEG000003", "RUSSEG000004", "RUSSEG000005", "RUSSEG000006", "RUSSEG000007", "RUSSEG000008", "RUSSEG000009", "RUSSEG000010", "RUSSEG000011", "RUSSEG000012", "RUSSEG000013", "RUSSEG000014", "RUSSEG000015", "RUSSEG000016", "RUSSEG000017", "RUSSEG000018", "RUSSEG000019", "RUSSEG000020", "RUSSEG000021", "RUSSEG000022", "RUSSEG000023", "RUSSEG000024", "RUSSEG000025", "S0000001", "S0000002", "S0000003", "S0000004", "S0000005", "S0000006", "S0000007", "S0000008", "S0000009", "S0000010", "S0000011", "S0000012", "S0000013", "S1000001", "S1000002", "S1000003", "S1000004", "S1000005", "S1000006", "S1000007", "S1000008", "S1000009", "S3000001", "S3000002", "S4000001", "S4000002", "S4000003", "S4000004", "S4000005", "S4000006", "S4000007", "S4000008", "S6000001", "S6000002", "S6000003", "S6000004", "S6000005", "S6000006", "S6000007", "S6000008", "USLAB000001", "USLAB000002", "USLAB000003", "USLAB000004", "USLAB000005", "USLAB000006", "USLAB000007", "USLAB000008", "USLAB000009", "USLAB000010", "USLAB000011", "USLAB000012", "USLAB000013", "USLAB000014", "USLAB000015", "USLAB000016", "USLAB000017", "USLAB000018", "USLAB000019", "USLAB000020", "USLAB000021", "USLAB000022", "USLAB000023", "USLAB000024", "USLAB000025", "USLAB000026", "USLAB000027", "USLAB000028", "USLAB000029", "USLAB000030", "USLAB000031", "USLAB000032", "USLAB000033", "USLAB000034", "USLAB000035", "USLAB000036", "USLAB000037", "USLAB000038", "USLAB000039", "USLAB000040", "USLAB000041", "USLAB000042", "USLAB000043", "USLAB000044", "USLAB000045", "USLAB000046", "USLAB000047", "USLAB000048", "USLAB000049", "USLAB000050", "USLAB000051", "USLAB000052", "USLAB000053", "USLAB000054", "USLAB000055", "USLAB000056", "USLAB000057", "USLAB000058", "USLAB000059", "USLAB000060", "USLAB000061", "USLAB000062", "USLAB000063", "USLAB000064", "USLAB000065", "USLAB000066", "USLAB000067", "USLAB000068", "USLAB000069", "USLAB000070", "USLAB000071", "USLAB000072", "USLAB000073", "USLAB000074", "USLAB000075", "USLAB000076", "USLAB000077", "USLAB000078", "USLAB000079", "USLAB000080", "USLAB000081", "USLAB000082", "USLAB000083", "USLAB000084", "USLAB000085", "USLAB000086", "USLAB000087", "USLAB000088", "USLAB000089", "USLAB000090", "USLAB000091", "USLAB000092", "USLAB000093", "USLAB000094", "USLAB000095", "USLAB000096", "USLAB000097", "USLAB000098", "USLAB000099", "USLAB000100", "USLAB000101", "USLAB000102", "Z1000001", "Z1000002", "Z1000003", "Z1000004", "Z1000005", "Z1000006", "Z1000007", "Z1000008", "Z1000009", "Z1000010", "Z1000011", "Z1000012", "Z1000013", "Z1000014", "Z1000015", "TIME_000001", "STATUS"];
	
	var telemetryNumbers = {};
	telemetryIds.forEach(function (k, i) {
	  telemetryNumbers[k] = i;
	});
	
	var TelemetryIndex = (function () {
	  function TelemetryIndex() {
	    _classCallCheck(this, TelemetryIndex);
	  }
	
	  _createClass(TelemetryIndex, null, [{
	    key: "id",
	    value: function id(number) {
	      return telemetryIds[number];
	    }
	  }, {
	    key: "number",
	    value: function number(id) {
	      return telemetryNumbers[id];
	    }
	  }]);
	
	  return TelemetryIndex;
	})();
	
	exports["default"] = TelemetryIndex;
	module.exports = exports["default"];

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(28), __esModule: true };

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Copyright (c) 2014-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 */
	
	module.exports.Dispatcher = __webpack_require__(22)


/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = moment;

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = jQuery;

/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = d3;

/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _Object$create = __webpack_require__(24)["default"];
	
	exports["default"] = function (subClass, superClass) {
	  if (typeof superClass !== "function" && superClass !== null) {
	    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
	  }
	
	  subClass.prototype = _Object$create(superClass && superClass.prototype, {
	    constructor: {
	      value: subClass,
	      enumerable: false,
	      writable: true,
	      configurable: true
	    }
	  });
	  if (superClass) subClass.__proto__ = superClass;
	};
	
	exports.__esModule = true;

/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _Object$getOwnPropertyDescriptor = __webpack_require__(25)["default"];
	
	exports["default"] = function get(_x, _x2, _x3) {
	  var _again = true;
	
	  _function: while (_again) {
	    desc = parent = getter = undefined;
	    _again = false;
	    var object = _x,
	        property = _x2,
	        receiver = _x3;
	
	    var desc = _Object$getOwnPropertyDescriptor(object, property);
	
	    if (desc === undefined) {
	      var parent = Object.getPrototypeOf(object);
	
	      if (parent === null) {
	        return undefined;
	      } else {
	        _x = parent;
	        _x2 = property;
	        _x3 = receiver;
	        _again = true;
	        continue _function;
	      }
	    } else if ("value" in desc) {
	      return desc.value;
	    } else {
	      var getter = desc.get;
	
	      if (getter === undefined) {
	        return undefined;
	      }
	
	      return getter.call(receiver);
	    }
	  }
	};
	
	exports.__esModule = true;

/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _inherits = __webpack_require__(17)["default"];
	
	var _get = __webpack_require__(18)["default"];
	
	var _createClass = __webpack_require__(6)["default"];
	
	var _classCallCheck = __webpack_require__(7)["default"];
	
	var _Object$defineProperty = __webpack_require__(12)["default"];
	
	var _Object$assign = __webpack_require__(26)["default"];
	
	var _Symbol = __webpack_require__(27)["default"];
	
	var _interopRequireDefault = __webpack_require__(2)["default"];
	
	_Object$defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _Crossfilter = __webpack_require__(23);
	
	var _Crossfilter2 = _interopRequireDefault(_Crossfilter);
	
	var _EventEmitter2 = __webpack_require__(30);
	
	var _EventEmitter3 = _interopRequireDefault(_EventEmitter2);
	
	var TelemetryStore = (function (_EventEmitter) {
	  function TelemetryStore(props) {
	    _classCallCheck(this, TelemetryStore);
	
	    _get(Object.getPrototypeOf(TelemetryStore.prototype), "constructor", this).call(this, props);
	
	    this.props = props;
	    this.size = 0;
	
	    this.telemetry = _Crossfilter2["default"]();
	    this.indexDimension = this.telemetry.dimension(function (d) {
	      return d.i;
	    });
	    this.timeDimension = this.telemetry.dimension(function (d) {
	      return d.t;
	    });
	
	    this.dispatchToken = props.dispatcher.register(this.dispatch.bind(this));
	  }
	
	  _inherits(TelemetryStore, _EventEmitter);
	
	  _createClass(TelemetryStore, [{
	    key: "add",
	    value: function add(data) {
	      var _this = this;
	
	      var emit = arguments[1] === undefined ? true : arguments[1];
	
	      var indexed = data.map(function (d) {
	        return _Object$assign({ i: _this.size++ }, d);
	      });
	      this.telemetry.add(indexed);
	      this.prune(false);
	
	      if (emit) {
	        this.emit(TelemetryStore.CHANGE_EVENT_KEY);
	      }
	    }
	  }, {
	    key: "dispatch",
	    value: function dispatch(payload) {
	      if (payload.telemetryNum === this.props.telemetryNum && payload.actionType === "new-data") {
	        // this.props.dispatcher.waitFor([this.dispatchToken]);
	        this.add(payload.data);
	      }
	    }
	  }, {
	    key: "get",
	    value: function get() {
	      return this.timeDimension.top(100);
	    }
	  }, {
	    key: "prune",
	    value: function prune() {
	      var _this2 = this;
	
	      var emit = arguments[0] === undefined ? true : arguments[0];
	
	      this.indexDimension.filter(function (i) {
	        return i < _this2.size - _this2.props.maxSize;
	      });
	      this.indexDimension.remove();
	
	      if (emit) {
	        this.emit(TelemetryStore.CHANGE_EVENT_KEY);
	      }
	    }
	  }]);
	
	  return TelemetryStore;
	})(_EventEmitter3["default"]);
	
	TelemetryStore.CHANGE_EVENT_KEY = _Symbol("TelemetryStore.CHANGE_EVENT_KEY");
	
	exports["default"] = TelemetryStore;
	module.exports = exports["default"];

/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _inherits = __webpack_require__(17)["default"];
	
	var _createClass = __webpack_require__(6)["default"];
	
	var _classCallCheck = __webpack_require__(7)["default"];
	
	var _Object$defineProperty = __webpack_require__(12)["default"];
	
	var _interopRequireDefault = __webpack_require__(2)["default"];
	
	_Object$defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _React = __webpack_require__(5);
	
	var _React2 = _interopRequireDefault(_React);
	
	var _TelemetryStore = __webpack_require__(19);
	
	var _TelemetryStore2 = _interopRequireDefault(_TelemetryStore);
	
	var BasicView = (function (_React$Component) {
	  function BasicView() {
	    _classCallCheck(this, BasicView);
	
	    if (_React$Component != null) {
	      _React$Component.apply(this, arguments);
	    }
	  }
	
	  _inherits(BasicView, _React$Component);
	
	  _createClass(BasicView, [{
	    key: "componentDidMount",
	    value: function componentDidMount() {
	      this.props.store.addListener(_TelemetryStore2["default"].CHANGE_EVENT_KEY, this.storeChanged.bind(this));
	    }
	  }, {
	    key: "componentWillUnmount",
	    value: function componentWillUnmount() {
	      this.props.store.removeListener(_TelemetryStore2["default"].CHANGE_EVENT_KEY, this.storeChanged.bind(this));
	    }
	  }, {
	    key: "availablePoints",
	    value: function availablePoints() {
	      return 1;
	    }
	  }, {
	    key: "storeChanged",
	    value: function storeChanged() {
	      this.setState({
	        data: this.props.store.get(this.availablePoints()).reverse()
	      });
	    }
	  }, {
	    key: "render",
	    value: function render() {
	      if (!this.state) {
	        return false;
	      }
	      return this.renderWithState();
	    }
	  }]);
	
	  return BasicView;
	})(_React2["default"].Component);
	
	exports["default"] = BasicView;
	module.exports = exports["default"];

/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _createClass = __webpack_require__(6)["default"];
	
	var _classCallCheck = __webpack_require__(7)["default"];
	
	var _Object$defineProperty = __webpack_require__(12)["default"];
	
	var _interopRequireDefault = __webpack_require__(2)["default"];
	
	_Object$defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _TelemetryIndex = __webpack_require__(11);
	
	var _TelemetryIndex2 = _interopRequireDefault(_TelemetryIndex);
	
	var gpsStatuses = {
	  0: "Doing position fixes",
	  1: "SV timing",
	  2: "Approximate timing",
	  3: "GPS time",
	  4: "Need initialization",
	  5: "GDOP needed",
	  6: "Bad timing",
	  7: "No usable satellite",
	  8: "Track 1 satellite",
	  9: "Track 2 satellite",
	  10: "Track 3 satellite",
	  11: "Bad integrity",
	  12: "No vel available",
	  13: "Unusable fix"
	};
	
	var statusById = {
	  STATUS: {
	    0: "Disconnected",
	    1: "Connected"
	  },
	  USLAB000012: {
	    0: "Default",
	    1: "Wait",
	    2: "Reserved",
	    3: "Standby",
	    4: "CMG attitude control",
	    5: "CMG thruster assist",
	    6: "User data generation",
	    7: "Free drift"
	  },
	  USLAB000013: {
	    0: "None",
	    1: "GPS 1",
	    2: "GPS 2",
	    3: "Russian",
	    4: "Ku band"
	  },
	  USLAB000014: {
	    0: "None",
	    1: "RGA 1",
	    2: "RGA 2",
	    3: "Russian"
	  },
	  USLAB000016: {
	    0: "Attitude hold",
	    1: "Momentum management"
	  },
	  USLAB000017: {
	    0: "LVLH",
	    1: "J2000",
	    2: "XPOP"
	  },
	  USLAB000043: gpsStatuses,
	  USLAB000044: gpsStatuses,
	  USLAB000086: {
	    1: "Standard",
	    2: "Microgravity",
	    4: "Reboost",
	    8: "Proximity Ops",
	    16: "External Ops",
	    32: "Survival",
	    64: "Assured Safe Crew Return"
	  }
	};
	
	var statuses = {};
	for (var id in statusById) {
	  statuses[_TelemetryIndex2["default"].number(id)] = statusById[id];
	}
	
	var StatusIndex = (function () {
	  function StatusIndex() {
	    _classCallCheck(this, StatusIndex);
	  }
	
	  _createClass(StatusIndex, null, [{
	    key: "get",
	    value: function get(telemetryNumber) {
	      return statuses[telemetryNumber];
	    }
	  }]);
	
	  return StatusIndex;
	})();
	
	exports["default"] = StatusIndex;
	module.exports = exports["default"];

/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	/*
	 * Copyright (c) 2014, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule Dispatcher
	 * @typechecks
	 */
	
	"use strict";
	
	var invariant = __webpack_require__(29);
	
	var _lastID = 1;
	var _prefix = 'ID_';
	
	/**
	 * Dispatcher is used to broadcast payloads to registered callbacks. This is
	 * different from generic pub-sub systems in two ways:
	 *
	 *   1) Callbacks are not subscribed to particular events. Every payload is
	 *      dispatched to every registered callback.
	 *   2) Callbacks can be deferred in whole or part until other callbacks have
	 *      been executed.
	 *
	 * For example, consider this hypothetical flight destination form, which
	 * selects a default city when a country is selected:
	 *
	 *   var flightDispatcher = new Dispatcher();
	 *
	 *   // Keeps track of which country is selected
	 *   var CountryStore = {country: null};
	 *
	 *   // Keeps track of which city is selected
	 *   var CityStore = {city: null};
	 *
	 *   // Keeps track of the base flight price of the selected city
	 *   var FlightPriceStore = {price: null}
	 *
	 * When a user changes the selected city, we dispatch the payload:
	 *
	 *   flightDispatcher.dispatch({
	 *     actionType: 'city-update',
	 *     selectedCity: 'paris'
	 *   });
	 *
	 * This payload is digested by `CityStore`:
	 *
	 *   flightDispatcher.register(function(payload) {
	 *     if (payload.actionType === 'city-update') {
	 *       CityStore.city = payload.selectedCity;
	 *     }
	 *   });
	 *
	 * When the user selects a country, we dispatch the payload:
	 *
	 *   flightDispatcher.dispatch({
	 *     actionType: 'country-update',
	 *     selectedCountry: 'australia'
	 *   });
	 *
	 * This payload is digested by both stores:
	 *
	 *    CountryStore.dispatchToken = flightDispatcher.register(function(payload) {
	 *     if (payload.actionType === 'country-update') {
	 *       CountryStore.country = payload.selectedCountry;
	 *     }
	 *   });
	 *
	 * When the callback to update `CountryStore` is registered, we save a reference
	 * to the returned token. Using this token with `waitFor()`, we can guarantee
	 * that `CountryStore` is updated before the callback that updates `CityStore`
	 * needs to query its data.
	 *
	 *   CityStore.dispatchToken = flightDispatcher.register(function(payload) {
	 *     if (payload.actionType === 'country-update') {
	 *       // `CountryStore.country` may not be updated.
	 *       flightDispatcher.waitFor([CountryStore.dispatchToken]);
	 *       // `CountryStore.country` is now guaranteed to be updated.
	 *
	 *       // Select the default city for the new country
	 *       CityStore.city = getDefaultCityForCountry(CountryStore.country);
	 *     }
	 *   });
	 *
	 * The usage of `waitFor()` can be chained, for example:
	 *
	 *   FlightPriceStore.dispatchToken =
	 *     flightDispatcher.register(function(payload) {
	 *       switch (payload.actionType) {
	 *         case 'country-update':
	 *           flightDispatcher.waitFor([CityStore.dispatchToken]);
	 *           FlightPriceStore.price =
	 *             getFlightPriceStore(CountryStore.country, CityStore.city);
	 *           break;
	 *
	 *         case 'city-update':
	 *           FlightPriceStore.price =
	 *             FlightPriceStore(CountryStore.country, CityStore.city);
	 *           break;
	 *     }
	 *   });
	 *
	 * The `country-update` payload will be guaranteed to invoke the stores'
	 * registered callbacks in order: `CountryStore`, `CityStore`, then
	 * `FlightPriceStore`.
	 */
	
	  function Dispatcher() {
	    this.$Dispatcher_callbacks = {};
	    this.$Dispatcher_isPending = {};
	    this.$Dispatcher_isHandled = {};
	    this.$Dispatcher_isDispatching = false;
	    this.$Dispatcher_pendingPayload = null;
	  }
	
	  /**
	   * Registers a callback to be invoked with every dispatched payload. Returns
	   * a token that can be used with `waitFor()`.
	   *
	   * @param {function} callback
	   * @return {string}
	   */
	  Dispatcher.prototype.register=function(callback) {
	    var id = _prefix + _lastID++;
	    this.$Dispatcher_callbacks[id] = callback;
	    return id;
	  };
	
	  /**
	   * Removes a callback based on its token.
	   *
	   * @param {string} id
	   */
	  Dispatcher.prototype.unregister=function(id) {
	    invariant(
	      this.$Dispatcher_callbacks[id],
	      'Dispatcher.unregister(...): `%s` does not map to a registered callback.',
	      id
	    );
	    delete this.$Dispatcher_callbacks[id];
	  };
	
	  /**
	   * Waits for the callbacks specified to be invoked before continuing execution
	   * of the current callback. This method should only be used by a callback in
	   * response to a dispatched payload.
	   *
	   * @param {array<string>} ids
	   */
	  Dispatcher.prototype.waitFor=function(ids) {
	    invariant(
	      this.$Dispatcher_isDispatching,
	      'Dispatcher.waitFor(...): Must be invoked while dispatching.'
	    );
	    for (var ii = 0; ii < ids.length; ii++) {
	      var id = ids[ii];
	      if (this.$Dispatcher_isPending[id]) {
	        invariant(
	          this.$Dispatcher_isHandled[id],
	          'Dispatcher.waitFor(...): Circular dependency detected while ' +
	          'waiting for `%s`.',
	          id
	        );
	        continue;
	      }
	      invariant(
	        this.$Dispatcher_callbacks[id],
	        'Dispatcher.waitFor(...): `%s` does not map to a registered callback.',
	        id
	      );
	      this.$Dispatcher_invokeCallback(id);
	    }
	  };
	
	  /**
	   * Dispatches a payload to all registered callbacks.
	   *
	   * @param {object} payload
	   */
	  Dispatcher.prototype.dispatch=function(payload) {
	    invariant(
	      !this.$Dispatcher_isDispatching,
	      'Dispatch.dispatch(...): Cannot dispatch in the middle of a dispatch.'
	    );
	    this.$Dispatcher_startDispatching(payload);
	    try {
	      for (var id in this.$Dispatcher_callbacks) {
	        if (this.$Dispatcher_isPending[id]) {
	          continue;
	        }
	        this.$Dispatcher_invokeCallback(id);
	      }
	    } finally {
	      this.$Dispatcher_stopDispatching();
	    }
	  };
	
	  /**
	   * Is this Dispatcher currently dispatching.
	   *
	   * @return {boolean}
	   */
	  Dispatcher.prototype.isDispatching=function() {
	    return this.$Dispatcher_isDispatching;
	  };
	
	  /**
	   * Call the callback stored with the given id. Also do some internal
	   * bookkeeping.
	   *
	   * @param {string} id
	   * @internal
	   */
	  Dispatcher.prototype.$Dispatcher_invokeCallback=function(id) {
	    this.$Dispatcher_isPending[id] = true;
	    this.$Dispatcher_callbacks[id](this.$Dispatcher_pendingPayload);
	    this.$Dispatcher_isHandled[id] = true;
	  };
	
	  /**
	   * Set up bookkeeping needed when dispatching.
	   *
	   * @param {object} payload
	   * @internal
	   */
	  Dispatcher.prototype.$Dispatcher_startDispatching=function(payload) {
	    for (var id in this.$Dispatcher_callbacks) {
	      this.$Dispatcher_isPending[id] = false;
	      this.$Dispatcher_isHandled[id] = false;
	    }
	    this.$Dispatcher_pendingPayload = payload;
	    this.$Dispatcher_isDispatching = true;
	  };
	
	  /**
	   * Clear bookkeeping used for dispatching.
	   *
	   * @internal
	   */
	  Dispatcher.prototype.$Dispatcher_stopDispatching=function() {
	    this.$Dispatcher_pendingPayload = null;
	    this.$Dispatcher_isDispatching = false;
	  };
	
	
	module.exports = Dispatcher;


/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = crossfilter;

/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(31), __esModule: true };

/***/ },
/* 25 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(32), __esModule: true };

/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(33), __esModule: true };

/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(34), __esModule: true };

/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(35);
	module.exports = function defineProperty(it, key, desc){
	  return $.setDesc(it, key, desc);
	};

/***/ },
/* 29 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Copyright (c) 2014, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule invariant
	 */
	
	"use strict";
	
	/**
	 * Use invariant() to assert state which your program assumes to be true.
	 *
	 * Provide sprintf-style format (only %s is supported) and arguments
	 * to provide information about what broke and what you were
	 * expecting.
	 *
	 * The invariant message will be stripped in production, but the invariant
	 * will remain to ensure logic does not differ in production.
	 */
	
	var invariant = function(condition, format, a, b, c, d, e, f) {
	  if (false) {
	    if (format === undefined) {
	      throw new Error('invariant requires an error message argument');
	    }
	  }
	
	  if (!condition) {
	    var error;
	    if (format === undefined) {
	      error = new Error(
	        'Minified exception occurred; use the non-minified dev environment ' +
	        'for the full error message and additional helpful warnings.'
	      );
	    } else {
	      var args = [a, b, c, d, e, f];
	      var argIndex = 0;
	      error = new Error(
	        'Invariant Violation: ' +
	        format.replace(/%s/g, function() { return args[argIndex++]; })
	      );
	    }
	
	    error.framesToPop = 1; // we don't care about invariant's own frame
	    throw error;
	  }
	};
	
	module.exports = invariant;


/***/ },
/* 30 */
/***/ function(module, exports, __webpack_require__) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.
	
	function EventEmitter() {
	  this._events = this._events || {};
	  this._maxListeners = this._maxListeners || undefined;
	}
	module.exports = EventEmitter;
	
	// Backwards-compat with node 0.10.x
	EventEmitter.EventEmitter = EventEmitter;
	
	EventEmitter.prototype._events = undefined;
	EventEmitter.prototype._maxListeners = undefined;
	
	// By default EventEmitters will print a warning if more than 10 listeners are
	// added to it. This is a useful default which helps finding memory leaks.
	EventEmitter.defaultMaxListeners = 10;
	
	// Obviously not all Emitters should be limited to 10. This function allows
	// that to be increased. Set to zero for unlimited.
	EventEmitter.prototype.setMaxListeners = function(n) {
	  if (!isNumber(n) || n < 0 || isNaN(n))
	    throw TypeError('n must be a positive number');
	  this._maxListeners = n;
	  return this;
	};
	
	EventEmitter.prototype.emit = function(type) {
	  var er, handler, len, args, i, listeners;
	
	  if (!this._events)
	    this._events = {};
	
	  // If there is no 'error' event listener then throw.
	  if (type === 'error') {
	    if (!this._events.error ||
	        (isObject(this._events.error) && !this._events.error.length)) {
	      er = arguments[1];
	      if (er instanceof Error) {
	        throw er; // Unhandled 'error' event
	      }
	      throw TypeError('Uncaught, unspecified "error" event.');
	    }
	  }
	
	  handler = this._events[type];
	
	  if (isUndefined(handler))
	    return false;
	
	  if (isFunction(handler)) {
	    switch (arguments.length) {
	      // fast cases
	      case 1:
	        handler.call(this);
	        break;
	      case 2:
	        handler.call(this, arguments[1]);
	        break;
	      case 3:
	        handler.call(this, arguments[1], arguments[2]);
	        break;
	      // slower
	      default:
	        len = arguments.length;
	        args = new Array(len - 1);
	        for (i = 1; i < len; i++)
	          args[i - 1] = arguments[i];
	        handler.apply(this, args);
	    }
	  } else if (isObject(handler)) {
	    len = arguments.length;
	    args = new Array(len - 1);
	    for (i = 1; i < len; i++)
	      args[i - 1] = arguments[i];
	
	    listeners = handler.slice();
	    len = listeners.length;
	    for (i = 0; i < len; i++)
	      listeners[i].apply(this, args);
	  }
	
	  return true;
	};
	
	EventEmitter.prototype.addListener = function(type, listener) {
	  var m;
	
	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');
	
	  if (!this._events)
	    this._events = {};
	
	  // To avoid recursion in the case that type === "newListener"! Before
	  // adding it to the listeners, first emit "newListener".
	  if (this._events.newListener)
	    this.emit('newListener', type,
	              isFunction(listener.listener) ?
	              listener.listener : listener);
	
	  if (!this._events[type])
	    // Optimize the case of one listener. Don't need the extra array object.
	    this._events[type] = listener;
	  else if (isObject(this._events[type]))
	    // If we've already got an array, just append.
	    this._events[type].push(listener);
	  else
	    // Adding the second element, need to change to array.
	    this._events[type] = [this._events[type], listener];
	
	  // Check for listener leak
	  if (isObject(this._events[type]) && !this._events[type].warned) {
	    var m;
	    if (!isUndefined(this._maxListeners)) {
	      m = this._maxListeners;
	    } else {
	      m = EventEmitter.defaultMaxListeners;
	    }
	
	    if (m && m > 0 && this._events[type].length > m) {
	      this._events[type].warned = true;
	      console.error('(node) warning: possible EventEmitter memory ' +
	                    'leak detected. %d listeners added. ' +
	                    'Use emitter.setMaxListeners() to increase limit.',
	                    this._events[type].length);
	      if (typeof console.trace === 'function') {
	        // not supported in IE 10
	        console.trace();
	      }
	    }
	  }
	
	  return this;
	};
	
	EventEmitter.prototype.on = EventEmitter.prototype.addListener;
	
	EventEmitter.prototype.once = function(type, listener) {
	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');
	
	  var fired = false;
	
	  function g() {
	    this.removeListener(type, g);
	
	    if (!fired) {
	      fired = true;
	      listener.apply(this, arguments);
	    }
	  }
	
	  g.listener = listener;
	  this.on(type, g);
	
	  return this;
	};
	
	// emits a 'removeListener' event iff the listener was removed
	EventEmitter.prototype.removeListener = function(type, listener) {
	  var list, position, length, i;
	
	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');
	
	  if (!this._events || !this._events[type])
	    return this;
	
	  list = this._events[type];
	  length = list.length;
	  position = -1;
	
	  if (list === listener ||
	      (isFunction(list.listener) && list.listener === listener)) {
	    delete this._events[type];
	    if (this._events.removeListener)
	      this.emit('removeListener', type, listener);
	
	  } else if (isObject(list)) {
	    for (i = length; i-- > 0;) {
	      if (list[i] === listener ||
	          (list[i].listener && list[i].listener === listener)) {
	        position = i;
	        break;
	      }
	    }
	
	    if (position < 0)
	      return this;
	
	    if (list.length === 1) {
	      list.length = 0;
	      delete this._events[type];
	    } else {
	      list.splice(position, 1);
	    }
	
	    if (this._events.removeListener)
	      this.emit('removeListener', type, listener);
	  }
	
	  return this;
	};
	
	EventEmitter.prototype.removeAllListeners = function(type) {
	  var key, listeners;
	
	  if (!this._events)
	    return this;
	
	  // not listening for removeListener, no need to emit
	  if (!this._events.removeListener) {
	    if (arguments.length === 0)
	      this._events = {};
	    else if (this._events[type])
	      delete this._events[type];
	    return this;
	  }
	
	  // emit removeListener for all listeners on all events
	  if (arguments.length === 0) {
	    for (key in this._events) {
	      if (key === 'removeListener') continue;
	      this.removeAllListeners(key);
	    }
	    this.removeAllListeners('removeListener');
	    this._events = {};
	    return this;
	  }
	
	  listeners = this._events[type];
	
	  if (isFunction(listeners)) {
	    this.removeListener(type, listeners);
	  } else {
	    // LIFO order
	    while (listeners.length)
	      this.removeListener(type, listeners[listeners.length - 1]);
	  }
	  delete this._events[type];
	
	  return this;
	};
	
	EventEmitter.prototype.listeners = function(type) {
	  var ret;
	  if (!this._events || !this._events[type])
	    ret = [];
	  else if (isFunction(this._events[type]))
	    ret = [this._events[type]];
	  else
	    ret = this._events[type].slice();
	  return ret;
	};
	
	EventEmitter.listenerCount = function(emitter, type) {
	  var ret;
	  if (!emitter._events || !emitter._events[type])
	    ret = 0;
	  else if (isFunction(emitter._events[type]))
	    ret = 1;
	  else
	    ret = emitter._events[type].length;
	  return ret;
	};
	
	function isFunction(arg) {
	  return typeof arg === 'function';
	}
	
	function isNumber(arg) {
	  return typeof arg === 'number';
	}
	
	function isObject(arg) {
	  return typeof arg === 'object' && arg !== null;
	}
	
	function isUndefined(arg) {
	  return arg === void 0;
	}


/***/ },
/* 31 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(35);
	module.exports = function create(P, D){
	  return $.create(P, D);
	};

/***/ },
/* 32 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(35);
	__webpack_require__(36);
	module.exports = function getOwnPropertyDescriptor(it, key){
	  return $.getDesc(it, key);
	};

/***/ },
/* 33 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(37);
	module.exports = __webpack_require__(35).core.Object.assign;

/***/ },
/* 34 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(38);
	module.exports = __webpack_require__(35).core.Symbol;

/***/ },
/* 35 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var global = typeof self != 'undefined' ? self : Function('return this')()
	  , core   = {}
	  , defineProperty = Object.defineProperty
	  , hasOwnProperty = {}.hasOwnProperty
	  , ceil  = Math.ceil
	  , floor = Math.floor
	  , max   = Math.max
	  , min   = Math.min;
	// The engine works fine with descriptors? Thank's IE8 for his funny defineProperty.
	var DESC = !!function(){
	  try {
	    return defineProperty({}, 'a', {get: function(){ return 2; }}).a == 2;
	  } catch(e){ /* empty */ }
	}();
	var hide = createDefiner(1);
	// 7.1.4 ToInteger
	function toInteger(it){
	  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
	}
	function desc(bitmap, value){
	  return {
	    enumerable  : !(bitmap & 1),
	    configurable: !(bitmap & 2),
	    writable    : !(bitmap & 4),
	    value       : value
	  };
	}
	function simpleSet(object, key, value){
	  object[key] = value;
	  return object;
	}
	function createDefiner(bitmap){
	  return DESC ? function(object, key, value){
	    return $.setDesc(object, key, desc(bitmap, value));
	  } : simpleSet;
	}
	
	function isObject(it){
	  return it !== null && (typeof it == 'object' || typeof it == 'function');
	}
	function isFunction(it){
	  return typeof it == 'function';
	}
	function assertDefined(it){
	  if(it == undefined)throw TypeError("Can't call method on  " + it);
	  return it;
	}
	
	var $ = module.exports = __webpack_require__(39)({
	  g: global,
	  core: core,
	  html: global.document && document.documentElement,
	  // http://jsperf.com/core-js-isobject
	  isObject:   isObject,
	  isFunction: isFunction,
	  it: function(it){
	    return it;
	  },
	  that: function(){
	    return this;
	  },
	  // 7.1.4 ToInteger
	  toInteger: toInteger,
	  // 7.1.15 ToLength
	  toLength: function(it){
	    return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
	  },
	  toIndex: function(index, length){
	    index = toInteger(index);
	    return index < 0 ? max(index + length, 0) : min(index, length);
	  },
	  has: function(it, key){
	    return hasOwnProperty.call(it, key);
	  },
	  create:     Object.create,
	  getProto:   Object.getPrototypeOf,
	  DESC:       DESC,
	  desc:       desc,
	  getDesc:    Object.getOwnPropertyDescriptor,
	  setDesc:    defineProperty,
	  setDescs:   Object.defineProperties,
	  getKeys:    Object.keys,
	  getNames:   Object.getOwnPropertyNames,
	  getSymbols: Object.getOwnPropertySymbols,
	  assertDefined: assertDefined,
	  // Dummy, fix for not array-like ES3 string in es5 module
	  ES5Object: Object,
	  toObject: function(it){
	    return $.ES5Object(assertDefined(it));
	  },
	  hide: hide,
	  def: createDefiner(0),
	  set: global.Symbol ? simpleSet : hide,
	  mix: function(target, src){
	    for(var key in src)hide(target, key, src[key]);
	    return target;
	  },
	  each: [].forEach
	});
	/* eslint-disable no-undef */
	if(typeof __e != 'undefined')__e = core;
	if(typeof __g != 'undefined')__g = global;

/***/ },
/* 36 */
/***/ function(module, exports, __webpack_require__) {

	var $        = __webpack_require__(35)
	  , $def     = __webpack_require__(40)
	  , isObject = $.isObject
	  , toObject = $.toObject;
	function wrapObjectMethod(METHOD, MODE){
	  var fn  = ($.core.Object || {})[METHOD] || Object[METHOD]
	    , f   = 0
	    , o   = {};
	  o[METHOD] = MODE == 1 ? function(it){
	    return isObject(it) ? fn(it) : it;
	  } : MODE == 2 ? function(it){
	    return isObject(it) ? fn(it) : true;
	  } : MODE == 3 ? function(it){
	    return isObject(it) ? fn(it) : false;
	  } : MODE == 4 ? function getOwnPropertyDescriptor(it, key){
	    return fn(toObject(it), key);
	  } : MODE == 5 ? function getPrototypeOf(it){
	    return fn(Object($.assertDefined(it)));
	  } : function(it){
	    return fn(toObject(it));
	  };
	  try {
	    fn('z');
	  } catch(e){
	    f = 1;
	  }
	  $def($def.S + $def.F * f, 'Object', o);
	}
	wrapObjectMethod('freeze', 1);
	wrapObjectMethod('seal', 1);
	wrapObjectMethod('preventExtensions', 1);
	wrapObjectMethod('isFrozen', 2);
	wrapObjectMethod('isSealed', 2);
	wrapObjectMethod('isExtensible', 3);
	wrapObjectMethod('getOwnPropertyDescriptor', 4);
	wrapObjectMethod('getPrototypeOf', 5);
	wrapObjectMethod('keys');
	wrapObjectMethod('getOwnPropertyNames');

/***/ },
/* 37 */
/***/ function(module, exports, __webpack_require__) {

	// 19.1.3.1 Object.assign(target, source)
	var $def = __webpack_require__(40);
	$def($def.S, 'Object', {assign: __webpack_require__(41)});

/***/ },
/* 38 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	// ECMAScript 6 symbols shim
	var $        = __webpack_require__(35)
	  , setTag   = __webpack_require__(42).set
	  , uid      = __webpack_require__(43)
	  , $def     = __webpack_require__(40)
	  , keyOf    = __webpack_require__(44)
	  , enumKeys = __webpack_require__(45)
	  , assertObject = __webpack_require__(46).obj
	  , has      = $.has
	  , $create  = $.create
	  , getDesc  = $.getDesc
	  , setDesc  = $.setDesc
	  , desc     = $.desc
	  , getNames = $.getNames
	  , toObject = $.toObject
	  , Symbol   = $.g.Symbol
	  , setter   = false
	  , TAG      = uid('tag')
	  , HIDDEN   = uid('hidden')
	  , SymbolRegistry = {}
	  , AllSymbols = {}
	  , useNative = $.isFunction(Symbol);
	
	function wrap(tag){
	  var sym = AllSymbols[tag] = $.set($create(Symbol.prototype), TAG, tag);
	  $.DESC && setter && setDesc(Object.prototype, tag, {
	    configurable: true,
	    set: function(value){
	      if(has(this, HIDDEN) && has(this[HIDDEN], tag))this[HIDDEN][tag] = false;
	      setDesc(this, tag, desc(1, value));
	    }
	  });
	  return sym;
	}
	
	function defineProperty(it, key, D){
	  if(D && has(AllSymbols, key)){
	    if(!D.enumerable){
	      if(!has(it, HIDDEN))setDesc(it, HIDDEN, desc(1, {}));
	      it[HIDDEN][key] = true;
	    } else {
	      if(has(it, HIDDEN) && it[HIDDEN][key])it[HIDDEN][key] = false;
	      D.enumerable = false;
	    }
	  } return setDesc(it, key, D);
	}
	function defineProperties(it, P){
	  assertObject(it);
	  var keys = enumKeys(P = toObject(P))
	    , i    = 0
	    , l = keys.length
	    , key;
	  while(l > i)defineProperty(it, key = keys[i++], P[key]);
	  return it;
	}
	function create(it, P){
	  return P === undefined ? $create(it) : defineProperties($create(it), P);
	}
	function getOwnPropertyDescriptor(it, key){
	  var D = getDesc(it = toObject(it), key);
	  if(D && has(AllSymbols, key) && !(has(it, HIDDEN) && it[HIDDEN][key]))D.enumerable = true;
	  return D;
	}
	function getOwnPropertyNames(it){
	  var names  = getNames(toObject(it))
	    , result = []
	    , i      = 0
	    , key;
	  while(names.length > i)if(!has(AllSymbols, key = names[i++]) && key != HIDDEN)result.push(key);
	  return result;
	}
	function getOwnPropertySymbols(it){
	  var names  = getNames(toObject(it))
	    , result = []
	    , i      = 0
	    , key;
	  while(names.length > i)if(has(AllSymbols, key = names[i++]))result.push(AllSymbols[key]);
	  return result;
	}
	
	// 19.4.1.1 Symbol([description])
	if(!useNative){
	  Symbol = function Symbol(description){
	    if(this instanceof Symbol)throw TypeError('Symbol is not a constructor');
	    return wrap(uid(description));
	  };
	  $.hide(Symbol.prototype, 'toString', function(){
	    return this[TAG];
	  });
	
	  $.create     = create;
	  $.setDesc    = defineProperty;
	  $.getDesc    = getOwnPropertyDescriptor;
	  $.setDescs   = defineProperties;
	  $.getNames   = getOwnPropertyNames;
	  $.getSymbols = getOwnPropertySymbols;
	}
	
	var symbolStatics = {
	  // 19.4.2.1 Symbol.for(key)
	  'for': function(key){
	    return has(SymbolRegistry, key += '')
	      ? SymbolRegistry[key]
	      : SymbolRegistry[key] = Symbol(key);
	  },
	  // 19.4.2.5 Symbol.keyFor(sym)
	  keyFor: function keyFor(key){
	    return keyOf(SymbolRegistry, key);
	  },
	  useSetter: function(){ setter = true; },
	  useSimple: function(){ setter = false; }
	};
	// 19.4.2.2 Symbol.hasInstance
	// 19.4.2.3 Symbol.isConcatSpreadable
	// 19.4.2.4 Symbol.iterator
	// 19.4.2.6 Symbol.match
	// 19.4.2.8 Symbol.replace
	// 19.4.2.9 Symbol.search
	// 19.4.2.10 Symbol.species
	// 19.4.2.11 Symbol.split
	// 19.4.2.12 Symbol.toPrimitive
	// 19.4.2.13 Symbol.toStringTag
	// 19.4.2.14 Symbol.unscopables
	$.each.call((
	    'hasInstance,isConcatSpreadable,iterator,match,replace,search,' +
	    'species,split,toPrimitive,toStringTag,unscopables'
	  ).split(','), function(it){
	    var sym = __webpack_require__(47)(it);
	    symbolStatics[it] = useNative ? sym : wrap(sym);
	  }
	);
	
	setter = true;
	
	$def($def.G + $def.W, {Symbol: Symbol});
	
	$def($def.S, 'Symbol', symbolStatics);
	
	$def($def.S + $def.F * !useNative, 'Object', {
	  // 19.1.2.2 Object.create(O [, Properties])
	  create: create,
	  // 19.1.2.4 Object.defineProperty(O, P, Attributes)
	  defineProperty: defineProperty,
	  // 19.1.2.3 Object.defineProperties(O, Properties)
	  defineProperties: defineProperties,
	  // 19.1.2.6 Object.getOwnPropertyDescriptor(O, P)
	  getOwnPropertyDescriptor: getOwnPropertyDescriptor,
	  // 19.1.2.7 Object.getOwnPropertyNames(O)
	  getOwnPropertyNames: getOwnPropertyNames,
	  // 19.1.2.8 Object.getOwnPropertySymbols(O)
	  getOwnPropertySymbols: getOwnPropertySymbols
	});
	
	// 19.4.3.5 Symbol.prototype[@@toStringTag]
	setTag(Symbol, 'Symbol');
	// 20.2.1.9 Math[@@toStringTag]
	setTag(Math, 'Math', true);
	// 24.3.3 JSON[@@toStringTag]
	setTag($.g.JSON, 'JSON', true);

/***/ },
/* 39 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = function($){
	  $.FW   = false;
	  $.path = $.core;
	  return $;
	};

/***/ },
/* 40 */
/***/ function(module, exports, __webpack_require__) {

	var $          = __webpack_require__(35)
	  , global     = $.g
	  , core       = $.core
	  , isFunction = $.isFunction;
	function ctx(fn, that){
	  return function(){
	    return fn.apply(that, arguments);
	  };
	}
	// type bitmap
	$def.F = 1;  // forced
	$def.G = 2;  // global
	$def.S = 4;  // static
	$def.P = 8;  // proto
	$def.B = 16; // bind
	$def.W = 32; // wrap
	function $def(type, name, source){
	  var key, own, out, exp
	    , isGlobal = type & $def.G
	    , target   = isGlobal ? global : type & $def.S
	        ? global[name] : (global[name] || {}).prototype
	    , exports  = isGlobal ? core : core[name] || (core[name] = {});
	  if(isGlobal)source = name;
	  for(key in source){
	    // contains in native
	    own = !(type & $def.F) && target && key in target;
	    if(own && key in exports)continue;
	    // export native or passed
	    out = own ? target[key] : source[key];
	    // prevent global pollution for namespaces
	    if(isGlobal && !isFunction(target[key]))exp = source[key];
	    // bind timers to global for call from export context
	    else if(type & $def.B && own)exp = ctx(out, global);
	    // wrap global constructors for prevent change them in library
	    else if(type & $def.W && target[key] == out)!function(C){
	      exp = function(param){
	        return this instanceof C ? new C(param) : C(param);
	      };
	      exp.prototype = C.prototype;
	    }(out);
	    else exp = type & $def.P && isFunction(out) ? ctx(Function.call, out) : out;
	    // export
	    $.hide(exports, key, exp);
	  }
	}
	module.exports = $def;

/***/ },
/* 41 */
/***/ function(module, exports, __webpack_require__) {

	var $        = __webpack_require__(35)
	  , enumKeys = __webpack_require__(45);
	// 19.1.2.1 Object.assign(target, source, ...)
	/* eslint-disable no-unused-vars */
	module.exports = Object.assign || function assign(target, source){
	/* eslint-enable no-unused-vars */
	  var T = Object($.assertDefined(target))
	    , l = arguments.length
	    , i = 1;
	  while(l > i){
	    var S      = $.ES5Object(arguments[i++])
	      , keys   = enumKeys(S)
	      , length = keys.length
	      , j      = 0
	      , key;
	    while(length > j)T[key = keys[j++]] = S[key];
	  }
	  return T;
	};

/***/ },
/* 42 */
/***/ function(module, exports, __webpack_require__) {

	var $        = __webpack_require__(35)
	  , TAG      = __webpack_require__(47)('toStringTag')
	  , toString = {}.toString;
	function cof(it){
	  return toString.call(it).slice(8, -1);
	}
	cof.classof = function(it){
	  var O, T;
	  return it == undefined ? it === undefined ? 'Undefined' : 'Null'
	    : typeof (T = (O = Object(it))[TAG]) == 'string' ? T : cof(O);
	};
	cof.set = function(it, tag, stat){
	  if(it && !$.has(it = stat ? it : it.prototype, TAG))$.hide(it, TAG, tag);
	};
	module.exports = cof;

/***/ },
/* 43 */
/***/ function(module, exports, __webpack_require__) {

	var sid = 0;
	function uid(key){
	  return 'Symbol(' + key + ')_' + (++sid + Math.random()).toString(36);
	}
	uid.safe = __webpack_require__(35).g.Symbol || uid;
	module.exports = uid;

/***/ },
/* 44 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(35);
	module.exports = function(object, el){
	  var O      = $.toObject(object)
	    , keys   = $.getKeys(O)
	    , length = keys.length
	    , index  = 0
	    , key;
	  while(length > index)if(O[key = keys[index++]] === el)return key;
	};

/***/ },
/* 45 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(35);
	module.exports = function(it){
	  var keys       = $.getKeys(it)
	    , getDesc    = $.getDesc
	    , getSymbols = $.getSymbols;
	  if(getSymbols)$.each.call(getSymbols(it), function(key){
	    if(getDesc(it, key).enumerable)keys.push(key);
	  });
	  return keys;
	};

/***/ },
/* 46 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(35);
	function assert(condition, msg1, msg2){
	  if(!condition)throw TypeError(msg2 ? msg1 + msg2 : msg1);
	}
	assert.def = $.assertDefined;
	assert.fn = function(it){
	  if(!$.isFunction(it))throw TypeError(it + ' is not a function!');
	  return it;
	};
	assert.obj = function(it){
	  if(!$.isObject(it))throw TypeError(it + ' is not an object!');
	  return it;
	};
	assert.inst = function(it, Constructor, name){
	  if(!(it instanceof Constructor))throw TypeError(name + ": use the 'new' operator!");
	  return it;
	};
	module.exports = assert;

/***/ },
/* 47 */
/***/ function(module, exports, __webpack_require__) {

	var global = __webpack_require__(35).g
	  , store  = {};
	module.exports = function(name){
	  return store[name] || (store[name] =
	    global.Symbol && global.Symbol[name] || __webpack_require__(43).safe('Symbol.' + name));
	};

/***/ }
/******/ ]);
//# sourceMappingURL=index.js.map