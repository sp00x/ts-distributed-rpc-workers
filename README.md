# rpc-workers

WORK IN PROGRESS.

# Roadmap

* authentication?
    * reject clients that do not handshake

* ping/keepalive

* implement priority

* implement task cancellation

* implement nonvolatile task handling

* implement feedback/status events
  * main task state
  * progress from the worker

* clean-up on disconnect
  * service-worker: tasks must be re-allocated
  * client:
    * remove task?
    * perform task, and allow result to be picked up on re-connect?

* support wss://

* set up something like https://github.com/EnterpriseJSTutorial/vscode-ts-node-debugging 
