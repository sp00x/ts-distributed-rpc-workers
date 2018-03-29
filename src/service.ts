import { Task, TaskStatus } from './task';
import { RemoteClient } from './remote-client';
import { IServiceRegistrationArgs, ITaskSubmitArgs, IRequest } from './request-response-common';
import { ILogger } from '@sp00x/log-interface';
import { Hub } from './hub';

const queue = require('queue');

/** A worker that has registered as capable of performing a service */
export interface IServiceWorker
{
    service: Service;
    client: RemoteClient;
    args: IServiceRegistrationArgs;
    assignedTasks: Task[];
}

/** A service */
export class Service
{
    name: string;
    log: ILogger;
    hub: Hub;

    queuedTasks: Task[] = [];
    assignedTasks: Task[] = [];
    completedTasks: Task[] = [];

    nextWorkerIndex: number = 0;
    workers: IServiceWorker[] = [];
    totalCapacity: number = 0;

    constructor(name: string, hub: Hub, log: ILogger)
    {
        this.name = name;
        this.hub = hub;
        this.log = log;
    }

    registerServiceWorker(client: RemoteClient, args: IServiceRegistrationArgs): IServiceWorker
    {
        const { log } = this;

        log.info("Adding service worker: %s ..", client.id);

        // add to pool
        let sw: IServiceWorker = <IServiceWorker>{
            service: this,
            client: client,
            args: args,
            assignedTasks: []
        };

        this.workers.push(sw);

        this.totalCapacity += sw.args.capacity;
        log.info("New capacity for service is %d (+%d)", this.totalCapacity, sw.args.capacity);

        // in case we have a waiting task..
        this.processNext();

        return sw;
    }

    unregisterServiceWorker(client: RemoteClient): boolean
    {
        const { log } = this;

        log.info("Unregistering service worker: %s ..", client.id);

        // TODO: I guess we shouldn't remove assigned tasks? should we cancel them? or store them for later?

        // let theirAssignedTasks: Task[] = [];
        // this.assignedTasks = this.assignedTasks.filter(t =>
        // {
        //     if (t.clientId == client.clientId)
        //     {
        //         theirAssignedTasks.push(t);
        //         return false;
        //     }
        //     else
        //         return true;
        // })

        // TODO: men dette er vel feil.. vi skal vel eventuelt kun
        // re-delegere oppgaver som er assigned til denne workeren,
        // og sende dem tilbake til køen.....?

        // log.info("Removed pending queued tasks for removed worker..");
        // let theirQueuedTasks: Task[] = [];
        // this.queuedTasks = this.queuedTasks.filter(queuedTask =>
        // {
        //     if (queuedTask.client.id == client.id)
        //     {
        //         theirQueuedTasks.push(queuedTask);
        //         return false;
        //     }
        //     else
        //         return true;
        // })
        // log.info("Removed # tasks = %d", theirQueuedTasks.length);

        // remove from pool
        log.info("Removing client %s from pool..", client.id)
        let sw = this.workers.find(w => w.client == client);
        if (sw != null)
        {
            let i = this.workers.indexOf(sw);
            if (i < this.nextWorkerIndex) this.nextWorkerIndex--;
            this.workers.splice(i, 1);
            this.totalCapacity -= sw.args.capacity;

            log.info("Removed client %s from pool, new capacity is %d (-%d)", client.id, this.totalCapacity, sw.args.capacity);
            return true; 
        }
        else
        {
            log.warn("Could not find client %s in pool?!", client.id);
            return false;
        }
    }

    async invoke(client: RemoteClient, args: ITaskSubmitArgs, request: IRequest): Promise<any>
    {
        return new Promise<any>((resolve, reject) =>
        {
            const { log } = this;

            log.info("Enqueuing task for client %s ..", client.id);

            let task = new Task();
            task.status = TaskStatus.Initialized;
            task.request = request;
            task.args = args;
            task.client = client;
            task.receivedTime = Date.now();
            task.callback = err =>
            {
                if (err) reject(err);
                else resolve(task.result);
            };

            this.queuedTasks.push(task);
            setImmediate(() => this.processNext());
        })
    }

    private async processNext(): Promise<void>
    {
        const { log } = this;

        log.debug("<processNext> #assigned = %d, #capacity = %d, #queued = %d", this.assignedTasks.length, this.totalCapacity, this.queuedTasks.length);

        if (this.assignedTasks.length < this.totalCapacity && this.queuedTasks.length > 0)
        {
            log.info("processNext: have tasks & capacity, finding next available worker..");

            let worker: IServiceWorker;
            for (let i = 0; this.workers.length > i; i++)
            {
                worker = this.workers[this.nextWorkerIndex];
                this.nextWorkerIndex = (this.nextWorkerIndex + 1) % this.workers.length;
                if (worker.assignedTasks.length < worker.args.capacity)
                    break;
                worker = null;
            }

            if (worker != null)
            {
                log.info("processNext: assigned worker %s", worker.client.id);

                let task = this.queuedTasks.shift();
                log.info("dequeed task: [%s] %j", task.client.id, task.args);
                
                task.assignedTime = Date.now();
                task.assignedWorker = worker;
                task.status = TaskStatus.Assigned;

                // add to both
                this.assignedTasks.push(task);
                worker.assignedTasks.push(task);

                try
                {
                    log.info("processNext: dispatching...");
                    task.result = await worker.client.sendReceive('task.submit', task.args);
                    task.status = TaskStatus.Succeeded;

                    log.info("processNext: finished! result = %j", task.result);
                    task.completedTime = Date.now();

                    task.callback(null);
                }
                catch (err)
                {
                    log.error("processNext: ERROR! %s", err.message);
                    task.status = TaskStatus.Failed;
                    task.callback(err);
                }
                finally 
                {
                    let i = worker.assignedTasks.indexOf(task);
                    if (i >= 0) worker.assignedTasks.splice(i, 1);

                    i = this.assignedTasks.indexOf(task);
                    if (i >= 0) this.assignedTasks.splice(i, 1);
                }
            }
            else
            {
                // TODO: could not find a suitable worker... something must be wrong..?
                log.error("Could not find an available worker?!")
            }

            setImmediate(() => this.processNext());
        }
    }
}
