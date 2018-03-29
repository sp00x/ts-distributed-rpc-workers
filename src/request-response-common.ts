export interface IMessage
{
    id: string;
}

export interface IRequest extends IMessage
{
    receivedTime?: number;
    command: string;
    data: any;
}

export interface IResponse extends IMessage
{
    data?: any;
    error?: {
        message: string;
        code?: string;
    }
}

export interface IHandshakeArgs
{
    clientId: string;
    authentication?: any;
}

export interface IServiceRegistrationArgs
{
    serviceName: string;
    capacity: number;
    //TODO: authentication parameters here? (disallow any random client registering and providing garbage or falsy results)
}

export interface IServiceUnregistrationArgs
{
    serviceName: string;
}

export interface ITaskSubmitArgs
{
    serviceName: string;
    args?: any;

    priority?: number; // 0=default, 100=higher etc
    ttl?: number; // max queue time
    workloadEstimate?: number; // estimated workload (if applicable)
    wantStatus?: boolean;
    wantProgress?: boolean;
    isNonvolatile?: boolean; // do not remove or cancel task if client disconnects, but leave on server for pick-up
}

export const DefaultTaskPriority: number = 0;
