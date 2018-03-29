/// <reference types="ws" />
import * as WebSocket from 'ws';
import { Hub } from './hub';
import { IServiceWorker } from './service';
import { Connection } from './connection';
import { ILogger } from '@sp00x/log-interface';
export declare class RemoteClient extends Connection {
    id: string;
    sessionId: string;
    createdTime: number;
    lastActiveTime: number;
    hub: Hub;
    services: {
        [serviceName: string]: IServiceWorker;
    };
    constructor(hub: Hub, sessionId: string, socket: WebSocket, log: ILogger);
    private rejectCommand(req);
    private handshake(req);
    private registerService(req);
    private unregisterService(req);
    private submitTask(req);
}
