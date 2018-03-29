import { Task } from './task';
import { RemoteClient } from './remote-client';
import { IServiceRegistrationArgs, ITaskSubmitArgs, IRequest } from './request-response-common';
import { ILogger } from '@sp00x/log-interface';
import { Hub } from './hub';
export interface IServiceWorker {
    service: Service;
    client: RemoteClient;
    args: IServiceRegistrationArgs;
    assignedTasks: Task[];
}
export declare class Service {
    name: string;
    log: ILogger;
    hub: Hub;
    queuedTasks: Task[];
    assignedTasks: Task[];
    completedTasks: Task[];
    nextWorkerIndex: number;
    workers: IServiceWorker[];
    totalCapacity: number;
    constructor(name: string, hub: Hub, log: ILogger);
    registerServiceWorker(client: RemoteClient, args: IServiceRegistrationArgs): IServiceWorker;
    unregisterServiceWorker(client: RemoteClient): boolean;
    invoke(client: RemoteClient, args: ITaskSubmitArgs, request: IRequest): Promise<any>;
    private processNext();
}
