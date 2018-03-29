require("source-map-support").install();

import { ConsoleLogger, PrefixedLogger } from '@sp00x/log-interface';
import { Client } from '../src';

const CLIENT_ID = "a-one-1";

let log = new ConsoleLogger();

(async () =>
{
    let w = new Client({ hostname: 'localhost', port: 8144, id: CLIENT_ID, logger: new PrefixedLogger('worker: ', log) });

    log.info("connecting..");
    await w.connect();

    log.info("registering service..")
    await w.registerService<any[], Number>({ serviceName: 'add', capacity: 1 }, async args =>
    {
        if (args instanceof Array)
            return ((<any[]>args).reduce((prev, cur) => prev + cur, 0));
        else
            throw new Error("Expected an array of numbers");
    });

    log.info("testing service..")
    await w.invoke('add', [ 1, 2, 3, 5 ]);

    log.info("end.");

})();