"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var events_1 = require("events");
var WebSocket = require("ws");
var uuid = require('uuid4');
var CircularJSON = require("circular-json");
function parseJSON(data, errorMessage) {
    if (errorMessage == null)
        return JSON.parse(data);
    try {
        return JSON.parse(data);
    }
    catch (e) {
        throw new Error(errorMessage + ' (' + e.message + ')');
    }
}
exports.parseJSON = parseJSON;
var RequestError = (function (_super) {
    __extends(RequestError, _super);
    function RequestError(message, code, isFatal, innerError) {
        var _newTarget = this.constructor;
        if (isFatal === void 0) { isFatal = false; }
        var _this = _super.call(this, message) || this;
        _this.code = code;
        _this.isFatal = isFatal;
        _this.innerError = innerError;
        var actualProto = _newTarget.prototype;
        if (Object.setPrototypeOf) {
            Object.setPrototypeOf(_this, actualProto);
        }
        else {
            _this.__proto__ = _newTarget.prototype;
        }
        return _this;
    }
    return RequestError;
}(Error));
exports.RequestError = RequestError;
var Connection = (function (_super) {
    __extends(Connection, _super);
    function Connection(socket, log, requestHandlers) {
        var _this = _super.call(this) || this;
        _this.pendingRequests = {};
        _this.log = log;
        _this.socket = socket;
        _this.requestHandlers = requestHandlers;
        _this.socket.on('open', function () {
            log.info("socket open");
            _this.emit('open');
        });
        _this.socket.on('error', function (e) {
            log.error("socket error: %s", e.message);
            _this.disconnected();
            _this.emit('error', e);
        });
        socket.on('message', function (data) { return __awaiter(_this, void 0, void 0, function () {
            var message;
            return __generator(this, function (_a) {
                message = null;
                try {
                    log.info("received: %s", data);
                    message = parseJSON(data, "Error parsing message data as JSON object");
                    this.emit('message', message);
                    this.handleMessage(message);
                }
                catch (e) {
                    log.error("error while processing message: %s, at %s", e.message, e.stack);
                }
                return [2];
            });
        }); });
        _this.socket.on('close', function (code, reason) {
            log.error("socket closed: %s (%s)", code, reason);
            _this.disconnected();
            _this.emit('close', code, reason);
        });
        return _this;
    }
    Connection.prototype.disconnected = function () {
        for (var requestId in this.pendingRequests) {
            var pendingRequest = this.pendingRequests[requestId];
            pendingRequest.callback(pendingRequest.request, { id: requestId, error: { message: 'Server disconnected before we could get a response', code: 'E_SERVER_DISCONNECTED' } });
        }
        this.pendingRequests = {};
    };
    Connection.prototype.send = function (message) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2, new Promise(function (resolve, reject) {
                        var messageJSON = CircularJSON.stringify(message);
                        _this.log.debug("send: %s", messageJSON);
                        _this.socket.send(messageJSON, function (err) {
                            if (err)
                                reject(err);
                            else
                                resolve();
                        });
                    })];
            });
        });
    };
    Connection.prototype.sendReceive = function (command, data) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var log;
            return __generator(this, function (_a) {
                log = this.log;
                return [2, new Promise(function (resolve, reject) {
                        var request = {
                            id: uuid(),
                            command: command,
                            data: data
                        };
                        log.info("%s: sending '%s' (%j) ..", request.id, request.command, request.data);
                        _this.pendingRequests[request.id] =
                            {
                                sentTime: Date.now(),
                                request: request,
                                callback: function (req, res) {
                                    log.info("%s: callback -> %j", request.id, res);
                                    if (res.error == null) {
                                        log.info("%s: succesfull: %j", request.id, res);
                                        resolve(res);
                                    }
                                    else {
                                        log.error("%s: failed: %s", request.id, res.error.message);
                                        reject(new RequestError(res.error.message, res.error.code));
                                    }
                                }
                            };
                        var outgoingMessage = JSON.stringify(request);
                        log.info("%s: sending JSON: %s", request.id, outgoingMessage);
                        _this.socket.send(outgoingMessage, function (err) {
                            if (err) {
                                log.error("%s: failed to send request to hub: %s", request.id, err);
                                delete _this.pendingRequests[request.id];
                                reject(err);
                            }
                            log.info("%s: waiting for response..", request.id);
                        });
                    })];
            });
        });
    };
    Connection.prototype.handleMessage = function (message) {
        return __awaiter(this, void 0, void 0, function () {
            var log, pendingRequest, response, request, response, handler, _a, e_1, re, e_2, e_3;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        log = this.log;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 15, , 16]);
                        pendingRequest = this.pendingRequests[message.id];
                        if (!(pendingRequest != null)) return [3, 2];
                        response = message;
                        log.info("matched pending request -> dispatching callback");
                        delete this.pendingRequests[response.id];
                        pendingRequest.callback(pendingRequest.request, response);
                        this.emit('response', response);
                        return [3, 14];
                    case 2:
                        log.info("did not match pending request - maybe a request?");
                        request = message;
                        response = {
                            id: request.id
                        };
                        if (!(this.requestHandlers != null)) return [3, 13];
                        _b.label = 3;
                    case 3:
                        _b.trys.push([3, 11, , 12]);
                        handler = this.requestHandlers[request.command];
                        if (handler === undefined)
                            handler = handler = this.requestHandlers['*'];
                        if (!(handler != null)) return [3, 8];
                        _b.label = 4;
                    case 4:
                        _b.trys.push([4, 6, , 7]);
                        _a = response;
                        return [4, handler(request)];
                    case 5:
                        _a.data = _b.sent();
                        return [3, 7];
                    case 6:
                        e_1 = _b.sent();
                        if (e_1 instanceof RequestError) {
                            re = e_1;
                            response.error = {
                                message: re.message,
                                code: re.code
                            };
                        }
                        else
                            response.error = { message: e_1.message };
                        return [3, 7];
                    case 7: return [3, 9];
                    case 8:
                        response.error = { message: 'Unknown command', code: 'E_BADCOMMAND' };
                        _b.label = 9;
                    case 9: return [4, this.send(response)];
                    case 10:
                        _b.sent();
                        return [3, 12];
                    case 11:
                        e_2 = _b.sent();
                        log.error("Error while processing request or sending response: %s, at %s", e_2.message, e_2.stack);
                        return [3, 12];
                    case 12: return [3, 14];
                    case 13:
                        this.emit('request', request);
                        _b.label = 14;
                    case 14: return [3, 16];
                    case 15:
                        e_3 = _b.sent();
                        log.error("Error in handleMessage(): %s, at %s", e_3.message, e_3.stack);
                        return [3, 16];
                    case 16: return [2];
                }
            });
        });
    };
    return Connection;
}(events_1.EventEmitter));
exports.Connection = Connection;
var OutgoingConnection = (function (_super) {
    __extends(OutgoingConnection, _super);
    function OutgoingConnection(url, log, requestHandlers) {
        return _super.call(this, new WebSocket(url), log, requestHandlers) || this;
    }
    return OutgoingConnection;
}(Connection));
exports.OutgoingConnection = OutgoingConnection;
//# sourceMappingURL=connection.js.map