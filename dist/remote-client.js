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
var sprintf_js_1 = require("sprintf-js");
var connection_1 = require("./connection");
var log_interface_1 = require("@sp00x/log-interface");
var RemoteClient = (function (_super) {
    __extends(RemoteClient, _super);
    function RemoteClient(hub, sessionId, socket, log) {
        var _this = _super.call(this, socket, log, {
            'handshake': function (r) { return _this.handshake(r); },
            '*': function (r) { return _this.rejectCommand(r); }
        }) || this;
        _this.services = {};
        _this.id = null;
        _this.hub = hub;
        _this.sessionId = sessionId;
        _this.createdTime = Date.now();
        _this.lastActiveTime = _this.createdTime;
        _this.on('close', function (code, reason) {
            _this.log.info("Close: %s (%s)", code, reason);
            for (var serviceName in _this.services) {
                _this.log.info("Close -> unregister service worker '%s'", serviceName);
                var service = hub.getService(serviceName);
                service.unregisterServiceWorker(_this);
            }
            _this.log.info("Close -> ended.", sessionId);
        });
        return _this;
    }
    RemoteClient.prototype.rejectCommand = function (req) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, hub, log;
            return __generator(this, function (_b) {
                _a = this, hub = _a.hub, log = _a.log;
                log.error("Got command (%s) before handshake was completed", req.command);
                throw new connection_1.RequestError("Handshake not completed", "E_HANDSHAKE_REQUIRED", true);
            });
        });
    };
    RemoteClient.prototype.handshake = function (req) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var _a, hub, log, handshake, cli;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this, hub = _a.hub, log = _a.log;
                        log.info("Processing handshake command..");
                        if (!(this.id == null)) return [3, 2];
                        handshake = req.data;
                        cli = hub.getClientById(handshake.clientId);
                        if (cli != null)
                            throw new connection_1.RequestError("A client with that ID is already registered!", "E_HANDSHAKE_CLIENT_ID");
                        this.id = handshake.clientId;
                        this.log = log = new log_interface_1.PrefixedLogger(sprintf_js_1.sprintf("[cid=%s] ", this.id), this.log);
                        return [4, hub.validateHandshake(this, handshake)];
                    case 1:
                        _b.sent();
                        log.info("Handshake performed/accepted");
                        this.requestHandlers = {
                            'handshake': function (r) { return _this.handshake(r); },
                            'service.register': function (r) { return _this.registerService(r); },
                            'service.unregister': function (r) { return _this.unregisterService(r); },
                            'task.submit': function (r) { return _this.submitTask(r); }
                        };
                        return [3, 3];
                    case 2: throw new connection_1.RequestError("Already performed handshake", "E_HANDSHAKE_DUPLICATE");
                    case 3: return [2];
                }
            });
        });
    };
    RemoteClient.prototype.registerService = function (req) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, log, hub, svc, service;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this, log = _a.log, hub = _a.hub;
                        svc = req.data;
                        log.info("Registering service worker: '%s' [%d] ..", svc.serviceName, svc.capacity);
                        if (this.services[svc.serviceName] != null)
                            throw new Error('Worker has already registered for service "' + svc.serviceName + '"');
                        return [4, hub.validateServiceRegistration(this, svc)];
                    case 1:
                        _b.sent();
                        service = hub.getService(svc.serviceName, true);
                        this.services[service.name] = service.registerServiceWorker(this, svc);
                        log.info("Successfully registered as service worker for '%s' !", svc.serviceName);
                        return [2];
                }
            });
        });
    };
    RemoteClient.prototype.unregisterService = function (req) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, log, hub, svc, service;
            return __generator(this, function (_b) {
                _a = this, log = _a.log, hub = _a.hub;
                svc = req.data;
                log.info("Unregistering service worker: '%s' ..", svc.serviceName);
                service = hub.getService(svc.serviceName);
                if (this.services[svc.serviceName] == null || service == null)
                    throw new connection_1.RequestError('No registered worker for service "' + svc.serviceName + '"', "E_SERVICE_UNKNOWN");
                service.unregisterServiceWorker(this);
                return [2];
            });
        });
    };
    RemoteClient.prototype.submitTask = function (req) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, log, hub, task, service, result;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this, log = _a.log, hub = _a.hub;
                        task = req.data;
                        log.info("Submitting task: %j..", task);
                        service = hub.getService(task.serviceName);
                        if (service == null)
                            throw new connection_1.RequestError('No such service: "' + task.serviceName + '"', "E_SERVICE_UNKNOWN");
                        return [4, service.invoke(this, task, req)];
                    case 1:
                        result = _b.sent();
                        return [2, result];
                }
            });
        });
    };
    return RemoteClient;
}(connection_1.Connection));
exports.RemoteClient = RemoteClient;
//# sourceMappingURL=remote-client.js.map