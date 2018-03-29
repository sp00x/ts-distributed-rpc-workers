import { Hub, Client, RequestError } from '../src';
import { expect } from 'chai';
import 'mocha';
import { RemoteClient } from '../src/remote-client';
import { IHandshakeArgs } from '../src/request-response-common';

const clientId1 = 'CLI1';
const clientId2 = 'CLI2';
const port = 8444;
let _hub: Hub = null;
let _client: Client = null;

describe('Client', () => {

    before(async () => {
        let validateHandshake = async (cli: RemoteClient, handshake: IHandshakeArgs) => {
            if (handshake.clientId == clientId1) {
                // nothing
            } else if (handshake.clientId == clientId2) {
                if (handshake.authentication != "hello")
                    throw new RequestError("Authentication failed", "E_AUTH_FAILED");
            }
        }
        _hub = new Hub({ port: port, handshakeValidator: validateHandshake });
        await _hub.start();
    })

    describe('Unauthenticated', () => {

        it('can connect', async () => {
            _client = new Client({ port: port, hostname: 'localhost', id: clientId1 });
            await _client.connect(false);    
        })

        it('is marked as connected', async () => {
            expect(_client.isConnected).to.equal(true, "not marked as connected");
        });

        it('can handshake without authentication', async () => {
            await _client.handshake();
        })

        it('can not handshake twice', async () => {
            let ok = false;
            try {
                await _client.handshake();
            } catch (e) {
                ok = true;
            }
            if (!ok) throw new Error("allowed duplicate handshake")
        })

        it('can disconnect', async () => {
            _client.disconnect();
        })

        it('is marked as disconnected', async () => {
            expect(_client.isConnected).to.equal(false, "marked as connected");
        });

        it('can connect again', async () => {
            _client = new Client({ port: port, hostname: 'localhost', id: clientId1 });
            await _client.connect(false);    
        })

        it('can not send other commands before handshake', async () => {
            let ok = false;
            try {
                await _client.invoke('hello');
            } catch (e) {
                ok = true;
            }
            if (!ok) throw new Error("was allowed to send command before handshake");
        });

        it('is disconnected after failed handshake', async () => {
            if (_client.isConnected) throw new Error("still connected");
        })

    })

    after(async() => {
        await _hub.stop();
    })

})
