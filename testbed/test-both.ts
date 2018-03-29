require("source-map-support").install();

import { Hub, Client } from '../src';
import { ConsoleLogger, ILogger, PrefixedLogger } from '@sp00x/log-interface';
const styles = require('ansi-styles');

async function sleep(milliseconds: number): Promise<void>
{
    return new Promise<void>((resolve, reject) => {
        setTimeout(() => resolve(), milliseconds);
    })
}

(async () =>
{
    const log: ILogger = new ConsoleLogger(true);
    const serverPort = 8144;
    const serverHost = 'localhost';
    const clientId1 = "A";

    ///// SERVER /////////////////////////////////////////////////7

    const serverLog = new ConsoleLogger(true);
    serverLog.colors['*'].message = styles.green;

    const hub = new Hub({
        port: serverPort,
        logger: new PrefixedLogger("<S> ", serverLog)
    });

    log.info("starting server..");
    await hub.start();
    
    log.info("server ready!")

    ///// CLIENT /////////////////////////////////////////////////7

    const clientLog = new ConsoleLogger(true);
    clientLog.colors['*'].message = styles.cyan;

    let workers: Client[] = [];

    for (let j=1; 5>=j; j++)
    {
        let w = new Client({ hostname: serverHost, port: serverPort, id: "WORKER_" + j, logger: new PrefixedLogger("<W"+j+"> ", clientLog) });

        log.info("connecting..");
        await w.connect();
        log.info("connected")

        log.info("registering service..")
        await w.registerService<any[], Number>({ serviceName: 'add', capacity: 1 }, async args =>
        {
            await sleep(1000);
            if (args instanceof Array)
                return ((<any[]>args).reduce((prev, cur) => prev + cur, 0));
            else
                throw new Error("Expected an array of numbers");
        });
        log.info("registered service");

        workers.push(w);
    }

    log.info("testing service..")

    let nums = [];
    for (let i = 1; 10 >= i; i++)
    {
        nums.push(i+1);
        workers[0].invoke('add', [ ...nums ]).then(sum => log.info("sum%d = %d", i, sum));
    }

})();
