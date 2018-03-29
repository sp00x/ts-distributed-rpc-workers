import { Hub, Client } from '../src';
import { expect } from 'chai';
import 'mocha';

const port = 8444;
let _hub: Hub = null;

describe('Hub', () => {

    describe('Basic features', () => {

        it('starts', async () => {
            _hub = new Hub({ port: port });
            await _hub.start();
        })

        it('throws error if started twice with same port', async () => {
            let ok = false;
            try {
                let hub = new Hub({ port: port });
                await hub.start();
            } catch (e) {
                ok = true;
            }
            if (!ok) throw new Error("no exception on duplicate start()")
        })

        it('shuts down', async () => {
            await _hub.stop();
        })

        it('cannot be connected to after shut down', async () =>
        {
            let ok = false;
            try
            {
                let cli = new Client({ hostname: 'localhost', port: port, id: 'XYZ' });
                await cli.connect();
            } catch (e) {
                ok = true;
            }
            if (!ok) throw new Error("still able to connect");
        })

    })

})
