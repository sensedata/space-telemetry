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
	
	new _App2["default"]().render();

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _createClass = __webpack_require__(6)["default"];
	
	var _classCallCheck = __webpack_require__(7)["default"];
	
	var _Object$defineProperty = __webpack_require__(8)["default"];
	
	var _Symbol = __webpack_require__(9)["default"];
	
	var _interopRequireDefault = __webpack_require__(2)["default"];
	
	_Object$defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _import = __webpack_require__(3);
	
	var _import2 = _interopRequireDefault(_import);
	
	var _Flux = __webpack_require__(22);
	
	var _Flux2 = _interopRequireDefault(_Flux);
	
	var _IO = __webpack_require__(4);
	
	var _IO2 = _interopRequireDefault(_IO);
	
	var _Moment = __webpack_require__(25);
	
	var _Moment2 = _interopRequireDefault(_Moment);
	
	var _React = __webpack_require__(5);
	
	var _React2 = _interopRequireDefault(_React);
	
	var _TelemetryIndex = __webpack_require__(10);
	
	var _TelemetryIndex2 = _interopRequireDefault(_TelemetryIndex);
	
	var _BulletChart = __webpack_require__(11);
	
	var _BulletChart2 = _interopRequireDefault(_BulletChart);
	
	var _SparklineChart = __webpack_require__(12);
	
	var _SparklineChart2 = _interopRequireDefault(_SparklineChart);
	
	var _DecimalReadout = __webpack_require__(13);
	
	var _DecimalReadout2 = _interopRequireDefault(_DecimalReadout);
	
	var _IntegerReadout = __webpack_require__(14);
	
	var _IntegerReadout2 = _interopRequireDefault(_IntegerReadout);
	
	var _TextReadout = __webpack_require__(15);
	
	var _TextReadout2 = _interopRequireDefault(_TextReadout);
	
	var _TimestampReadout = __webpack_require__(16);
	
	var _TimestampReadout2 = _interopRequireDefault(_TimestampReadout);
	
	var _TransmittedAt = __webpack_require__(17);
	
	var _TransmittedAt2 = _interopRequireDefault(_TransmittedAt);
	
	var _TransmissionDelay = __webpack_require__(18);
	
	var _TransmissionDelay2 = _interopRequireDefault(_TransmissionDelay);
	
	var _QuaternionStore = __webpack_require__(19);
	
	var _QuaternionStore2 = _interopRequireDefault(_QuaternionStore);
	
	var _SimpleStore = __webpack_require__(20);
	
	var _SimpleStore2 = _interopRequireDefault(_SimpleStore);
	
	var _TelemetryStore = __webpack_require__(21);
	
	var _TelemetryStore2 = _interopRequireDefault(_TelemetryStore);
	
	var App = (function () {
	  function App() {
	    _classCallCheck(this, App);
	
	    this.dispatcher = new _Flux2["default"].Dispatcher();
	    this.socket = _IO2["default"]();
	
	    this.listeners = [];
	    this.stores = [];
	    this.qStores = {};
	  }
	
	  _createClass(App, [{
	    key: "createQStore",
	    value: function createQStore(quaternionId, axialNumbers) {
	      var qStore = new _QuaternionStore2["default"]({
	        dispatcher: this.dispatcher,
	        axialNumbers: axialNumbers
	      });
	
	      this.qStores[quaternionId] = qStore;
	      return qStore;
	    }
	  }, {
	    key: "createStore",
	    value: function createStore(telemetryNumber) {
	      var store = new _TelemetryStore2["default"]({
	        telemetryNumber: telemetryNumber,
	        dispatcher: this.dispatcher
	      });
	
	      this.stores[telemetryNumber] = store;
	      return store;
	    }
	  }, {
	    key: "listenToServer",
	    value: function listenToServer(telemetryNumber) {
	      var _this = this;
	
	      if (typeof this.listeners[telemetryNumber] === "undefined") {
	        this.listeners[telemetryNumber] = this.socket.on(telemetryNumber, function (data) {
	          // Uncomment to watch telemetry delay bug in action
	          // const newest = _.max(data, d => {return d.t;});
	          // console.log("now, latest record, difference", moment().unix(), newest.t, moment().unix() - newest.t);
	          _this.dispatcher.dispatch({
	            actionType: "new-data",
	            telemetryNumber: telemetryNumber,
	            data: data
	          });
	        });
	        this.socket.emit(telemetryNumber, 1000000000, 200);
	      }
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
	  }, {
	    key: "getQStore",
	    value: function getQStore(quaternionId, axialNumbers) {
	      var qStore = undefined;
	
	      qStore = this.qStores[quaternionId];
	      if (typeof qStore === "undefined") {
	        qStore = this.createQStore(quaternionId, axialNumbers);
	      }
	
	      for (var a in axialNumbers) {
	        if (!this.listeners[axialNumbers[a]]) {
	          this.listenToServer(axialNumbers[a]);
	        }
	      }
	
	      return qStore;
	    }
	  }, {
	    key: "render",
	    value: function render() {
	      var _this2 = this;
	
	      var viewFactories = {
	        "bullet-chart": _React2["default"].createFactory(_BulletChart2["default"]),
	        "readout decimal": _React2["default"].createFactory(_DecimalReadout2["default"]),
	        "readout integer": _React2["default"].createFactory(_IntegerReadout2["default"]),
	        "readout text": _React2["default"].createFactory(_TextReadout2["default"]),
	        "readout timestamp": _React2["default"].createFactory(_TimestampReadout2["default"]),
	        "sparkline-chart": _React2["default"].createFactory(_SparklineChart2["default"])
	      };
	
	      var sparkLineCharts = [];
	
	      _import2["default"].forEach(viewFactories, function (viewFactory, className) {
	        _import2["default"].forEach(document.getElementsByClassName(className), function (e) {
	          var props = {
	            target: e
	          };
	
	          if (typeof e.dataset.quaternionId !== "undefined") {
	            props.store = _this2.getQStore(e.dataset.quaternionId, {
	              x: _TelemetryIndex2["default"].number(e.dataset.telemetryIdX),
	              y: _TelemetryIndex2["default"].number(e.dataset.telemetryIdY),
	              z: _TelemetryIndex2["default"].number(e.dataset.telemetryIdZ),
	              w: _TelemetryIndex2["default"].number(e.dataset.telemetryIdW)
	            });
	          } else if (typeof e.dataset.telemetryId !== "undefined") {
	            props.telemetryNumber = _TelemetryIndex2["default"].number(e.dataset.telemetryId);
	            props.store = _this2.getStore(props.telemetryNumber);
	          }
	
	          if (typeof props.store !== "undefined") {
	            var view = _React2["default"].render(viewFactory(props), e);
	            if (e.classList.contains("sparkline-chart")) {
	              sparkLineCharts.push(view);
	            }
	          }
	        });
	      });
	
	      _import2["default"].forEach(document.getElementsByClassName("status"), function (e) {
	        var telemetryNumber = _TelemetryIndex2["default"].number(e.dataset.telemetryId);
	        _this2.socket.on(telemetryNumber, function (data) {
	          var latest = _import2["default"].max(data, function (d) {
	            return d.t;
	          });
	          // No shipping version of IE correctly implements toggle.
	          if (latest.v === parseFloat(e.dataset.statusOnValue)) {
	            e.classList.add("on");
	            e.classList.remove("off");
	          } else {
	            e.classList.remove("on");
	            e.classList.add("off");
	          }
	        });
	        _this2.socket.emit(telemetryNumber, -1, 1);
	      });
	
	      var latestProps = {
	        store: new _SimpleStore2["default"]({ dispatcher: this.dispatcher })
	      };
	
	      _React2["default"].render(_React2["default"].createFactory(_TransmittedAt2["default"])(latestProps), document.getElementById("telemetry-transmitted"));
	
	      var delayView = _React2["default"].render(_React2["default"].createFactory(_TransmissionDelay2["default"])(latestProps), document.getElementById("telemetry-delay"));
	
	      window.setInterval(function () {
	        var now = _Moment2["default"]().unix();
	
	        delayView.forceUpdate();
	        sparkLineCharts.forEach(function (c) {
	          if (now - c.lastUpdate > 1) {
	            c.forceUpdate();
	          }
	        });
	      }, 1000);
	    }
	  }]);
	
	  return App;
	})();
	
	App.TELEMETRY_EVENT = _Symbol("App.TELEMETRY_EVENT");
	
	exports["default"] = App;
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
	
	var _Object$defineProperty = __webpack_require__(8)["default"];
	
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

	module.exports = { "default": __webpack_require__(38), __esModule: true };

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(39), __esModule: true };

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _createClass = __webpack_require__(6)["default"];
	
	var _classCallCheck = __webpack_require__(7)["default"];
	
	var _Object$defineProperty = __webpack_require__(8)["default"];
	
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
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _inherits = __webpack_require__(28)["default"];
	
	var _createClass = __webpack_require__(6)["default"];
	
	var _classCallCheck = __webpack_require__(7)["default"];
	
	var _Object$defineProperty = __webpack_require__(8)["default"];
	
	var _interopRequireDefault = __webpack_require__(2)["default"];
	
	_Object$defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _D3 = __webpack_require__(23);
	
	var _D32 = _interopRequireDefault(_D3);
	
	var _React = __webpack_require__(5);
	
	var _React2 = _interopRequireDefault(_React);
	
	var _ListeningView2 = __webpack_require__(31);
	
	var _ListeningView3 = _interopRequireDefault(_ListeningView2);
	
	var BulletChart = (function (_ListeningView) {
	  function BulletChart() {
	    _classCallCheck(this, BulletChart);
	
	    if (_ListeningView != null) {
	      _ListeningView.apply(this, arguments);
	    }
	  }
	
	  _inherits(BulletChart, _ListeningView);
	
	  _createClass(BulletChart, [{
	    key: "renderWithState",
	    value: function renderWithState() {
	      var maxRange = this.state.ranges[this.state.ranges.length - 1];
	      var scale = _D32["default"].scale.linear().domain([0, maxRange]).range([0, maxRange]);
	      var ranges = this.props.target.dataset.ranges;
	
	      var width = this.props.target;
	      var height = this.props.target;
	
	      return _React2["default"].createElement(
	        "svg",
	        { "class": "bullet", width: width, height: height },
	        _React2["default"].createElement(
	          "g",
	          { transform: "translate(120,5)" },
	          this.state.ranges.map(function (r, i) {
	            return _React2["default"].createElement("rect", { "class": "range range-{i}", width: r, height: "24", x: "0" });
	          }),
	          _React2["default"].createElement("rect", { "class": "measure", width: "720", height: "8", x: "0", y: "8" }),
	          _React2["default"].createElement("line", { "class": "marker", x1: this.state.marker, x2: this.state.marker, y1: "4", y2: "20" })
	        )
	      );
	    }
	  }]);
	
	  return BulletChart;
	})(_ListeningView3["default"]);
	
	exports["default"] = BulletChart;
	module.exports = exports["default"];

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _inherits = __webpack_require__(28)["default"];
	
	var _get = __webpack_require__(29)["default"];
	
	var _createClass = __webpack_require__(6)["default"];
	
	var _classCallCheck = __webpack_require__(7)["default"];
	
	var _Object$defineProperty = __webpack_require__(8)["default"];
	
	var _interopRequireDefault = __webpack_require__(2)["default"];
	
	_Object$defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _$ = __webpack_require__(24);
	
	var _$2 = _interopRequireDefault(_$);
	
	var _D3 = __webpack_require__(23);
	
	var _D32 = _interopRequireDefault(_D3);
	
	var _Moment = __webpack_require__(25);
	
	var _Moment2 = _interopRequireDefault(_Moment);
	
	var _React = __webpack_require__(5);
	
	var _React2 = _interopRequireDefault(_React);
	
	var _ListeningView2 = __webpack_require__(31);
	
	var _ListeningView3 = _interopRequireDefault(_ListeningView2);
	
	var SparklineChart = (function (_ListeningView) {
	  function SparklineChart(props) {
	    _classCallCheck(this, SparklineChart);
	
	    _get(Object.getPrototypeOf(SparklineChart.prototype), "constructor", this).call(this, props);
	
	    var jTarget = _$2["default"](props.target);
	    this.height = jTarget.height();
	    this.width = jTarget.width();
	    this.lastUpdate = 0;
	  }
	
	  _inherits(SparklineChart, _ListeningView);
	
	  _createClass(SparklineChart, [{
	    key: "availablePoints",
	    value: function availablePoints() {
	      return Math.floor(this.width / 3);
	    }
	  }, {
	    key: "earliestAcceptable",
	    value: function earliestAcceptable() {
	      return _Moment2["default"]().subtract(this.availablePoints() * 3, "seconds").unix();
	    }
	  }, {
	    key: "storeChanged",
	    value: function storeChanged() {
	      this.setState({
	        data: this.props.store.get(999999, this.earliestAcceptable()).slice().reverse()
	      });
	    }
	  }, {
	    key: "renderWithState",
	    value: function renderWithState() {
	      if (this.state.data.length <= 1) {
	        return false;
	      }
	
	      var newest = this.state.data[this.state.data.length - 1];
	
	      if (newest.t < this.earliestAcceptable()) {
	        return false;
	      }
	
	      var line = _D32["default"].svg.line();
	      line.x(function (d) {
	        return x(d.t);
	      });
	      line.y(function (d) {
	        return y(d.v);
	      });
	      line.interpolate("basis");
	
	      var now = _Moment2["default"]().unix();
	
	      var x = _D32["default"].scale.linear().range([0, this.width - 2]);
	      x.domain([this.earliestAcceptable(), now - 1]);
	
	      // FIXME Why the heck does this need to have 10 subtracted to not overrun
	      // the top and bottom of the draw-area?
	      var y = _D32["default"].scale.linear().range([0, this.height - 10]);
	      y.domain(_D32["default"].extent(this.state.data, function (d) {
	        return d.v;
	      }));
	
	      this.lastUpdate = now;
	      return _React2["default"].createElement(
	        "svg",
	        { className: "sparkline", height: this.height - 6, width: this.width },
	        _React2["default"].createElement(
	          "g",
	          { transform: "translate(0, 2)" },
	          _React2["default"].createElement("path", { d: line(this.state.data) }),
	          _React2["default"].createElement("circle", { cx: x(newest.t), cy: y(newest.v), r: "1.5" })
	        )
	      );
	    }
	  }]);
	
	  return SparklineChart;
	})(_ListeningView3["default"]);
	
	exports["default"] = SparklineChart;
	module.exports = exports["default"];

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _inherits = __webpack_require__(28)["default"];
	
	var _createClass = __webpack_require__(6)["default"];
	
	var _classCallCheck = __webpack_require__(7)["default"];
	
	var _Object$defineProperty = __webpack_require__(8)["default"];
	
	var _interopRequireDefault = __webpack_require__(2)["default"];
	
	_Object$defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _import = __webpack_require__(3);
	
	var _import2 = _interopRequireDefault(_import);
	
	var _React = __webpack_require__(5);
	
	var _React2 = _interopRequireDefault(_React);
	
	var _ListeningView2 = __webpack_require__(31);
	
	var _ListeningView3 = _interopRequireDefault(_ListeningView2);
	
	var DecimalReadout = (function (_ListeningView) {
	  function DecimalReadout() {
	    _classCallCheck(this, DecimalReadout);
	
	    if (_ListeningView != null) {
	      _ListeningView.apply(this, arguments);
	    }
	  }
	
	  _inherits(DecimalReadout, _ListeningView);
	
	  _createClass(DecimalReadout, [{
	    key: "renderWithState",
	    value: function renderWithState() {
	      var formatted = undefined;
	
	      if (this.state.data.length <= 0) {
	        formatted = "-";
	      } else {
	        var current = this.state.data[0];
	
	        var datum = undefined;
	        if (typeof this.props.target.dataset.quaternionId !== "undefined") {
	          datum = current[this.props.target.dataset.eulerAxis];
	        } else {
	          datum = current.v;
	        }
	
	        formatted = datum.toFixed(this.props.target.dataset.scale);
	        if (this.props.target.dataset.zeroPad === "true") {
	          formatted = _import2["default"].leftPad(formatted, this.props.target.dataset.precision, "0");
	        }
	      }
	
	      return _React2["default"].createElement(
	        "span",
	        null,
	        formatted
	      );
	    }
	  }]);
	
	  return DecimalReadout;
	})(_ListeningView3["default"]);
	
	exports["default"] = DecimalReadout;
	module.exports = exports["default"];

