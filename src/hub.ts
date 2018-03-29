import { Server } from 'ws';
import * as WebSocket from 'ws';
import { sprintf } from 'sprintf-js';

import { Service, IServiceWorker } from './service';
import { RemoteClient } from './remote-client';

import { IRequest, IResponse, IHandshakeArgs, IServiceRegistrationArgs, IServiceUnregistrationArgs, ITaskSubmitArgs} from './request-response-common';
import { ILogger, PrefixedLogger, NullLogger } from '@sp00x/log-interface';

export type HandshakeValidator = (client: RemoteClient, args: IHandshakeArgs) => Promise<void>;
export type RegisterServiceValidator = (client: RemoteClient, args: IServiceRegistrationArgs) => Promise<void>;

export interface IHubOptions
{
    port?: number;
    logger?: ILogger;
    handshakeValidator?: HandshakeValidator;
    registerServiceValidator?: RegisterServiceValidator;
}

export class Hub
{
    log: ILogger;    
    port: number;
    handshakeValidator: HandshakeValidator;
    registerServiceValidator: RegisterServiceValidator;

    server: Server;
    connId: number = 0;

    clients: RemoteClient[] = [];
    services: {[name: string]: Service} = {};

    constructor(options: IHubOptions)
    {
        this.log = options.logger || new NullLogger();
        this.port = options.port;
        this.handshakeValidator = options.handshakeValidator;
        this.registerServiceValidator = options.registerServiceValidator;
    }

    getClientById(id: string): RemoteClient
    {
        return this.clients.find(cli => cli.id == id);
    }

    hasService(serviceName: string): boolean
    {
        return this.services[serviceName] != null;
    }

    getService(serviceName: string, create: boolean = false): Service
    {
        let service: Service = this.services[serviceName];
        if (service == null && create === true)
        {
            this.log.info("Creating service: '%s'", serviceName);

            service = new Service(
                serviceName,
                this,
                new PrefixedLogger(sprintf("[svc=%s] ", serviceName), this.log)
            );

            this.services[service.name] = service;
        }
        return service;
    }

    async validateHandshake(client: RemoteClient, handshake: IHandshakeArgs): Promise<void>
    {
        if (this.handshakeValidator != null)
            await this.handshakeValidator(client, handshake);
    }

    async validateServiceRegistration(client: RemoteClient, serviceRegistration: IServiceRegistrationArgs): Promise<void>
    {
        if (this.registerServiceValidator != null)
            await this.registerServiceValidator(client, serviceRegistration);
    }

    async start(): Promise<void>
    {
        return new Promise<void>((resolve, reject) =>
        {
            const { log } = this;

            let listening = false;

            let errHandler = (e: Error) => {
                this.server.removeListener('listening', listenHandler);
                log.error("Error listening: %s", e.message);
                reject(e);
            }

            let listenHandler = () => {
                log.info("Listening!");
                listening = true;
                this.server.removeListener('error', errHandler);
                resolve();
            }

            log.info("Starting hub on port %d ..", this.port);

            this.server = new Server({ port: this.port });

            this.server.on('connection', (ws: WebSocket) =>
            {
                let sessionId = (this.connId++).toString();
                const log = new PrefixedLogger(sprintf("[sid=%s] ", sessionId), this.log);
                log.info("Accepted new connection");

                let client = new RemoteClient(this, sessionId, ws, log);
                this.clients.push(client);
                client.on('close', () =>
                {
                    log.info("Connection closed");
                    let i = this.clients.indexOf(client);
                    if (i >= 0) this.clients.splice(i, 1);
                })
            })

            this.server.on('error', e =>
            {
                if (listening)
                    log.error("Server error: %s", e.message);
            })

            // set up temporary handlers while starting..
            this.server.once('listening', listenHandler);
            this.server.once('error', errHandler);
        })
    }

    async stop(): Promise<void>
    {
        this.server.close();
    }
}
