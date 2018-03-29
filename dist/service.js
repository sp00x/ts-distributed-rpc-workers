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
var task_1 = require("./task");
var queue = require('queue');
var Service = (function () {
    function Service(name, hub, log) {
        this.queuedTasks = [];
        this.assignedTasks = [];
        this.completedTasks = [];
        this.nextWorkerIndex = 0;
        this.workers = [];
        this.totalCapacity = 0;
        this.name = name;
        this.hub = hub;
        this.log = log;
    }
    Service.prototype.registerServiceWorker = function (client, args) {
        var log = this.log;
        log.info("Adding service worker: %s ..", client.id);
        var sw = {
            service: this,
            client: client,
            args: args,
            assignedTasks: []
        };
        this.workers.push(sw);
        this.totalCapacity += sw.args.capacity;
        log.info("New capacity for service is %d (+%d)", this.totalCapacity, sw.args.capacity);
        this.processNext();
        return sw;
    };
    Service.prototype.unregisterServiceWorker = function (client) {
        var log = this.log;
        log.info("Unregistering service worker: %s ..", client.id);
        log.info("Removing client %s from pool..", client.id);
        var sw = this.workers.find(function (w) { return w.client == client; });
        if (sw != null) {
            var i = this.workers.indexOf(sw);
            if (i < this.nextWorkerIndex)
                this.nextWorkerIndex--;
            this.workers.splice(i, 1);
            this.totalCapacity -= sw.args.capacity;
            log.info("Removed client %s from pool, new capacity is %d (-%d)", client.id, this.totalCapacity, sw.args.capacity);
            return true;
        }
        else {
            log.warn("Could not find client %s in pool?!", client.id);
            return false;
        }
    };
    Service.prototype.invoke = function (client, args, request) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2, new Promise(function (resolve, reject) {
                        var log = _this.log;
                        log.info("Enqueuing task for client %s ..", client.id);
                        var task = new task_1.Task();
                        task.status = task_1.TaskStatus.Initialized;
                        task.request = request;
                        task.args = args;
                        task.client = client;
                        task.receivedTime = Date.now();
                        task.callback = function (err) {
                            if (err)
                                reject(err);
                            else
                                resolve(task.result);
                        };
                        _this.queuedTasks.push(task);
                        setImmediate(function () { return _this.processNext(); });
                    })];
            });
        });
    };
    Service.prototype.processNext = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var log, worker, i, task, _a, err_1, i;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        log = this.log;
                        log.debug("<processNext> #assigned = %d, #capacity = %d, #queued = %d", this.assignedTasks.length, this.totalCapacity, this.queuedTasks.length);
                        if (!(this.assignedTasks.length < this.totalCapacity && this.queuedTasks.length > 0)) return [3, 8];
                        log.info("processNext: have tasks & capacity, finding next available worker..");
                        worker = void 0;
                        for (i = 0; this.workers.length > i; i++) {
                            worker = this.workers[this.nextWorkerIndex];
                            this.nextWorkerIndex = (this.nextWorkerIndex + 1) % this.workers.length;
                            if (worker.assignedTasks.length < worker.args.capacity)
                                break;
                            worker = null;
                        }
                        if (!(worker != null)) return [3, 6];
                        log.info("processNext: assigned worker %s", worker.client.id);
                        task = this.queuedTasks.shift();
                        log.info("dequeed task: [%s] %j", task.client.id, task.args);
                        task.assignedTime = Date.now();
                        task.assignedWorker = worker;
                        task.status = task_1.TaskStatus.Assigned;
                        this.assignedTasks.push(task);
                        worker.assignedTasks.push(task);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, 4, 5]);
                        log.info("processNext: dispatching...");
                        _a = task;
                        return [4, worker.client.sendReceive('task.submit', task.args)];
                    case 2:
                        _a.result = _b.sent();
                        task.status = task_1.TaskStatus.Succeeded;
                        log.info("processNext: finished! result = %j", task.result);
                        task.completedTime = Date.now();
                        task.callback(null);
                        return [3, 5];
                    case 3:
                        err_1 = _b.sent();
                        log.error("processNext: ERROR! %s", err_1.message);
                        task.status = task_1.TaskStatus.Failed;
                        task.callback(err_1);
                        return [3, 5];
                    case 4:
                        i = worker.assignedTasks.indexOf(task);
                        if (i >= 0)
                            worker.assignedTasks.splice(i, 1);
                        i = this.assignedTasks.indexOf(task);
                        if (i >= 0)
                            this.assignedTasks.splice(i, 1);
                        return [7];
                    case 5: return [3, 7];
                    case 6:
                        log.error("Could not find an available worker?!");
                        _b.label = 7;
                    case 7:
                        setImmediate(function () { return _this.processNext(); });
                        _b.label = 8;
                    case 8: return [2];
                }
            });
        });
    };
    return Service;
}());
exports.Service = Service;
//# sourceMappingURL=service.js.map