/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _inherits = __webpack_require__(28)["default"];
	
	var _createClass = __webpack_require__(6)["default"];
	
	var _classCallCheck = __webpack_require__(7)["default"];
	
	var _Object$defineProperty = __webpack_require__(8)["default"];
	
	var _interopRequireDefault = __webpack_require__(2)["default"];
	
	_Object$defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _React = __webpack_require__(5);
	
	var _React2 = _interopRequireDefault(_React);
	
	var _ListeningView2 = __webpack_require__(31);
	
	var _ListeningView3 = _interopRequireDefault(_ListeningView2);
	
	var IntegerReadout = (function (_ListeningView) {
	  function IntegerReadout() {
	    _classCallCheck(this, IntegerReadout);
	
	    if (_ListeningView != null) {
	      _ListeningView.apply(this, arguments);
	    }
	  }
	
	  _inherits(IntegerReadout, _ListeningView);
	
	  _createClass(IntegerReadout, [{
	    key: "renderWithState",
	    value: function renderWithState() {
	      var formatted = undefined;
	
	      if (this.state.data.length <= 0) {
	        formatted = "-";
	      } else {
	        formatted = Math.round(this.state.data[0].v);
	      }
	
	      return _React2["default"].createElement(
	        "span",
	        null,
	        formatted
	      );
	    }
	  }]);
	
	  return IntegerReadout;
	})(_ListeningView3["default"]);
	
	exports["default"] = IntegerReadout;
	module.exports = exports["default"];

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _inherits = __webpack_require__(28)["default"];
	
	var _createClass = __webpack_require__(6)["default"];
	
	var _classCallCheck = __webpack_require__(7)["default"];
	
	var _Object$defineProperty = __webpack_require__(8)["default"];
	
	var _interopRequireDefault = __webpack_require__(2)["default"];
	
	_Object$defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _React = __webpack_require__(5);
	
	var _React2 = _interopRequireDefault(_React);
	
	var _ListeningView2 = __webpack_require__(31);
	
	var _ListeningView3 = _interopRequireDefault(_ListeningView2);
	
	var _StatusDictionary = __webpack_require__(32);
	
	var _StatusDictionary2 = _interopRequireDefault(_StatusDictionary);
	
	var TextReadout = (function (_ListeningView) {
	  function TextReadout() {
	    _classCallCheck(this, TextReadout);
	
	    if (_ListeningView != null) {
	      _ListeningView.apply(this, arguments);
	    }
	  }
	
	  _inherits(TextReadout, _ListeningView);
	
	  _createClass(TextReadout, [{
	    key: "renderWithState",
	    value: function renderWithState() {
	      var values = _StatusDictionary2["default"].get(this.props.telemetryNumber);
	      var value = undefined;
	      if (values && this.state.data.length > 0) {
	        value = values[this.state.data[0].v];
	      }
	
	      return _React2["default"].createElement(
	        "span",
	        null,
	        typeof value === "undefined" ? "Unknown" : value
	      );
	    }
	  }]);
	
	  return TextReadout;
	})(_ListeningView3["default"]);
	
	exports["default"] = TextReadout;
	module.exports = exports["default"];

