import { ITaskSubmitArgs, IRequest } from "./request-response-common";
import { RemoteClient } from "./remote-client";
import { IServiceWorker } from "./service";
export declare enum TaskStatus {
    Initialized = 0,
    Enqueued = 10,
    Assigned = 20,
    Succeeded = 30,
    Failed = 40,
}
export declare class Task {
    callback: (err?: Error) => void;
    request: IRequest;
    args: ITaskSubmitArgs;
    client: RemoteClient;
    receivedTime: number;
    status: TaskStatus;
    assignedWorker?: IServiceWorker;
    assignedTime?: number;
    completedTime?: number;
    result?: any;
    finalizedTime?: number;
}
export interface ITaskStatusResponse {
    requestId: string;
    serviceName: string;
    status: TaskStatus;
    time: number;
}
