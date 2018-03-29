import { ITaskSubmitArgs, IRequest } from "./request-response-common";
import { RemoteClient } from "./remote-client";
import { IServiceWorker } from "./service";

export enum TaskStatus 
{
    Initialized = 0,
    Enqueued = 10,
    Assigned = 20,
    Succeeded = 30,
    Failed = 40 // -> see result for error, I guess?
}

export class Task
{
    callback: (err?: Error) => void;

    // incoming
    request: IRequest;
    args: ITaskSubmitArgs;
    client: RemoteClient;
    receivedTime: number;

    // status
    status: TaskStatus;
    assignedWorker?: IServiceWorker;
    assignedTime?: number;
    
    // outgoing
    completedTime?: number; // result received
    result?: any;
    finalizedTime?: number; // result sent
}

export interface ITaskStatusResponse
{
    requestId: string; // request id
    serviceName: string; // service name
    status: TaskStatus;
    time: number;
}
