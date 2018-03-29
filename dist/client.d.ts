import { ILogger } from '@sp00x/log-interface';
import { IRequest, IServiceRegistrationArgs } from './request-response-common';
import { Connection } from './connection';
export declare type ServiceProcessor<TIn, TOut> = (args: TIn) => Promise<TOut>;
export interface IRegisteredService extends IServiceRegistrationArgs {
    processor: ServiceProcessor<any, any>;
    pendingRequests: IRequest[];
}
export declare class IClientOptions {
    id: string;
    port: number;
    hostname: string;
    logger?: ILogger;
}
export declare class Client {
    log: ILogger;
    id: string;
    port: number;
    hostname: string;
    connection: Connection;
    services: {
        [serviceName: string]: IRegisteredService;
    };
    constructor(options: IClientOptions);
    connect(): Promise<void>;
    private processTask(request);
    invoke<T>(serviceName: string, args: any): Promise<T>;
    registerService<TIn, TOut>(args: IServiceRegistrationArgs, processor: ServiceProcessor<TIn, TOut>): Promise<void>;
}
