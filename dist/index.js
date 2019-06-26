'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _querystring = require('querystring');

var _querystring2 = _interopRequireDefault(_querystring);

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _rateLimitPromise = require('rate-limit-promise');

var _rateLimitPromise2 = _interopRequireDefault(_rateLimitPromise);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var debug = (0, _debug2.default)('CDO');

var CDO = function () {
  function CDO(token) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, CDO);

    this.token = token;
    this.opts = _lodash2.default.merge({}, opts);
    this.secondLimiter = (0, _rateLimitPromise2.default)(5, 1000 + CDO.RATE_LIMIT_EPSILON_MS);
    this.dayLimiter = (0, _rateLimitPromise2.default)(10000, 1000 * 60 * 60 * 24 + CDO.RATE_LIMIT_EPSILON_MS);
  }

  _createClass(CDO, [{
    key: 'datasets',
    value: function datasets() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      return this.request('datasets', _extends({ params: params }, config));
    }
  }, {
    key: 'dataset',
    value: function dataset(id) {
      var config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      return this.request('datasets/' + id, config);
    }
  }, {
    key: 'datacategories',
    value: function datacategories() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      return this.request('datacategories', _extends({ params: params }, config));
    }
  }, {
    key: 'datacategory',
    value: function datacategory(id) {
      var config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      return this.request('datacategories/' + id, config);
    }
  }, {
    key: 'datatypes',
    value: function datatypes() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      return this.request('datatypes', _extends({ params: params }, config));
    }
  }, {
    key: 'datatype',
    value: function datatype(id) {
      var config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      return this.request('datatypes/' + id, config);
    }
  }, {
    key: 'locationcategories',
    value: function locationcategories() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      return this.request('locationcategories', _extends({ params: params }, config));
    }
  }, {
    key: 'locationcategory',
    value: function locationcategory(id) {
      var config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      return this.request('locationcategories/' + id, config);
    }
  }, {
    key: 'locations',
    value: function locations() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      return this.request('locations', _extends({ params: params }, config));
    }
  }, {
    key: 'location',
    value: function location(id) {
      var config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      return this.request('locations/' + id, config);
    }
  }, {
    key: 'stations',
    value: function stations() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      return this.request('stations', _extends({ params: params }, config));
    }
  }, {
    key: 'station',
    value: function station(id) {
      var config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      return this.request('stations/' + id, config);
    }
  }, {
    key: 'data',
    value: function data() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      return this.request('data', _extends({ params: params }, config));
    }
  }, {
    key: 'all',
    value: function all(method /*, params={}*/) /*, iteratee */{
      var _method,
          _this = this;

      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      var iteratee = args.pop();
      var params = args.shift() || {};
      if (typeof method === 'string') method = _lodash2.default.get(this, method);
      return (_method = method).call.apply(_method, [this, params].concat(args)).then(function (res) {
        return Promise.resolve(iteratee(res)).then(function (done) {
          if (done) return res;
          var nextParams = _this.constructor.paramsForNextPage((0, _lodash2.default)(res.metadata.resultset).pick('offset', 'limit').defaults(params).value());
          if (params.offset >= res.metadata.resultset.count - params.limit) return null;
          return _this.all.apply(_this, [method, nextParams].concat(args, [iteratee]));
        });
      });
    }
  }, {
    key: 'request',
    value: function request(resource) {
      var _this2 = this,
          _arguments = arguments;

      var config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var mergedConfig = _lodash2.default.merge({
        baseURL: 'http://www.ncdc.noaa.gov/cdo-web/api/v2/',
        headers: { token: this.token }
      }, this.opts.config, { params: this.opts.params }, config);
      var params = mergedConfig.params || {};['startdate', 'enddate'].forEach(function (prop) {
        if (prop in params) params[prop] = CDO.formatDate(params[prop]);
      });
      var readableURL = '/' + resource + (_lodash2.default.isEmpty(params) ? '' : ' ') + _querystring2.default.stringify(params);
      return Promise.all([this.secondLimiter(), this.dayLimiter()]).then(function () {
        return (0, _axios2.default)(resource, mergedConfig);
      }).catch(function (res) {
        var status = res.status,
            statusText = res.statusText;

        debug('%s (%s %s)', readableURL, status, statusText);
        if (status === 429) return _this2.request.apply(_this2, _arguments); // rate limited, try again
        throw res;
      }).then(function (_ref) {
        var status = _ref.status,
            statusText = _ref.statusText,
            data = _ref.data;

        debug('%s (%s %s)', readableURL, status, statusText);
        return data;
      });
    }
  }], [{
    key: 'paramsForNextPage',
    value: function paramsForNextPage(currentPageParams) {
      return CDO._paramsForSiblingPage(currentPageParams, 'next');
    }
  }, {
    key: 'paramsForPrevPage',
    value: function paramsForPrevPage(currentPageParams) {
      return CDO._paramsForSiblingPage(currentPageParams, 'prev');
    }
  }, {
    key: '_paramsForSiblingPage',
    value: function _paramsForSiblingPage() {
      var currentPageParams = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var direction = arguments[1];
      var offset = currentPageParams.offset,
          _currentPageParams$li = currentPageParams.limit,
          limit = _currentPageParams$li === undefined ? this.DEFAULT_LIMIT : _currentPageParams$li;

      if (typeof offset !== 'number' || offset < 0) offset = 0;else offset = {
        next: offset + limit,
        prev: offset - limit
      }[direction];
      return _lodash2.default.defaults({ offset: offset, limit: limit }, currentPageParams);
    }
  }, {
    key: 'formatDate',
    value: function formatDate(date) {
      if (typeof date === 'string') return date;
      date = new Date(date);
      return date.getUTCFullYear() + '-' + CDO._formatDatePart(date.getUTCMonth() + 1) + '-' + CDO._formatDatePart(date.getUTCDate());
    }
  }, {
    key: '_formatDatePart',
    value: function _formatDatePart(part) {
      return _lodash2.default.padStart(part, 2, '0');
    }
  }]);

  return CDO;
}();

CDO.RATE_LIMIT_EPSILON_MS = 200;
CDO.DEFAULT_LIMIT = 25;

module.exports = CDO;