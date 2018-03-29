"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
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
var log_interface_1 = require("@sp00x/log-interface");
var connection_1 = require("./connection");
var IClientOptions = (function () {
    function IClientOptions() {
    }
    return IClientOptions;
}());
exports.IClientOptions = IClientOptions;
var Client = (function () {
    function Client(options) {
        this.services = {};
        this.port = options.port;
        this.id = options.id;
        this.hostname = options.hostname;
        this.log = options.logger || new log_interface_1.NullLogger();
    }
    Client.prototype.connect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var log;
            return __generator(this, function (_a) {
                log = this.log;
                return [2, new Promise(function (resolve, reject) {
                        var url = "ws://" + _this.hostname + ":" + _this.port;
                        log.info("connecting to hub (%s) ..", url);
                        _this.connection = new connection_1.OutgoingConnection(url, log, {
                            'task.submit': function (r) { return _this.processTask(r); }
                        });
                        _this.connection.on('open', function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        log.info("connected to hub!");
                                        log.info("performing handshake..");
                                        return [4, this.connection.sendReceive('handshake', { clientId: this.id })];
                                    case 1:
                                        _a.sent();
                                        log.info("handshaked!");
                                        resolve();
                                        return [2];
                                }
                            });
                        }); });
                        _this.connection.on('response', function (response) {
                        });
                        _this.connection.on('request', function (request) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                return [2];
                            });
                        }); });
                        _this.connection.on('closed', function (code, reason) {
                        });
                    })];
            });
        });
    };
    Client.prototype.processTask = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var log, task, service, result, err_1, i;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        log = this.log;
                        task = request.data;
                        log.info("hub issued task submit request, looking up service '%s'..", task.serviceName);
                        service = this.services[task.serviceName];
                        if (service == null) {
                            log.error("could not find service: '%s'");
                            throw new Error('Service not found: "' + task.serviceName + '"');
                        }
                        log.info("matched service '%s', processing task..", task.serviceName);
                        service.pendingRequests.push(request);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, , 6, 7]);
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        log.info("dispatching to service processor..");
                        return [4, service.processor(task.args)];
                    case 3:
                        result = _a.sent();
                        log.info("successfully processed, result: %j", result);
                        return [2, result];
                    case 4:
                        err_1 = _a.sent();
                        log.error("error while dispatching to service processor: %s, at %s", err_1.message, err_1.stack);
                        throw new Error("Internal error while dispatching to service processor");
                    case 5: return [3, 7];
                    case 6:
                        i = service.pendingRequests.indexOf(request);
                        if (i >= 0)
                            service.pendingRequests.splice(i, 1);
                        log.info("finished processing task, #pendingRequests = %d", service.pendingRequests.length);
                        return [7];
                    case 7: return [2];
                }
            });
        });
    };
    Client.prototype.invoke = function (serviceName, args) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.connection.sendReceive('task.submit', {
                            serviceName: serviceName,
                            args: args
                        })];
                    case 1:
                        response = _a.sent();
                        return [2, response.data.data];
                }
            });
        });
    };
    Client.prototype.registerService = function (args, processor) {
        return __awaiter(this, void 0, void 0, function () {
            var regSvc;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (args.capacity < 0 || args.capacity == null || isNaN(args.capacity) || typeof args.capacity != 'number')
                            throw new Error("Invalid capacity value");
                        regSvc = __assign({}, args, { processor: processor, pendingRequests: [] });
                        return [4, this.connection.sendReceive('service.register', args)];
                    case 1:
                        _a.sent();
                        this.services[regSvc.serviceName] = regSvc;
                        return [2];
                }
            });
        });
    };
    return Client;
}());
exports.Client = Client;
//# sourceMappingURL=client.js.map