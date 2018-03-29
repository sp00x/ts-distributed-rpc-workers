/// <reference types="node" />
/// <reference types="ws" />
import { EventEmitter } from 'events';
import * as WebSocket from 'ws';
import { IRequest, IResponse } from './request-response-common';
import { ILogger } from '@sp00x/log-interface';
export declare type ResponseCallback = (request: IRequest, response: IResponse) => void;
export declare function parseJSON<T>(data: any, errorMessage?: string): any;
export interface IPendingRequest {
    sentTime: number;
    request: IRequest;
    callback: ResponseCallback;
}
export declare type RequestHandler = (request: IRequest) => Promise<any>;
export declare type RequestHandlerMap = {
    [command: string]: RequestHandler;
};
export declare class RequestError extends Error {
    code: string;
    isFatal?: boolean;
    innerError?: Error;
    constructor(message: string, code: string, isFatal?: boolean, innerError?: Error);
}
export declare class Connection extends EventEmitter {
    socket: WebSocket;
    log: ILogger;
    pendingRequests: {
        [requestId: string]: IPendingRequest;
    };
    requestHandlers: RequestHandlerMap;
    disconnected(): void;
    constructor(socket: WebSocket, log: ILogger, requestHandlers?: RequestHandlerMap);
    send(message: IRequest | IResponse): Promise<void>;
    sendReceive(command: string, data: any): Promise<IResponse>;
    handleMessage(message: IRequest | IResponse): Promise<void>;
}
export declare class OutgoingConnection extends Connection {
    constructor(url: string, log: ILogger, requestHandlers?: RequestHandlerMap);
}
