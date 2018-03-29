/// <reference types="ws" />
import { Server } from 'ws';
import { Service } from './service';
import { RemoteClient } from './remote-client';
import { IHandshakeArgs, IServiceRegistrationArgs } from './request-response-common';
import { ILogger } from '@sp00x/log-interface';
export declare type HandshakeValidator = (client: RemoteClient, args: IHandshakeArgs) => Promise<void>;
export declare type RegisterServiceValidator = (client: RemoteClient, args: IServiceRegistrationArgs) => Promise<void>;
export interface IHubOptions {
    port?: number;
    logger?: ILogger;
    handshakeValidator?: HandshakeValidator;
    registerServiceValidator?: RegisterServiceValidator;
}
export declare class Hub {
    log: ILogger;
    port: number;
    handshakeValidator: HandshakeValidator;
    registerServiceValidator: RegisterServiceValidator;
    server: Server;
    connId: number;
    clients: RemoteClient[];
    services: {
        [name: string]: Service;
    };
    constructor(options: IHubOptions);
    getClientById(id: string): RemoteClient;
    hasService(serviceName: string): boolean;
    getService(serviceName: string, create?: boolean): Service;
    validateHandshake(client: RemoteClient, handshake: IHandshakeArgs): Promise<void>;
    validateServiceRegistration(client: RemoteClient, serviceRegistration: IServiceRegistrationArgs): Promise<void>;
    start(): Promise<void>;
    stop(): Promise<void>;
}