/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _inherits = __webpack_require__(28)["default"];
	
	var _createClass = __webpack_require__(6)["default"];
	
	var _classCallCheck = __webpack_require__(7)["default"];
	
	var _Object$defineProperty = __webpack_require__(8)["default"];
	
	var _interopRequireDefault = __webpack_require__(2)["default"];
	
	_Object$defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _Moment = __webpack_require__(25);
	
	var _Moment2 = _interopRequireDefault(_Moment);
	
	var _React = __webpack_require__(5);
	
	var _React2 = _interopRequireDefault(_React);
	
	var _ListeningView2 = __webpack_require__(31);
	
	var _ListeningView3 = _interopRequireDefault(_ListeningView2);
	
	var TimestampReadout = (function (_ListeningView) {
	  function TimestampReadout() {
	    _classCallCheck(this, TimestampReadout);
	
	    if (_ListeningView != null) {
	      _ListeningView.apply(this, arguments);
	    }
	  }
	
	  _inherits(TimestampReadout, _ListeningView);
	
	  _createClass(TimestampReadout, [{
	    key: "renderWithState",
	    value: function renderWithState() {
	      var unixTime = this.state.data.length > 0 ? this.state.data[0].v : 0;
	      var formatted = unixTime === 0 ? "-" : _Moment2["default"].unix(unixTime).utc().format("HH:mm:ss YYYY.MM.DD");
	
	      return _React2["default"].createElement(
	        "span",
	        null,
	        formatted
	      );
	    }
	  }]);
	
	  return TimestampReadout;
	})(_ListeningView3["default"]);
	
	exports["default"] = TimestampReadout;
	module.exports = exports["default"];

