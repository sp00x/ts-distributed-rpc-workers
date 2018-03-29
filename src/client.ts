import { ILogger, NullLogger, PrefixedLogger } from '@sp00x/log-interface';
import { IRequest, IResponse, IHandshakeArgs, IServiceRegistrationArgs, IServiceUnregistrationArgs, ITaskSubmitArgs, IMessage} from './request-response-common';
import { Connection, OutgoingConnection } from './connection';

export type ServiceProcessor<TIn, TOut> = (args: TIn) => Promise<TOut>;

export interface IRegisteredService extends IServiceRegistrationArgs
{
    processor: ServiceProcessor<any, any>;
    pendingRequests: IRequest[];
}

export class IClientOptions
{
    id: string;
    port: number;
    hostname: string;
    logger?: ILogger;
}

export class Client
{
    protected log: ILogger;
    protected id: string;
    protected port: number;
    protected hostname: string;
    protected connection: Connection;
    protected connected: boolean = false;

    protected _services: {[serviceName: string]: IRegisteredService} = {};

    constructor(options: IClientOptions)
    {
        this.id = options.id;
        this.port = options.port;
        this.hostname = options.hostname;
        this.log = options.logger || new NullLogger();
    }

    get url(): string
    {
        return "ws://" + this.hostname + ":" + this.port; // support wss:// also?
    }

    get isConnected(): boolean
    {
        return this.connected;
    }

    async connect(handshake: boolean = true): Promise<void>
    {
        const { log } = this;

        return new Promise<void>((resolve, reject) =>
        {
            log.info("connecting to hub (%s) ..", this.url);

            this.connected = false;

            this.connection = new OutgoingConnection(this.url, log, {
                'task.submit': r => this.processTask(r)
            });

            this.connection.on('error', (err: Error) =>
            {
                if (!this.connected)
                {
                    log.error("Error trying to connect: %s", err.message);
                    reject(err);
                }
                else
                {
                    // TODO: handle error after connected
                    this.connected = false;
                    log.error("Connection was faulted: %s, at %s", err.message, err.stack);
                }
            });

            this.connection.on('closed', (code: any, reason: any) =>
            {
                log.error("Connection was closed: %s (%s)", code, reason);
                if (this.connected)
                {
                    this.connected = false;
                    // TODO: if we have pending requests here, should we do anything?
                }
            });

            this.connection.on('open', async () =>
            {
                this.connected = true;
                log.info("connected to hub!");

                // initialize
                if (handshake)
                {
                    this.handshake();
                }

                resolve();
            })
        })
    }

    async disconnect(): Promise<void>
    {
        if (this.connected)
        {
            this.connection.socket.close();
            this.connected = false;
        }
    }

    async handshake(): Promise<void>
    {
        const { log } = this;

        log.info("performing handshake..");
        await this.connection.sendReceive('handshake', <IHandshakeArgs>{ clientId: this.id });
        log.info("handshaked!");
    }

    private async processTask(request: IRequest): Promise<any>
    {
        const { log } = this;

        let task = <ITaskSubmitArgs>request.data
        log.info("hub issued task submit request, looking up service '%s'..", task.serviceName);

        let service = this._services[task.serviceName];
        if (service == null)
        {
            log.error("could not find service: '%s'", )
            throw new Error('Service not found: "' + task.serviceName + '"');
        }

        log.info("matched service '%s', processing task..", task.serviceName);

        // add to pending tasks
        service.pendingRequests.push(request);
        try
        {
            // process it
            try
            {
                log.info("dispatching to service processor..");
                let result = await service.processor(task.args);
                log.info("successfully processed, result: %j", result);
                return result;
            }
            catch (err)
            {
                log.error("error while dispatching to service processor: %s, at %s", err.message, err.stack);
                throw new Error("Internal error while dispatching to service processor");
            }
        }
        finally
        {
            // remove from pending tasks
            let i = service.pendingRequests.indexOf(request);
            if (i >= 0) service.pendingRequests.splice(i, 1);
            log.info("finished processing task, #pendingRequests = %d", service.pendingRequests.length);
        }
    }

    /**
     * Invoke (call) a service somewhere
     * 
     * @param serviceName Name of service to invoke
     * @param args Arguments to pass to service
     */
    async invoke<T>(serviceName: string, args: any = null): Promise<T>
    {
        let response = await this.connection.sendReceive('task.submit', <ITaskSubmitArgs>{
            serviceName: serviceName,
            args: args
        })

        return response.data.data;
    }

    /**
     * Register a service
     * 
     * @param args Name and other options
     * @param processor Service implementation function
     */
    async registerService<TIn, TOut>(args: IServiceRegistrationArgs, processor: ServiceProcessor<TIn, TOut>): Promise<void>
    {
        if (args.capacity < 0 || args.capacity == null || isNaN(args.capacity) || typeof args.capacity != 'number')
            throw new Error("Invalid capacity value");

        let regSvc: IRegisteredService = {
            ...args,
            processor: processor,
            pendingRequests: []
        }

        await this.connection.sendReceive('service.register', args);
        this._services[regSvc.serviceName] = regSvc;
    }
}
