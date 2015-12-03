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
        var clientdomain = dual();
        var serverdomain = dual();
        var serv = serverdomain.tcpServer(['tcpClient'], port);
        var client;
        clientdomain.mount(['connect', 'tcpServer'], function () {
            s.pass('Connected to tcp server');
            serv.close();
        });
        client = clientdomain.tcpConnect(['tcpServer'], port);
    });

    t.test('Should use alternative server mountpoint provided', function (s) {
        s.plan(1);
        var port = nextPort();
        var clientdomain = dual();
        var serverdomain = dual();
        var serv = serverdomain.tcpServer(['tcpClient'], port);
        var client;
        clientdomain.mount(['connect', 'altaTcp'], function () {
            s.pass('Connected to tcp server');
            serv.close();
        });
        client = clientdomain.tcpConnect(['altaTcp'], port);
    });

    t.test('Should emit connect from client on server', function (s) {
        s.plan(1);
        var port = nextPort();
        var clientdomain = dual();
        var serverdomain = dual();
        var serv = serverdomain.tcpServer(['tcpClient'], port);
        serverdomain.mount(['connect', 'tcpClient', '::client'], function () {
            s.pass('connected to client');
            serv.close();
        })
        clientdomain.tcpConnect(['tcpServer'], port);
    });

    t.test('Should user alternative mount point for client', function (s) {
        s.plan(1);
        var port = nextPort();
        var clientdomain = dual();
        var serverdomain = dual();
        var serv = serverdomain.tcpServer(['altaClient'], port);
        serverdomain.mount(['connect', 'altaClient', '::client'], function () {
            s.pass('connected to client');
            serv.close();
        });
        clientdomain.tcpConnect(['tcpServer'], port);
    });

    t.test('Should connect to client on server domain multiple times', function (s) {
        s.plan(2);
        var port = nextPort();
        var clientdomain = dual();
        var serverdomain = dual();
        var serv = serverdomain.tcpServer(['tcpClient'], port);
        var connections = 0;
        serverdomain.mount(['connect', 'tcpClient', '::client'], function () {
            s.pass('connected to client');
            connections++;
            if (connections === 2) {
                serv.close();
            }
        });
        clientdomain.tcpConnect(['tcpServer'], port);
        clientdomain.tcpConnect(['tcpServer'], port);
    });

    t.test('Should connect to server on client domain multiple times', function (s) {
        s.plan(2);
        var port = nextPort();
        var clientdomain = dual();
        var serverdomain = dual();
        var serv = serverdomain.tcpServer(['tcpClient'], port);
        var connections = 0;
        clientdomain.mount(['connect', 'tcpServer'], function () {
            s.pass('connected to server');
            connections++;
            if (connections === 2) {
                serv.close();
            }
        });
        clientdomain.tcpConnect(['tcpServer'], port);
        clientdomain.tcpConnect(['tcpServer'], port);
    });

    t.test('Should connect to client from server multiple times with unique client on each', function (s) {
        s.plan(1);
        var port = nextPort();
        var clientdomain = dual();
        var serverdomain = dual();
        var serv = serverdomain.tcpServer(['tcpClient'], port);
        var connections = 0;
        var client;
        serverdomain.mount(['connect', 'tcpClient', '::client'], function (body, ctxt) {
            connections++;
            if (connections === 1) {
                client = ctxt.params.client;
            }
            if (connections === 2) {
                s.notDeepEqual(client, ctxt.params.client);
                serv.close();
            }
        });
        clientdomain.tcpConnect(['tcpServer'], port);
        clientdomain.tcpConnect(['tcpServer'], port);
    });

    t.test('Should not connect to client after server close', function (s) {
        s.plan(1);
        var port = nextPort();
        var clientdomain = dual();
        var serverdomain = dual();
        var serv = serverdomain.tcpServer(['tcpClient'], port);
        var connections = 0;
        serverdomain.mount(['connect', 'tcpClient', '::client'], function (body, ctxt) {
            connections++;
            if (connections === 1) {
                s.pass('First connection');
                serv.close();
                clientdomain.tcpConnect(['tcpServer'], port).on('error', function () {});
            }
            if (connections === 2) {
                s.fail('Second connection');
            }
        });
        clientdomain.tcpConnect(['tcpServer'], port);
    });

    t.test('Should connect to server from client with host name', function (s) {
        s.plan(1);
        var port = nextPort();
        var clientdomain = dual();
        var serverdomain = dual();
        var serv = serverdomain.tcpServer(['tcpClient'], port);
        clientdomain.mount(['connect', 'tcpServer'], function () {
            s.pass('Connected to tcp server');
            serv.close();
        });
        clientdomain.tcpConnect(['tcpServer'], port, 'localhost');
    });

    t.test('Should disconnect client on client on server close', function (s) {
        s.plan(1);
        var port = nextPort();
        var clientdomain = dual();
        var serverdomain = dual();
        var serv = serverdomain.tcpServer(['tcpClient'], port);
        var connections = [];
        serv.on('connection', function (socket) {
            connections.push(socket);
        });
        var client;
        clientdomain.mount(['disconnect', 'tcpServer'], function () {
            s.pass('Disconnected client on client');
        });

        clientdomain.mount(['connect', 'tcpServer'], function (body, ctxt) {
            connections.forEach(function (socket) {
                socket.destroy();
            });
        });
        client = clientdomain.tcpConnect(['tcpServer'], port);
    });

    t.test('Should disconnect client on client on client close', function (s) {
        s.plan(1);
        var port = nextPort();
        var clientdomain = dual();
        var serverdomain = dual();
        var serv = serverdomain.tcpServer(['tcpClient'], port);
        var connections = [];
        serv.on('connection', function (socket) {
            connections.push(socket);
        });
        var client;
        clientdomain.mount(['connect', 'tcpServer'], function (body, ctxt) {
            clientdomain.on(['disconnect', 'tcpServer'], function () {
                s.pass('Disconnected client on client');
            });
            client.destroy();
        });
        client = clientdomain.tcpConnect(['tcpServer'], port);
    });

    t.test('Should disconnect client on server on client close', function (s) {
        s.plan(1);
        var port = nextPort();
        var clientdomain = dual();
        var serverdomain = dual();
        var serv = serverdomain.tcpServer(['tcpClient'], port);
        var client;
        serverdomain.mount(['connect', 'tcpClient', '::client'], function (body, ctxt) {
            serverdomain.on(['disconnect', 'tcpClient'].concat(ctxt.params.client), function () {
                s.pass('Disconnected client on server');
            });
            client.destroy();
        });
        client = clientdomain.tcpConnect(['tcpServer'], port);
    });

    t.test('Should disconnect client on server on server close', function (s) {
        s.plan(1);
        var port = nextPort();
        var clientdomain = dual();
        var serverdomain = dual();
        var serv = serverdomain.tcpServer(['tcpClient'], port);
        var connections = [];
        serv.on('connection', function (socket) {
            connections.push(socket);
        });
        var client;
        serverdomain.mount(['connect', 'tcpClient', '::client'], function (body, ctxt) {
            serverdomain.mount(['disconnect', 'tcpClient'].concat(ctxt.params.client), function () {
                s.pass('Disconnected client on server');
            });
            connections.forEach(function (socket) {
                socket.end();
            });
        });
        client = clientdomain.tcpConnect(['tcpServer'], port);
    });

    t.test('Should send messages to server', function (s) {
        s.plan(1);
        var port = nextPort();
        var clientdomain = dual();
        var serverdomain = dual();
        var serv = serverdomain.tcpServer(['tcpClient'], port);
        var client;
        serverdomain.mount(['foo'], function () {
            s.pass('Received foo');
            serv.close();
        });
        clientdomain.mount(['connect', 'tcpServer'], function (body, ctxt) {
            clientdomain.send(['tcpServer', 'foo']);
        });
        client = clientdomain.tcpConnect(['tcpServer'], port);
    });

    t.test('Should disallow wild cards', function (s) {
        s.plan(1);
        var port = nextPort();
        var clientdomain = dual();
        var serverdomain = dual();
        var serv = serverdomain.tcpServer(['tcpClient'], port);
        serverdomain.mount(['foo'], function () {
            s.fail('Received foo from wild card');
        });
        clientdomain.mount(['connect', 'tcpServer'], function (body, ctxt) {
            clientdomain.send(['tcpServer', '*']);
            clientdomain.send(['tcpServer', '**']);
            s.pass('sent wild card event');
        });
        clientdomain.tcpConnect(['tcpServer'], port);
    });

    t.test('Should send message bodies to server', function (s) {
        s.plan(1);
        var port = nextPort();
        var clientdomain = dual();
        var serverdomain = dual();
        var serv = serverdomain.tcpServer(['tcpClient'], port);
        serverdomain.mount(['foo'], function (body) {
            s.equal(body, 'well');
        });
        clientdomain.mount(['connect', 'tcpServer'], function (body, ctxt) {
            clientdomain.send(['tcpServer', 'foo'], [], 'well');
        });
        clientdomain.tcpConnect(['tcpServer'], port);
    });

    t.test('Should send message options to server', function (s) {
        s.plan(1);
        var port = nextPort();
        var clientdomain = dual();
        var serverdomain = dual();
        var serv = serverdomain.tcpServer(['tcpClient'], port);
        serverdomain.mount(['foo'], function (body, ctxt) {
            s.equal(ctxt.options.yakuza, 'yen');
        });
        clientdomain.mount(['connect', 'tcpServer'], function (body, ctxt) {
            clientdomain.send(['tcpServer', 'foo'], [], null, { yakuza: 'yen' });
        });
        clientdomain.tcpConnect(['tcpServer'], port);
    });

    t.test('Should send message from client', function (s) {
        s.plan(1);
        var port = nextPort();
        var clientdomain = dual();
        var serverdomain = dual();
        var serv = serverdomain.tcpServer(['tcpClient'], port);
        var clientPoint;
        serverdomain.mount(['foo'], function (body, ctxt) {
            s.deepEqual(ctxt.from, ['tcpClient'].concat(clientPoint).concat('funds'));
        });
        serverdomain.mount(['connect', 'tcpClient', '::client'], function (body, ctxt) {
            clientPoint = ctxt.params.client;
            clientdomain.send(['tcpServer', 'foo'], ['funds'], { yakuza: 'yen' });
        });
        clientdomain.tcpConnect(['tcpServer'], port);
    });

    t.test('Should send messages to client', function (s) {
        s.plan(1);
        var port = nextPort();
        var clientdomain = dual();
        var serverdomain = dual();
        var serv = serverdomain.tcpServer(['tcpClient'], port);
        clientdomain.mount(['foo'], function () {
            s.pass('Received foo');
        });
        serverdomain.mount(['connect', 'tcpClient', '::client'], function (body, ctxt) {
            serverdomain.send(['tcpClient'].concat(ctxt.params.client).concat('foo'));
        });
        clientdomain.tcpConnect(['tcpServer'], port);
    });

    t.test('Should send message bodies to client', function (s) {
        s.plan(1);
        var port = nextPort();
        var clientdomain = dual();
        var serverdomain = dual();
        var serv = serverdomain.tcpServer(['tcpClient'], port);
        clientdomain.mount(['foo'], function (body) {
            s.equal(body, 'well');
        });
        serverdomain.mount(['connect', 'tcpClient', '::client'], function (body, ctxt) {
            serverdomain.send(['tcpClient'].concat(ctxt.params.client).concat('foo'), [], 'well');
        });
        clientdomain.tcpConnect(['tcpServer'], port);
    });

    t.test('Should send message options to server', function (s) {
        s.plan(1);
        var port = nextPort();
        var clientdomain = dual();
        var serverdomain = dual();
        var serv = serverdomain.tcpServer(['tcpClient'], port);
        clientdomain.mount(['foo'], function (body, ctxt) {
            s.equal(ctxt.options.yakuza, 'yen');
        });
        serverdomain.mount(['connect', 'tcpClient', '::client'], function (body, ctxt) {
            serverdomain.send(['tcpClient'].concat(ctxt.params.client).concat('foo'), [], 'well', { yakuza: 'yen' });
        });
        clientdomain.tcpConnect(['tcpServer'], port);
    });

    t.test('Should send message from server', function (s) {
        s.plan(1);
        var port = nextPort();
        var clientdomain = dual();
        var serverdomain = dual();
        var serv = serverdomain.tcpServer(['tcpClient'], port);
        clientdomain.mount(['foo'], function (body, ctxt) {
            s.deepEqual(ctxt.from, ['tcpServer', 'funds']);
        });
        serverdomain.mount(['connect', 'tcpClient', '::client'], function (body, ctxt) {
            serverdomain.send(['tcpClient'].concat(ctxt.params.client).concat('foo'), ['funds'], 'well', { yakuza: 'yen' });
        });
        clientdomain.tcpConnect(['tcpServer'], port);
    });

    t.test('should be able to register socket connect', function (s) {
        s.plan(1);
        var port = nextPort();
        var clientdomain = dual();
        var serverdomain = dual();
        var serv = serverdomain.tcpServer(['tcpClient'], port);
        clientdomain.tcpConnect(['tcpServer'], port)
        .on('connect', function () {
            s.pass('received client connect');
        });
    });

    t.test('Client connect should signal error on unsuccessful connect', function (s) {
        s.plan(1);
        var port = nextPort();
        var wrongPort = nextPort();
        var clientdomain = dual();
        var serverdomain = dual();
        var serv = serverdomain.tcpServer(['tcpClient'], port);
        clientdomain.tcpConnect(['tcpServer'], wrongPort)
        .on('error', function (err) {
            s.pass('client emitted error');
        });
    });

    t.test('Client should not emit connect on unsuccessful connect', function (s) {
        s.plan(1);
        var port = nextPort();
        var wrongPort = nextPort();
        var clientdomain = dual();
        var serverdomain = dual();
        var serv = serverdomain.tcpServer(['tcpClient'], port);
        clientdomain.mount(['connect', 'tcpServer'], function () {
            s.fail('false connect event');
        });
        clientdomain.tcpConnect(['tcpServer'], wrongPort)
            .on('error', function () {});
        s.pass('connected');
    });

    setInterval(function () {
        process.exit(0);
    }, 2000);
});