/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _inherits = __webpack_require__(28)["default"];
	
	var _createClass = __webpack_require__(6)["default"];
	
	var _classCallCheck = __webpack_require__(7)["default"];
	
	var _Object$defineProperty = __webpack_require__(8)["default"];
	
	var _interopRequireDefault = __webpack_require__(2)["default"];
	
	_Object$defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _Moment = __webpack_require__(25);
	
	var _Moment2 = _interopRequireDefault(_Moment);
	
	var _React = __webpack_require__(5);
	
	var _React2 = _interopRequireDefault(_React);
	
	var _ListeningView2 = __webpack_require__(31);
	
	var _ListeningView3 = _interopRequireDefault(_ListeningView2);
	
	var TransmittedAt = (function (_ListeningView) {
	  function TransmittedAt() {
	    _classCallCheck(this, TransmittedAt);
	
	    if (_ListeningView != null) {
	      _ListeningView.apply(this, arguments);
	    }
	  }
	
	  _inherits(TransmittedAt, _ListeningView);
	
	  _createClass(TransmittedAt, [{
	    key: "renderWithState",
	    value: function renderWithState() {
	      var unixTime = this.state.data ? this.state.data.t : 0;
	      var formatted = unixTime === 0 ? "-" : _Moment2["default"].unix(unixTime).utc().format("HH:mm:ss YYYY.MM.DD");
	
	      return _React2["default"].createElement(
	        "span",
	        null,
	        formatted
	      );
	    }
	  }]);
	
	  return TransmittedAt;
	})(_ListeningView3["default"]);
	
	exports["default"] = TransmittedAt;
	module.exports = exports["default"];

/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _inherits = __webpack_require__(28)["default"];
	
	var _createClass = __webpack_require__(6)["default"];
	
	var _classCallCheck = __webpack_require__(7)["default"];
	
	var _Object$defineProperty = __webpack_require__(8)["default"];
	
	var _interopRequireDefault = __webpack_require__(2)["default"];
	
	_Object$defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _Moment = __webpack_require__(25);
	
	var _Moment2 = _interopRequireDefault(_Moment);
	
	__webpack_require__(35);
	
	var _React = __webpack_require__(5);
	
	var _React2 = _interopRequireDefault(_React);
	
	var _ListeningView2 = __webpack_require__(31);
	
	var _ListeningView3 = _interopRequireDefault(_ListeningView2);
	
	var TransmissionDelay = (function (_ListeningView) {
	  function TransmissionDelay() {
	    _classCallCheck(this, TransmissionDelay);
	
	    if (_ListeningView != null) {
	      _ListeningView.apply(this, arguments);
	    }
	  }
	
	  _inherits(TransmissionDelay, _ListeningView);
	
	  _createClass(TransmissionDelay, [{
	    key: "renderWithState",
	    value: function renderWithState() {
	      var unixTime = this.state.data ? this.state.data.t : 0;
	      var time = _Moment2["default"].unix(unixTime).utc();
	      var now = _Moment2["default"]().utc();
	      var delta = now.diff(time, "milliseconds");
	      var rangeAlarm = Math.abs(delta) > 30000;
	      var formatted = _Moment2["default"].duration(delta, "milliseconds").format("HH:mm:ss", { trim: false });
	
	      return _React2["default"].createElement(
	        "span",
	        { className: rangeAlarm ? "time-alarm" : "" },
	        formatted
	      );
	    }
	  }]);
	
	  return TransmissionDelay;
	})(_ListeningView3["default"]);
	
	exports["default"] = TransmissionDelay;
	module.exports = exports["default"];

