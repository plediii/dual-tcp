# dual-tcp
Transport dual-protocol messages over TCP


```javascript
var dual = require('dual-protocol')
.use(require('./index'));

var d = dual();

d.tcpServer(8124);
d.mount(['serverRelay'], function (body, ctxt) {
    console.log('received server relay', body);
    d.send(['tcpServer', 'serverRelay'], [], body);
});

d.mount(['connect', 'tcpClient', '::client'], function (body, ctxt) {
    console.log('client connected: ', ctxt.params.client);
    var relayRoute = ['tcpClient'].concat(ctxt.params.client).concat('clientRelay');
    d.mount(['clientRelay'], function (body, ctxt) {
        console.log('recieved client relay: ', body);
        d.send(relayRoute, [], body);
    });
    d.send(relayRoute, [], 'Hello Client!');
});

d.tcpConnect(8124);
d.mount(['connect', 'tcpServer'], function (body, ctxt) {
    console.log('connected to server');
    d.send(['tcpServer', 'serverRelay'], [], 'Hello Server!');
});
```
