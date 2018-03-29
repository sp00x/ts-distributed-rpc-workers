"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var TaskStatus;
(function (TaskStatus) {
    TaskStatus[TaskStatus["Initialized"] = 0] = "Initialized";
    TaskStatus[TaskStatus["Enqueued"] = 10] = "Enqueued";
    TaskStatus[TaskStatus["Assigned"] = 20] = "Assigned";
    TaskStatus[TaskStatus["Succeeded"] = 30] = "Succeeded";
    TaskStatus[TaskStatus["Failed"] = 40] = "Failed";
})(TaskStatus = exports.TaskStatus || (exports.TaskStatus = {}));
var Task = (function () {
    function Task() {
    }
    return Task;
}());
exports.Task = Task;
//# sourceMappingURL=task.js.map