/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _inherits = __webpack_require__(28)["default"];
	
	var _get = __webpack_require__(29)["default"];
	
	var _createClass = __webpack_require__(6)["default"];
	
	var _classCallCheck = __webpack_require__(7)["default"];
	
	var _Object$defineProperty = __webpack_require__(8)["default"];
	
	var _interopRequireDefault = __webpack_require__(2)["default"];
	
	_Object$defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _THREE = __webpack_require__(26);
	
	var _THREE2 = _interopRequireDefault(_THREE);
	
	var _EventEmitter2 = __webpack_require__(33);
	
	var _EventEmitter3 = _interopRequireDefault(_EventEmitter2);
	
	var _App = __webpack_require__(1);
	
	var _App2 = _interopRequireDefault(_App);
	
	var QuaternionStore = (function (_EventEmitter) {
	  function QuaternionStore(props) {
	    _classCallCheck(this, QuaternionStore);
	
	    _get(Object.getPrototypeOf(QuaternionStore.prototype), "constructor", this).call(this, props);
	
	    this.props = props;
	    this.quaternion = new _THREE2["default"].Quaternion();
	    this.euler = [new _THREE2["default"].Euler()];
	
	    this.dispatchToken = props.dispatcher.register(this.dispatch.bind(this));
	  }
	
	  _inherits(QuaternionStore, _EventEmitter);
	
	  _createClass(QuaternionStore, [{
	    key: "update",
	    value: function update(axis, data) {
	      this.quaternion[axis] = data.sort(function (a, b) {
	        return b.t - a.t;
	      })[0].v;
	      this.euler[0].setFromQuaternion(this.quaternion);
	
	      this.emit(_App2["default"].TELEMETRY_EVENT);
	    }
	  }, {
	    key: "dispatch",
	    value: function dispatch(payload) {
	      if (payload.actionType === "new-data") {
	        // this.props.dispatcher.waitFor([this.dispatchToken]);
	
	        switch (payload.telemetryNumber) {
	          case this.props.axialNumbers.x:
	            this.update("x", payload.data);break;
	          case this.props.axialNumbers.y:
	            this.update("y", payload.data);break;
	          case this.props.axialNumbers.z:
	            this.update("z", payload.data);break;
	          case this.props.axialNumbers.w:
	            this.update("w", payload.data);break;
	        }
	      }
	    }
	  }, {
	    key: "get",
	    value: function get() {
	      return this.euler;
	    }
	  }]);
	
	  return QuaternionStore;
	})(_EventEmitter3["default"]);
	
	exports["default"] = QuaternionStore;
	module.exports = exports["default"];

/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _inherits = __webpack_require__(28)["default"];
	
	var _get = __webpack_require__(29)["default"];
	
	var _createClass = __webpack_require__(6)["default"];
	
	var _classCallCheck = __webpack_require__(7)["default"];
	
	var _Object$defineProperty = __webpack_require__(8)["default"];
	
	var _interopRequireDefault = __webpack_require__(2)["default"];
	
	_Object$defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _import = __webpack_require__(3);
	
	var _import2 = _interopRequireDefault(_import);
	
	var _EventEmitter2 = __webpack_require__(33);
	
	var _EventEmitter3 = _interopRequireDefault(_EventEmitter2);
	
	var _App = __webpack_require__(1);
	
	var _App2 = _interopRequireDefault(_App);
	
	var SimpleStore = (function (_EventEmitter) {
	  function SimpleStore(props) {
	    _classCallCheck(this, SimpleStore);
	
	    _get(Object.getPrototypeOf(SimpleStore.prototype), "constructor", this).call(this, props);
	    this.props = props;
	    this.dispatchToken = props.dispatcher.register(this.dispatch.bind(this));
	  }
	
	  _inherits(SimpleStore, _EventEmitter);
	
	  _createClass(SimpleStore, [{
	    key: "update",
	    value: function update(data) {
	      var newData = _import2["default"].max(data, function (d) {
	        return d.t;
	      });
	      if (!this.datum || newData.t > this.datum.t) {
	        this.datum = newData;
	        this.emit(_App2["default"].TELEMETRY_EVENT);
	      }
	    }
	  }, {
	    key: "dispatch",
	    value: function dispatch(payload) {
	      if (payload.actionType === "new-data") {
	        // this.props.dispatcher.waitFor([this.dispatchToken]);
	        this.update(payload.data);
	      }
	    }
	  }, {
	    key: "get",
	    value: function get() {
	      return this.datum;
	    }
	  }]);
	
	  return SimpleStore;
	})(_EventEmitter3["default"]);
	
	exports["default"] = SimpleStore;
	module.exports = exports["default"];

/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _inherits = __webpack_require__(28)["default"];
	
	var _get = __webpack_require__(29)["default"];
	
	var _createClass = __webpack_require__(6)["default"];
	
	var _classCallCheck = __webpack_require__(7)["default"];
	
	var _Object$defineProperty = __webpack_require__(8)["default"];
	
	var _Object$assign = __webpack_require__(30)["default"];
	
	var _interopRequireDefault = __webpack_require__(2)["default"];
	
	_Object$defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _Crossfilter = __webpack_require__(27);
	
	var _Crossfilter2 = _interopRequireDefault(_Crossfilter);
	
	var _EventEmitter2 = __webpack_require__(33);
	
	var _EventEmitter3 = _interopRequireDefault(_EventEmitter2);
	
	var _App = __webpack_require__(1);
	
	var _App2 = _interopRequireDefault(_App);
	
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
	      // FIXME Pruning the wrong stuff.
	      // this.prune(false);
	
	      if (emit) {
	        this.emit(_App2["default"].TELEMETRY_EVENT);
	      }
	    }
	  }, {
	    key: "dispatch",
	    value: function dispatch(payload) {
	      if (payload.telemetryNumber === this.props.telemetryNumber && payload.actionType === "new-data") {
	        // this.props.dispatcher.waitFor([this.dispatchToken]);
	        this.add(payload.data);
	      }
	    }
	  }, {
	    key: "get",
	    value: function get(maxPoints, earliestTime) {
	      if (typeof earliestTime !== "undefined") {
	        this.timeDimension.filter(function (t) {
	          return t >= earliestTime;
	        });
	      }
	      var top = this.timeDimension.top(maxPoints || 1);
	
	      this.timeDimension.filterAll();
	      return top;
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
	      this.indexDimension.filterAll();
	
	      if (emit) {
	        this.emit(_App2["default"].TELEMETRY_EVENT);
	      }
	    }
	  }]);
	
	  return TelemetryStore;
	})(_EventEmitter3["default"]);
	
	exports["default"] = TelemetryStore;
	module.exports = exports["default"];

