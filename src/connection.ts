import { EventEmitter } from 'events';

import * as WebSocket from 'ws';
let uuid = require('uuid4');
import * as CircularJSON from 'circular-json';

import { IRequest, IResponse, IMessage } from './request-response-common';
import { ILogger } from '@sp00x/log-interface';

export type ResponseCallback = (request: IRequest, response: IResponse) => void;

export function parseJSON<T>(data: any, errorMessage?: string)
{
    if (errorMessage == null) return JSON.parse(data);
    try
    {
        return JSON.parse(data);
    }
    catch (e)
    {
        throw new Error(errorMessage + ' (' + e.message + ')');
    }
}

export interface IPendingRequest
{
    sentTime: number;
    request: IRequest;
    callback: ResponseCallback;
}

export type RequestHandler = (request: IRequest) => Promise<any>;

export type RequestHandlerMap = {[command: string]: RequestHandler};

export class RequestError extends Error
{
    code: string;
    isFatal?: boolean;
    innerError?: Error;

    constructor(message: string, code: string, isFatal: boolean = false, innerError?: Error)
    {
        // 'Error' breaks prototype chain here
        super(message); 

        this.code = code;
        this.isFatal = isFatal;
        this.innerError = innerError;

        // restore prototype chain   
        const actualProto = new.target.prototype;
    
        if (Object.setPrototypeOf) { Object.setPrototypeOf(this, actualProto); } 
        else { (<any>this).__proto__ = new.target.prototype; } 
    }
}

export class Connection extends EventEmitter
{
    socket: WebSocket;
    log: ILogger;
    pendingRequests: {[requestId: string]: IPendingRequest} = {};
    requestHandlers: RequestHandlerMap;

    disconnected()
    {
        for (let requestId in this.pendingRequests)
        {
            let pendingRequest = this.pendingRequests[requestId];
            pendingRequest.callback(pendingRequest.request, <IResponse>{ id: requestId, error: { message: 'Server disconnected before we could get a response', code: 'E_SERVER_DISCONNECTED' }})
        }
        this.pendingRequests = {};
    }

    constructor(socket: WebSocket, log: ILogger, requestHandlers?: RequestHandlerMap)
    {
        super();

        this.log = log;
        this.socket = socket;
        this.requestHandlers = requestHandlers;

        this.socket.on('open', () =>
        {
            log.info("socket open")
            this.emit('open')
        })

        this.socket.on('error', e =>
        {
            log.error("socket error: %s", e.message);
            this.disconnected();
            this.emit('error', e);
        })

        socket.on('message', async data =>
        {
            let message: IMessage = null;
            try
            {
                log.info("received: %s", data);
                message = parseJSON(data, "Error parsing message data as JSON object");

                this.emit('message', message);

                this.handleMessage(message);
            }
            catch (e)
            {
                log.error("error while processing message: %s, at %s", e.message, e.stack);
            }
        })

        this.socket.on('close', (code, reason) =>
        {
            log.error("socket closed: %s (%s)", code, reason);
            this.disconnected();
            this.emit('close', code, reason); // proxy
        })
    }

    async send(message: IRequest | IResponse): Promise<void>
    {
        return new Promise<void>((resolve, reject) =>
        {
            let messageJSON = CircularJSON.stringify(message);
            this.log.debug("send: %s", messageJSON);
            this.socket.send(messageJSON, err =>
            {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async sendReceive(command: string, data: any): Promise<IResponse>
    {
        const { log } = this;

        return new Promise<IResponse>((resolve, reject) =>
        {
            let request: IRequest = {
                id: uuid(),
                command: command,
                data: data 
            }
            log.info("%s: sending '%s' (%j) ..", request.id, request.command, request.data)

            this.pendingRequests[request.id] =
            {
                sentTime: Date.now(),
                request: request,
                callback: (req, res) =>
                {
                    log.info("%s: callback -> %j", request.id, res);
                    if (res.error == null)
                    {
                        log.info("%s: succesfull: %j", request.id, res)
                        resolve(res);
                    }
                    else
                    {
                        log.error("%s: failed: %s", request.id, res.error.message);
                        reject(new RequestError(res.error.message, res.error.code));
                    }
                }
            };

            let outgoingMessage = JSON.stringify(request);
            log.info("%s: sending JSON: %s", request.id, outgoingMessage);
            this.socket.send(outgoingMessage, err =>
            {
                if (err)
                {
                    log.error("%s: failed to send request to hub: %s", request.id, err)
                    delete this.pendingRequests[request.id];
                    reject(err);
                }

                // we must wait for the callback to see what the response was...
                log.info("%s: waiting for response..", request.id);
            });
        });
    }

    async handleMessage(message: IRequest | IResponse): Promise<void>
    {
        const { log } = this;
        try
        {
            let pendingRequest = this.pendingRequests[message.id];
            if (pendingRequest != null)
            {
                let response: IResponse = message;

                log.info("matched pending request -> dispatching callback")
                
                delete this.pendingRequests[response.id];
                pendingRequest.callback(pendingRequest.request, response);

                this.emit('response', response);
            }
            else
            {
                log.info("did not match pending request - maybe a request?")

                // not an answer to a pending request -> treat this as a request
                let request: IRequest = <IRequest>message;
                let response: IResponse = {
                    id: request.id
                }

                if (this.requestHandlers != null)
                {
                    try
                    {
                        let handler = this.requestHandlers[request.command];
                        if (handler === undefined) handler = handler = this.requestHandlers['*'];

                        if (handler != null)
                        {
                            try
                            {
                                response.data = await handler(request);
                            }
                            catch (e)
                            {
                                if (e instanceof RequestError)
                                {
                                    let re: RequestError = e;
                                    response.error = {
                                        message: re.message,
                                        code: re.code
                                    }
                                }
                                else
                                    response.error = { message: e.message };
                            }
                        }
                        else
                            response.error = { message: 'Unknown command', code: 'E_BADCOMMAND' };
                            
                        await this.send(response);
                    }
                    catch (e)
                    {
                        log.error("Error while processing request or sending response: %s, at %s", e.message, e.stack);
                    }
                }
                else
                {
                    this.emit('request', request);
                }
            }
        }
        catch (e)
        {
            log.error("Error in handleMessage(): %s, at %s", e.message, e.stack);
        }
    }

}

export class OutgoingConnection extends Connection
{
    constructor(url: string, log: ILogger, requestHandlers?: RequestHandlerMap)
    {
        super(new WebSocket(url), log, requestHandlers);
    }
}
