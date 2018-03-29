"use strict";
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
var ws_1 = require("ws");
var sprintf_js_1 = require("sprintf-js");
var service_1 = require("./service");
var remote_client_1 = require("./remote-client");
var log_interface_1 = require("@sp00x/log-interface");
var Hub = (function () {
    function Hub(options) {
        this.connId = 0;
        this.clients = [];
        this.services = {};
        this.log = options.logger || new log_interface_1.NullLogger();
        this.port = options.port;
        this.handshakeValidator = options.handshakeValidator;
        this.registerServiceValidator = options.registerServiceValidator;
    }
    Hub.prototype.getClientById = function (id) {
        return this.clients.find(function (cli) { return cli.id == id; });
    };
    Hub.prototype.hasService = function (serviceName) {
        return this.services[serviceName] != null;
    };
    Hub.prototype.getService = function (serviceName, create) {
        if (create === void 0) { create = false; }
        var service = this.services[serviceName];
        if (service == null && create === true) {
            this.log.info("Creating service: '%s'", serviceName);
            service = new service_1.Service(serviceName, this, new log_interface_1.PrefixedLogger(sprintf_js_1.sprintf("[svc=%s] ", serviceName), this.log));
            this.services[service.name] = service;
        }
        return service;
    };
    Hub.prototype.validateHandshake = function (client, handshake) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this.handshakeValidator != null)) return [3, 2];
                        return [4, this.handshakeValidator(client, handshake)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2];
                }
            });
        });
    };
    Hub.prototype.validateServiceRegistration = function (client, serviceRegistration) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this.registerServiceValidator != null)) return [3, 2];
                        return [4, this.registerServiceValidator(client, serviceRegistration)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2];
                }
            });
        });
    };
    Hub.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2, new Promise(function (resolve, reject) {
                        var log = _this.log;
                        var listening = false;
                        var errHandler = function (e) {
                            _this.server.removeListener('listening', listenHandler);
                            log.error("Error listening: %s", e.message);
                            reject(e);
                        };
                        var listenHandler = function () {
                            log.info("Listening!");
                            listening = true;
                            _this.server.removeListener('error', errHandler);
                            resolve();
                        };
                        log.info("Starting hub on port %d ..", _this.port);
                        _this.server = new ws_1.Server({ port: _this.port });
                        _this.server.on('connection', function (ws) {
                            var sessionId = (_this.connId++).toString();
                            var log = new log_interface_1.PrefixedLogger(sprintf_js_1.sprintf("[sid=%s] ", sessionId), _this.log);
                            log.info("Accepted new connection");
                            var client = new remote_client_1.RemoteClient(_this, sessionId, ws, log);
                            _this.clients.push(client);
                            client.on('close', function () {
                                log.info("Connection closed");
                                var i = _this.clients.indexOf(client);
                                if (i >= 0)
                                    _this.clients.splice(i, 1);
                            });
                        });
                        _this.server.on('error', function (e) {
                            if (listening)
                                log.error("Server error: %s", e.message);
                        });
                        _this.server.once('listening', listenHandler);
                        _this.server.once('error', errHandler);
                    })];
            });
        });
    };
    Hub.prototype.stop = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.server.close();
                return [2];
            });
        });
    };
    return Hub;
}());
exports.Hub = Hub;
//# sourceMappingURL=hub.js.map