"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var _bullmq = require("bullmq");

var _moment = _interopRequireDefault(require("moment"));

var _ioredis = _interopRequireDefault(require("ioredis"));

var _dotenv = _interopRequireDefault(require("dotenv"));

var _nodeCron = _interopRequireDefault(require("node-cron"));

var _mongoose = _interopRequireWildcard(require("mongoose"));

var _model = _interopRequireDefault(require("./model"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

_dotenv["default"].config();

var _process$env = process.env,
    REDIS_URL = _process$env.REDIS_URL,
    MONGO_DB = _process$env.MONGO_DB;
var connection = new _ioredis["default"](REDIS_URL);

var Booking = _mongoose["default"].model('Booking', new _mongoose.Schema(_model["default"]), 'Booking'); // cron jobs


function cronJob(_x, _x2) {
  return _cronJob.apply(this, arguments);
} // create notification streams for bookings added to cron


function _cronJob() {
  _cronJob = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(willExpireAt, booking) {
    var expireAt;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            expireAt = (0, _moment["default"])(willExpireAt).format('mm HH DD MM');
            expireAt += ' *';

            _nodeCron["default"].schedule(expireAt, /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
              var id, foundBooking, userNotification;
              return regeneratorRuntime.wrap(function _callee$(_context) {
                while (1) {
                  switch (_context.prev = _context.next) {
                    case 0:
                      _context.next = 2;
                      return _mongoose["default"].connect(MONGO_DB, {
                        useNewUrlParser: true,
                        useUnifiedTopology: true
                      });

                    case 2:
                      id = booking.booking.id;
                      console.log("Running task for bookind Id ".concat(id, " at ").concat((0, _moment["default"])().format()));
                      _context.prev = 4;
                      _context.next = 7;
                      return Booking.findById(id);

                    case 7:
                      foundBooking = _context.sent;

                      if (!(foundBooking.status === 'pending')) {
                        _context.next = 17;
                        break;
                      }

                      foundBooking.status = 'rejected';
                      _context.next = 12;
                      return foundBooking.save();

                    case 12:
                      console.log(foundBooking.status);
                      userNotification = new _bullmq.Queue(foundBooking.userId, {
                        connection: connection
                      });
                      userNotification.add({
                        bookingStatus: 'rejected',
                        bookingId: foundBooking.id
                      });

                      _mongoose["default"].connection.close();

                      console.log('connection to mongo db closed');

                    case 17:
                      _context.next = 22;
                      break;

                    case 19:
                      _context.prev = 19;
                      _context.t0 = _context["catch"](4);
                      console.log(_context.t0);

                    case 22:
                    case "end":
                      return _context.stop();
                  }
                }
              }, _callee, null, [[4, 19]]);
            })));

          case 3:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));
  return _cronJob.apply(this, arguments);
}

function bookingWorker() {
  return _bookingWorker.apply(this, arguments);
}

function _bookingWorker() {
  _bookingWorker = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
    var worker;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            worker = new _bullmq.Worker('bookingWaitingQueue', /*#__PURE__*/function () {
              var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(job) {
                var booking, requestedAt, willExpireAt;
                return regeneratorRuntime.wrap(function _callee3$(_context3) {
                  while (1) {
                    switch (_context3.prev = _context3.next) {
                      case 0:
                        booking = _objectSpread({}, job.data);
                        requestedAt = (0, _moment["default"])(booking.bookingRequestedAt);
                        willExpireAt = requestedAt.add(2, 'minute');
                        cronJob(willExpireAt, booking);

                      case 4:
                      case "end":
                        return _context3.stop();
                    }
                  }
                }, _callee3);
              }));

              return function (_x3) {
                return _ref2.apply(this, arguments);
              };
            }(), {
              connection: connection
            });
            worker.on('failed', function (job, err) {
              console.log("".concat(job.id, " has failed with ").concat(err.message));
            });
            worker.on('drained', function () {
              // Queue is drained, no more jobs left
              console.log('no jobs');
            });
            worker.on('completed', function (job) {
              // job has completed
              var data = _objectSpread({}, job.data.booking);

              var userId = data.userId,
                  id = data.id;
              console.log(" Job id ".concat(job.id, " added to cron for booking Id ").concat(id, " and userId ").concat(userId));
              var userNotification = new _bullmq.Queue(userId, {
                connection: connection
              });
              userNotification.add({
                booking_status: 'rejected'
              });
            });

          case 4:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4);
  }));
  return _bookingWorker.apply(this, arguments);
}

bookingWorker();