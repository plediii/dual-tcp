"use strict";

var dual = require('dual-protocol').use(require('..'));
var test = require('tape');

test('dual-tcp', function (t) {

    var nextPort = (function () {
        var currentPort = 8124;
        return function () {
            return currentPort++;
        };
    })();

    t.test('Should connect to server from client', function (s) {
        s.plan(1);
        var port = nextPort();
        var d = dual();
        var serv = d.tcpServer(['tcpServer'], port);
        d.mount(['connect', 'tcpServer'], function () {
            s.pass('Connected to tcp server');
            serv.close();
        });
        d.tcpConnect(['tcpClient'], port);
    });

    t.test('Should use alternative server mountpoint provided', function (s) {
        s.plan(1);
        var port = nextPort();
        var d = dual();
        var serv = d.tcpServer(['altaTcp'], port);
        d.mount(['connect', 'altaTcp'], function () {
            s.pass('Connected to tcp server');
            serv.close();
        });
        d.tcpConnect(['tcpClient'], port);
    });

    t.test('Should connect to client from server', function (s) {
        s.plan(1);
        var port = nextPort();
        var d = dual();
        var serv = d.tcpServer(['tcpServer'], port);
        d.mount(['connect', 'tcpClient', '::client'], function () {
            s.pass('connected to client');
            serv.close();
        })
        d.tcpConnect(['tcpClient'], port);
    });

    t.test('Should user alternative mount point for client', function (s) {
        s.plan(1);
        var port = nextPort();
        var d = dual();
        var serv = d.tcpServer(['tcpServer'], port);
        d.mount(['connect', 'altClient', '::client'], function () {
            s.pass('connected to client');
            serv.close();
        });
        d.tcpConnect(['altClient'], port);
    });

    t.test('Should connect to client from server multiple times', function (s) {
        s.plan(2);
        var port = nextPort();
        var d = dual();
        var serv = d.tcpServer(['tcpServer'], port);
        var connections = 0;
        d.mount(['connect', 'tcpClient', '::client'], function () {
            s.pass('connected to client');
            connections++;
            if (connections === 2) {
                serv.close();
            }
        });
        d.tcpConnect(['tcpClient'], port);
        d.tcpConnect(['tcpClient'], port);
    });

    t.test('Should connect to client from server multiple times with unique client on each', function (s) {
        s.plan(1);
        var port = nextPort();
        var d = dual();
        var serv = d.tcpServer(['tcpServer'], port);
        var connections = 0;
        var client;
        d.mount(['connect', 'tcpClient', '::client'], function (body, ctxt) {
            s.pass('connected to client');
            connections++;
            if (connections === 1) {
                client = ctxt.params.client;
            }
            if (connections === 2) {
                s.notDeepEqual(client, ctxt.params.client);
                serv.close();
            }
        });
        d.tcpConnect(['tcpClient'], port);
        d.tcpConnect(['tcpClient'], port);
    });

    t.test('Should not connect to client after server close', function (s) {
        s.plan(1);
        var port = nextPort();
        var d = dual();
        var serv = d.tcpServer(['tcpServer'], port);
        var connections = 0;
        d.mount(['connect', 'tcpClient', '::client'], function (body, ctxt) {
            s.pass('connected to client');
            connections++;
            if (connections === 1) {
                s.pass('First connection');
            }
            if (connections === 2) {
                s.fail('Second connection');
            }
        });
        d.tcpConnect(['tcpClient'], port);
        d.tcpConnect(['tcpClient'], port);
    });

    t.test('Should connect to server from client with host name', function (s) {
        s.plan(1);
        var port = nextPort();
        var d = dual();
        var serv = d.tcpServer(['tcpServer'], port);
        d.mount(['connect', 'tcpServer'], function () {
            s.pass('Connected to tcp server');
            serv.close();
        });
        d.tcpConnect(['tcpClient'], 'localhost', port);
    });

    t.test('Should disconnect client on client on client close', function (s) {
        s.plan(1);
        var port = nextPort();
        var d = dual();
        var serv = d.tcpServer(['tcpServer'], port);
        var client;
        d.mount(['connect', 'tcpClient', '::client'], function (body, ctxt) {
            d.on(['disconnect', 'tcpClient'].concat(client), function () {
                s.pass('Disconnected client');
            });
            client.close();
        });
        client = d.tcpConnect(['tcpClient'], port);
    });

    t.test('Should send messages to server', function (s) {
        s.plan(1);
        var port = nextPort();
        var d = dual();
        var serv = d.tcpServer(['tcpServer'], port);
        d.mount(['foo'], function () {
            s.pass('Received foo');
        });
        d.mount(['connect', 'tcpServer'], function (body, ctxt) {
            d.send(['tcpServer', 'foo']);
        });
        d.tcpConnect(['tcpClient'], port);
    });

    t.test('Should send message bodies to server', function (s) {
        s.plan(1);
        var port = nextPort();
        var d = dual();
        var serv = d.tcpServer(['tcpServer'], port);
        d.mount(['foo'], function (body) {
            s.equal(body, 'well');
        });
        d.mount(['connect', 'tcpServer'], function (body, ctxt) {
            d.send(['tcpServer', 'foo']);
        });
        d.tcpConnect(['tcpClient'], port);
    });

    t.test('Should send message options to server', function (s) {
        s.plan(1);
        var port = nextPort();
        var d = dual();
        var serv = d.tcpServer(['tcpServer'], port);
        d.mount(['foo'], function (body, ctxt) {
            s.equal(ctxt.params.yakuza, 'yen');
        });
        d.mount(['connect', 'tcpServer'], function (body, ctxt) {
            d.send(['tcpServer', 'foo'], [], { yakuza: 'yen' });
        });
        d.tcpConnect(['tcpClient'], port);
    });

    t.test('Should send message from client', function (s) {
        s.plan(1);
        var port = nextPort();
        var d = dual();
        var serv = d.tcpServer(['tcpServer'], port);
        var client;
        d.mount(['foo'], function (body, ctxt) {
            s.deepEqual(ctxt.from, ['tcpClient'].concat(client).concat('funds'));
        });
        d.mount(['connect', 'tcpClient', '::client'], function (body, ctxt) {
            client = ctxt.params.client;
            d.send(['tcpServer', 'foo'], ['funds'], { yakuza: 'yen' });
        });
        d.tcpConnect(['tcpClient'], port);
    });


    t.test('Should send messages to client', function (s) {
        s.plan(1);
        var port = nextPort();
        var d = dual();
        var serv = d.tcpServer(['tcpServer'], port);
        d.mount(['foo'], function () {
            s.pass('Received foo');
        });
        d.mount(['connect', 'tcpClient', '::client'], function (body, ctxt) {
            var client = ctxt.params.client;
            d.send(['tcpClient'].concat(client).concat('foo'));
        });
        d.tcpConnect(['tcpClient'], port);
    });

    t.test('Should send message bodies to server', function (s) {
        s.plan(1);
        var port = nextPort();
        var d = dual();
        var serv = d.tcpServer(['tcpServer'], port);
        d.mount(['foo'], function (body) {
            s.equal(body, 'well');
        });
        d.mount(['connect', 'tcpClient', '::client'], function (body, ctxt) {
            var client = ctxt.params.client;
            d.send(['tcpClient'].concat(client).concat('foo'));
        });
        d.tcpConnect(['tcpClient'], port);
    });

    t.test('Should send message options to server', function (s) {
        s.plan(1);
        var port = nextPort();
        var d = dual();
        var serv = d.tcpServer(['tcpServer'], port);
        d.mount(['foo'], function (body, ctxt) {
            s.equal(ctxt.params.yakuza, 'yen');
        });
        d.mount(['connect', 'tcpClient', '::client'], function (body, ctxt) {
            var client = ctxt.params.client;
            d.send(['tcpClient'].concat(client).concat('foo'), [], { yakuza: 'yen' });
        });
        d.tcpConnect(['tcpClient'], port);
    });

    t.test('Should send message from server', function (s) {
        s.plan(1);
        var port = nextPort();
        var d = dual();
        var serv = d.tcpServer(['tcpServer'], port);
        d.mount(['foo'], function (body, ctxt) {
            s.deepEqual(ctxt.from, ['tcpServer'].concat('funds'));
        });
        d.mount(['connect', 'tcpClient', '::client'], function (body, ctxt) {
            var client = ctxt.params.client;
            d.send(['tcpClient'].concat(client).concat('foo'), ['funds'], { yakuza: 'yen' });
        });
        d.tcpConnect(['tcpClient'], port);
    });
});
