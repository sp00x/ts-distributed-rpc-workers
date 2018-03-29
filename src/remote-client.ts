import * as WebSocket from 'ws';
import { sprintf } from 'sprintf-js';

import { Hub } from './hub';
import { IResponse, IRequest, IHandshakeArgs, IServiceRegistrationArgs, IServiceUnregistrationArgs, ITaskSubmitArgs } from './request-response-common';
import { IServiceWorker } from './service';
import { Connection, RequestError } from './connection';
import { ILogger, PrefixedLogger } from '@sp00x/log-interface';

/** A client connected to the hub, as seen by the hub */
export class RemoteClient extends Connection
{
    id: string; 
    sessionId: string; // session id
    createdTime: number;
    lastActiveTime: number;
    hub: Hub;

    services: {[serviceName: string]: IServiceWorker} = {};

    constructor(hub: Hub, sessionId: string, socket: WebSocket, log: ILogger)
    {
        super(socket, log, {
            'handshake': r => this.handshake(r),
            '*': r => this.rejectCommand(r)
        });
        
        this.id = null;
        this.hub = hub;
        this.sessionId = sessionId;
        this.createdTime = Date.now();
        this.lastActiveTime = this.createdTime;

        this.on('close', (code, reason) =>
        {
            this.log.info("Close: %s (%s)", code, reason);

            // unregister all workers
            for (let serviceName in this.services)
            {
                this.log.info("Close -> unregister service worker '%s'", serviceName);

                let service = hub.getService(serviceName);
                service.unregisterServiceWorker(this);
            }

            this.log.info("Close -> ended.", sessionId);
        })
    }

    private async rejectCommand(req: IRequest): Promise<void>
    {
        let { hub, log } = this;
        log.error("Got command (%s) before handshake was completed", req.command);
        throw new RequestError("Handshake not completed", "E_HANDSHAKE_REQUIRED", true);
    }

    private async handshake(req: IRequest): Promise<void>
    {
        let { hub, log } = this;

        log.info("Processing handshake command..");
        if (this.id == null)
        {
            let handshake = <IHandshakeArgs>req.data;
            let cli = hub.getClientById(handshake.clientId);
            if (cli != null) throw new RequestError("A client with that ID is already registered!", "E_HANDSHAKE_CLIENT_ID");
            this.id = handshake.clientId;
            this.log = log = new PrefixedLogger(sprintf("[cid=%s] ", this.id), this.log);

            await hub.validateHandshake(this, handshake);
            log.info("Handshake performed/accepted");

            // upgrade command handlers
            this.requestHandlers = {
                'handshake': r => this.handshake(r),
                'service.register': r => this.registerService(r),
                'service.unregister': r => this.unregisterService(r),
                'task.submit': r => this.submitTask(r)
            };
        }
        else
            throw new RequestError("Already performed handshake", "E_HANDSHAKE_DUPLICATE");
    }

    private async registerService(req: IRequest): Promise<void>
    {
        let { log, hub } = this;

        let svc = <IServiceRegistrationArgs>req.data;
                    
        log.info("Registering service worker: '%s' [%d] ..", svc.serviceName, svc.capacity);

        // already registered?
        if (this.services[svc.serviceName] != null)
            throw new Error('Worker has already registered for service "' + svc.serviceName + '"');

        // validate request
        await hub.validateServiceRegistration(this, svc);

        // find or create the service
        let service = hub.getService(svc.serviceName, true);

        // register it locally and with the service
        this.services[service.name] = service.registerServiceWorker(this, svc);

        log.info("Successfully registered as service worker for '%s' !", svc.serviceName);
    }

    private async unregisterService(req: IRequest): Promise<void>
    {
        const { log, hub } = this;

        let svc = <IServiceUnregistrationArgs>req.data;

        log.info("Unregistering service worker: '%s' ..", svc.serviceName);

        let service = hub.getService(svc.serviceName);
        if (this.services[svc.serviceName] == null || service == null)
            throw new RequestError('No registered worker for service "' + svc.serviceName + '"', "E_SERVICE_UNKNOWN");

        service.unregisterServiceWorker(this);
    }

    private async submitTask(req: IRequest): Promise<any>
    {
        const { log, hub } = this;

        let task = <ITaskSubmitArgs>req.data;

        log.info("Submitting task: %j..", task);
        
        let service = hub.getService(task.serviceName);
        if (service == null)
            throw new RequestError('No such service: "' + task.serviceName + '"', "E_SERVICE_UNKNOWN");

        let result = await service.invoke(this, task, req);
        return result;
    }
}