/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Copyright (c) 2014-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 */
	
	module.exports.Dispatcher = __webpack_require__(34)


/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = d3;

/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = jQuery;

/***/ },
/* 25 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = moment;

/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = THREE;

/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = crossfilter;

/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _Object$create = __webpack_require__(37)["default"];
	
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
/* 29 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _Object$getOwnPropertyDescriptor = __webpack_require__(36)["default"];
	
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
/* 30 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(40), __esModule: true };

/***/ },
/* 31 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _inherits = __webpack_require__(28)["default"];
	
	var _createClass = __webpack_require__(6)["default"];
	
	var _classCallCheck = __webpack_require__(7)["default"];
	
	var _Object$defineProperty = __webpack_require__(8)["default"];
	
	var _interopRequireDefault = __webpack_require__(2)["default"];
	
	_Object$defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _React = __webpack_require__(5);
	
	var _React2 = _interopRequireDefault(_React);
	
	var _App = __webpack_require__(1);
	
	var _App2 = _interopRequireDefault(_App);
	
	var ListeningView = (function (_React$Component) {
	  function ListeningView() {
	    _classCallCheck(this, ListeningView);
	
	    if (_React$Component != null) {
	      _React$Component.apply(this, arguments);
	    }
	  }
	
	  _inherits(ListeningView, _React$Component);
	
	  _createClass(ListeningView, [{
	    key: "componentDidMount",
	    value: function componentDidMount() {
	      this.props.store.addListener(_App2["default"].TELEMETRY_EVENT, this.storeChanged.bind(this));
	    }
	  }, {
	    key: "componentWillUnmount",
	    value: function componentWillUnmount() {
	      this.props.store.removeListener(_App2["default"].TELEMETRY_EVENT, this.storeChanged.bind(this));
	    }
	  }, {
	    key: "storeChanged",
	    value: function storeChanged() {
	      this.setState({
	        data: this.props.store.get()
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
	
	  return ListeningView;
	})(_React2["default"].Component);
	
	exports["default"] = ListeningView;
	module.exports = exports["default"];

/***/ },
/* 32 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _createClass = __webpack_require__(6)["default"];
	
	var _classCallCheck = __webpack_require__(7)["default"];
	
	var _Object$defineProperty = __webpack_require__(8)["default"];
	
	var _interopRequireDefault = __webpack_require__(2)["default"];
	
	_Object$defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _TelemetryIndex = __webpack_require__(10);
	
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
	
	var StatusDictionary = (function () {
	  function StatusDictionary() {
	    _classCallCheck(this, StatusDictionary);
	  }
	
	  _createClass(StatusDictionary, null, [{
	    key: "get",
	    value: function get(telemetryNumber) {
	      return statuses[telemetryNumber];
	    }
	  }]);
	
	  return StatusDictionary;
	})();
	
	exports["default"] = StatusDictionary;
	module.exports = exports["default"];

/***/ },
/* 33 */
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
/* 34 */
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
	
	var invariant = __webpack_require__(41);
	
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
/* 35 */
/***/ function(module, exports, __webpack_require__) {

	/*! Moment Duration Format v1.3.0
	 *  https://github.com/jsmreese/moment-duration-format 
	 *  Date: 2014-07-15
	 *
	 *  Duration format plugin function for the Moment.js library
	 *  http://momentjs.com/
	 *
	 *  Copyright 2014 John Madhavan-Reese
	 *  Released under the MIT license
	 */
	
	(function (root, undefined) {
	
		// repeatZero(qty)
		// returns "0" repeated qty times
		function repeatZero(qty) {
			var result = "";
			
			// exit early
			// if qty is 0 or a negative number
			// or doesn't coerce to an integer
			qty = parseInt(qty, 10);
			if (!qty || qty < 1) { return result; }
			
			while (qty) {
				result += "0";
				qty -= 1;
			}
			
			return result;
		}
		
		// padZero(str, len [, isRight])
		// pads a string with zeros up to a specified length
		// will not pad a string if its length is aready
		// greater than or equal to the specified length
		// default output pads with zeros on the left
		// set isRight to `true` to pad with zeros on the right
		function padZero(str, len, isRight) {
			if (str == null) { str = ""; }
			str = "" + str;
			
			return (isRight ? str : "") + repeatZero(len - str.length) + (isRight ? "" : str);
		}
		
		// isArray
		function isArray(array) {
			return Object.prototype.toString.call(array) === "[object Array]";
		}
		
		// isObject
		function isObject(obj) {
			return Object.prototype.toString.call(obj) === "[object Object]";
		}
		
		// findLast
		function findLast(array, callback) {
			var index = array.length;
	
			while (index -= 1) {
				if (callback(array[index])) { return array[index]; }
			}
		}
	
		// find
		function find(array, callback) {
			var index = 0,
				max = array.length,
				match;
				
			if (typeof callback !== "function") {
				match = callback;
				callback = function (item) {
					return item === match;
				};
			}
	
			while (index < max) {
				if (callback(array[index])) { return array[index]; }
				index += 1;
			}
		}
		
		// each
		function each(array, callback) {
			var index = 0,
				max = array.length;
				
			if (!array || !max) { return; }
	
			while (index < max) {
				if (callback(array[index], index) === false) { return; }
				index += 1;
			}
		}
		
		// map
		function map(array, callback) {
			var index = 0,
				max = array.length,
				ret = [];
	
			if (!array || !max) { return ret; }
					
			while (index < max) {
				ret[index] = callback(array[index], index);
				index += 1;
			}
			
			return ret;
		}
		
		// pluck
		function pluck(array, prop) {
			return map(array, function (item) {
				return item[prop];
			});
		}
		
		// compact
		function compact(array) {
			var ret = [];
			
			each(array, function (item) {
				if (item) { ret.push(item); }
			});
			
			return ret;
		}
		
		// unique
		function unique(array) {
			var ret = [];
			
			each(array, function (_a) {
				if (!find(ret, _a)) { ret.push(_a); }
			});
			
			return ret;
		}
		
		// intersection
		function intersection(a, b) {
			var ret = [];
			
			each(a, function (_a) {
				each(b, function (_b) {
					if (_a === _b) { ret.push(_a); }
				});
			});
			
			return unique(ret);
		}
		
		// rest
		function rest(array, callback) {
			var ret = [];
			
			each(array, function (item, index) {
				if (!callback(item)) {
					ret = array.slice(index);
					return false;
				}
			});
			
			return ret;
		}
	
		// initial
		function initial(array, callback) {
			var reversed = array.slice().reverse();
			
			return rest(reversed, callback).reverse();
		}
		
		// extend
		function extend(a, b) {
			for (var key in b) {
				if (b.hasOwnProperty(key)) { a[key] = b[key]; }
			}
			
			return a;
		}
				
		// define internal moment reference
		var moment;
	
		if (true) {
			try { moment = __webpack_require__(25); } 
			catch (e) {}
		} 
		
		if (!moment && root.moment) {
			moment = root.moment;
		}
		
		if (!moment) {
			throw "Moment Duration Format cannot find Moment.js";
		}
		
		// moment.duration.format([template] [, precision] [, settings])
		moment.duration.fn.format = function () {
	
			var tokenizer, tokens, types, typeMap, momentTypes, foundFirst, trimIndex,
				args = [].slice.call(arguments),
				settings = extend({}, this.format.defaults),
				// keep a shadow copy of this moment for calculating remainders
				remainder = moment.duration(this);
	
			// add a reference to this duration object to the settings for use
			// in a template function
			settings.duration = this;
	
			// parse arguments
			each(args, function (arg) {
				if (typeof arg === "string" || typeof arg === "function") {
					settings.template = arg;
					return;
				}
	
				if (typeof arg === "number") {
					settings.precision = arg;
					return;
				}
	
				if (isObject(arg)) {
					extend(settings, arg);
				}
			});
	
			// types
			types = settings.types = (isArray(settings.types) ? settings.types : settings.types.split(" "));
	
			// template
			if (typeof settings.template === "function") {
				settings.template = settings.template.apply(settings);
			}
	
			// tokenizer regexp
			tokenizer = new RegExp(map(types, function (type) {
				return settings[type].source;
			}).join("|"), "g");
	
			// token type map function
			typeMap = function (token) {
				return find(types, function (type) {
					return settings[type].test(token);
				});
			};
	
			// tokens array
			tokens = map(settings.template.match(tokenizer), function (token, index) {
				var type = typeMap(token),
					length = token.length;
	
				return {
					index: index,
					length: length,
	
					// replace escaped tokens with the non-escaped token text
					token: (type === "escape" ? token.replace(settings.escape, "$1") : token),
	
					// ignore type on non-moment tokens
					type: ((type === "escape" || type === "general") ? null : type)
	
					// calculate base value for all moment tokens
					//baseValue: ((type === "escape" || type === "general") ? null : this.as(type))
				};
			}, this);
	
			// unique moment token types in the template (in order of descending magnitude)
			momentTypes = intersection(types, unique(compact(pluck(tokens, "type"))));
	
			// exit early if there are no momentTypes
			if (!momentTypes.length) {
				return pluck(tokens, "token").join("");
			}
	
			// calculate values for each token type in the template
			each(momentTypes, function (momentType, index) {
				var value, wholeValue, decimalValue, isLeast, isMost;
	
				// calculate integer and decimal value portions
				value = remainder.as(momentType);
				wholeValue = (value > 0 ? Math.floor(value) : Math.ceil(value));
				decimalValue = value - wholeValue;
	
				// is this the least-significant moment token found?
				isLeast = ((index + 1) === momentTypes.length);
	
				// is this the most-significant moment token found?
				isMost = (!index);
	
				// update tokens array
				// using this algorithm to not assume anything about
				// the order or frequency of any tokens
				each(tokens, function (token) {
					if (token.type === momentType) {
						extend(token, {
							value: value,
							wholeValue: wholeValue,
							decimalValue: decimalValue,
							isLeast: isLeast,
							isMost: isMost
						});
	
						if (isMost) {
							// note the length of the most-significant moment token:
							// if it is greater than one and forceLength is not set, default forceLength to `true`
							if (settings.forceLength == null && token.length > 1) {
								settings.forceLength = true;
							}
	
							// rationale is this:
							// if the template is "h:mm:ss" and the moment value is 5 minutes, the user-friendly output is "5:00", not "05:00"
							// shouldn't pad the `minutes` token even though it has length of two
							// if the template is "hh:mm:ss", the user clearly wanted everything padded so we should output "05:00"
							// if the user wanted the full padded output, they can set `{ trim: false }` to get "00:05:00"
						}
					}
				});
	
				// update remainder
				remainder.subtract(wholeValue, momentType);
			});
		
			// trim tokens array
			if (settings.trim) {
				tokens = (settings.trim === "left" ? rest : initial)(tokens, function (token) {
					// return `true` if:
					// the token is not the least moment token (don't trim the least moment token)
					// the token is a moment token that does not have a value (don't trim moment tokens that have a whole value)
					return !(token.isLeast || (token.type != null && token.wholeValue));
				});
			}
			
			
			// build output
	
			// the first moment token can have special handling
			foundFirst = false;
	
			// run the map in reverse order if trimming from the right
			if (settings.trim === "right") {
				tokens.reverse();
			}
	
			tokens = map(tokens, function (token) {
				var val,
					decVal;
	
				if (!token.type) {
					// if it is not a moment token, use the token as its own value
					return token.token;
				}
	
				// apply negative precision formatting to the least-significant moment token
				if (token.isLeast && (settings.precision < 0)) {
					val = (Math.floor(token.wholeValue * Math.pow(10, settings.precision)) * Math.pow(10, -settings.precision)).toString();
				} else {
					val = token.wholeValue.toString();
				}
				
				// remove negative sign from the beginning
				val = val.replace(/^\-/, "");
	
				// apply token length formatting
				// special handling for the first moment token that is not the most significant in a trimmed template
				if (token.length > 1 && (foundFirst || token.isMost || settings.forceLength)) {
					val = padZero(val, token.length);
				}
	
				// add decimal value if precision > 0
				if (token.isLeast && (settings.precision > 0)) {
					decVal = token.decimalValue.toString().replace(/^\-/, "").split(/\.|e\-/);
					switch (decVal.length) {
						case 1:
							val += "." + padZero(decVal[0], settings.precision, true).slice(0, settings.precision);
							break;
							
						case 2:
							val += "." + padZero(decVal[1], settings.precision, true).slice(0, settings.precision);		
							break;
							
						case 3:
							val += "." + padZero(repeatZero((+decVal[2]) - 1) + (decVal[0] || "0") + decVal[1], settings.precision, true).slice(0, settings.precision);		
							break;
						
						default:
							throw "Moment Duration Format: unable to parse token decimal value.";
					}
				}
				
				// add a negative sign if the value is negative and token is most significant
				if (token.isMost && token.value < 0) {
					val = "-" + val;
				}
	
				foundFirst = true;
	
				return val;
			});
	
			// undo the reverse if trimming from the right
			if (settings.trim === "right") {
				tokens.reverse();
			}
	
			return tokens.join("");
		};
	
		moment.duration.fn.format.defaults = {
			// token definitions
			escape: /\[(.+?)\]/,
			years: /[Yy]+/,
			months: /M+/,
			weeks: /[Ww]+/,
			days: /[Dd]+/,
			hours: /[Hh]+/,
			minutes: /m+/,
			seconds: /s+/,
			milliseconds: /S+/,
			general: /.+?/,
	
			// token type names
			// in order of descending magnitude
			// can be a space-separated token name list or an array of token names
			types: "escape years months weeks days hours minutes seconds milliseconds general",
	
			// format options
	
			// trim
			// "left" - template tokens are trimmed from the left until the first moment token that has a value >= 1
			// "right" - template tokens are trimmed from the right until the first moment token that has a value >= 1
			// (the final moment token is not trimmed, regardless of value)
			// `false` - template tokens are not trimmed
			trim: "left",
	
			// precision
			// number of decimal digits to include after (to the right of) the decimal point (positive integer)
			// or the number of digits to truncate to 0 before (to the left of) the decimal point (negative integer)
			precision: 0,
	
			// force first moment token with a value to render at full length even when template is trimmed and first moment token has length of 1
			forceLength: null,
	
			// template used to format duration
			// may be a function or a string
			// template functions are executed with the `this` binding of the settings object
			// so that template strings may be dynamically generated based on the duration object
			// (accessible via `this.duration`)
			// or any of the other settings
			template: function () {
				var types = this.types,
					dur = this.duration,
					lastType = findLast(types, function (type) {
						return dur._data[type];
					});
	
				// default template strings for each duration dimension type
				switch (lastType) {
					case "seconds":
						return "h:mm:ss";
					case "minutes":
						return "d[d] h:mm";
					case "hours":
						return "d[d] h[h]";
					case "days":
						return "M[m] d[d]";
					case "weeks":
						return "y[y] w[w]";
					case "months":
						return "y[y] M[m]";
					case "years":
						return "y[y]";
					default:
						return "y[y] M[m] d[d] h:mm:ss";
				}
			}
		};
	
	})(this);


/***/ },
/* 36 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(42), __esModule: true };

/***/ },
/* 37 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(43), __esModule: true };

/***/ },
/* 38 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(44);
	module.exports = function defineProperty(it, key, desc){
	  return $.setDesc(it, key, desc);
	};

/***/ },
/* 39 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(45);
	module.exports = __webpack_require__(44).core.Symbol;

/***/ },
/* 40 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(46);
	module.exports = __webpack_require__(44).core.Object.assign;

/***/ },
/* 41 */
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
/* 42 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(44);
	__webpack_require__(47);
	module.exports = function getOwnPropertyDescriptor(it, key){
	  return $.getDesc(it, key);
	};

/***/ },
/* 43 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(44);
	module.exports = function create(P, D){
	  return $.create(P, D);
	};

/***/ },
/* 44 */
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
	
	var $ = module.exports = __webpack_require__(48)({
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
/* 45 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	// ECMAScript 6 symbols shim
	var $        = __webpack_require__(44)
	  , setTag   = __webpack_require__(49).set
	  , uid      = __webpack_require__(50)
	  , $def     = __webpack_require__(51)
	  , keyOf    = __webpack_require__(52)
	  , enumKeys = __webpack_require__(53)
	  , assertObject = __webpack_require__(54).obj
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
	    var sym = __webpack_require__(55)(it);
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
/* 46 */
/***/ function(module, exports, __webpack_require__) {

	// 19.1.3.1 Object.assign(target, source)
	var $def = __webpack_require__(51);
	$def($def.S, 'Object', {assign: __webpack_require__(56)});

/***/ },
/* 47 */
/***/ function(module, exports, __webpack_require__) {

	var $        = __webpack_require__(44)
	  , $def     = __webpack_require__(51)
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
/* 48 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = function($){
	  $.FW   = false;
	  $.path = $.core;
	  return $;
	};

/***/ },
/* 49 */
/***/ function(module, exports, __webpack_require__) {

	var $        = __webpack_require__(44)
	  , TAG      = __webpack_require__(55)('toStringTag')
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
/* 50 */
/***/ function(module, exports, __webpack_require__) {

	var sid = 0;
	function uid(key){
	  return 'Symbol(' + key + ')_' + (++sid + Math.random()).toString(36);
	}
	uid.safe = __webpack_require__(44).g.Symbol || uid;
	module.exports = uid;

/***/ },
/* 51 */
/***/ function(module, exports, __webpack_require__) {

	var $          = __webpack_require__(44)
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
/* 52 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(44);
	module.exports = function(object, el){
	  var O      = $.toObject(object)
	    , keys   = $.getKeys(O)
	    , length = keys.length
	    , index  = 0
	    , key;
	  while(length > index)if(O[key = keys[index++]] === el)return key;
	};

/***/ },
/* 53 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(44);
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
/* 54 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(44);
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
/* 55 */
/***/ function(module, exports, __webpack_require__) {

	var global = __webpack_require__(44).g
	  , store  = {};
	module.exports = function(name){
	  return store[name] || (store[name] =
	    global.Symbol && global.Symbol[name] || __webpack_require__(50).safe('Symbol.' + name));
	};

/***/ },
/* 56 */
/***/ function(module, exports, __webpack_require__) {

	var $        = __webpack_require__(44)
	  , enumKeys = __webpack_require__(53);
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

/***/ }
/******/ ]);
//# sourceMappingURL=index.js.map