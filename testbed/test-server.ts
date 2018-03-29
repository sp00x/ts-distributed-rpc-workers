require("source-map-support").install();

import { Hub } from '../src';
import { ConsoleLogger } from '@sp00x/log-interface';

(async () =>
{
    let log = new ConsoleLogger();

    const hub = new Hub({ port: 8144, logger: log });

    log.info("starting server..");
    await hub.start();
    
    log.info("ready!")
    
})();