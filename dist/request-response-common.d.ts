export interface IMessage {
    id: string;
}
export interface IRequest extends IMessage {
    receivedTime?: number;
    command: string;
    data: any;
}
export interface IResponse extends IMessage {
    data?: any;
    error?: {
        message: string;
        code?: string;
    };
}
export interface IHandshakeArgs {
    clientId: string;
    authentication?: any;
}
export interface IServiceRegistrationArgs {
    serviceName: string;
    capacity: number;
}
export interface IServiceUnregistrationArgs {
    serviceName: string;
}
export interface ITaskSubmitArgs {
    serviceName: string;
    args?: any;
    priority?: number;
    ttl?: number;
    workloadEstimate?: number;
    wantStatus?: boolean;
    wantProgress?: boolean;
    isNonvolatile?: boolean;
}
export declare const DefaultTaskPriority: number;
