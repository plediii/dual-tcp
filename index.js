"use strict";

var bson = require("bson");
var BSON = new bson.BSONPure.BSON();
var BSONStream = require('bson-stream');
var net = require('net');

module.exports = function (Domain, libs) {
    var Promise = libs.Promise;
    Domain.prototype.tcpServer = function (point, port) {
        var d = this;
        var server = net.createServer(function(c) { 
            d.uid()
                .then(function (clientid) {
                    var clientRoute = point.concat(clientid);
                    c.on('end', function() {
                        d.unmount(clientRoute);
                        d.send(['disconnect'].concat(clientRoute));
                    });
                    c.on('error', function () {
                        d.unmount(clientRoute);
                        d.send(['disconnect'].concat(clientRoute));
                    });
                    d.mount(clientRoute.concat('::clientHost'), function (body, ctxt) {
                        c.write(BSON.serialize({
                            to: ctxt.params.clientHost
                            , from: ctxt.from
                            , body: ctxt.body
                            , options: ctxt.options
                        }));
                    });
                    c.pipe(new BSONStream()).on('data', function (msg) {
                        for (var idx in msg.to) {
                            var point = msg.to[idx];
                            if (point[0] == '*') {
                                console.error('Wild card detected on ', clientRoute);
                                c.end();
                                return;
                            }
                        };
                        d.send({
                            to: msg.to
                            , from: clientRoute.concat(msg.from)
                            , body: msg.body
                            , options: msg.options
                        });
                    });
                    d.send(['connect'].concat(clientRoute));
                });
        });
        server.listen(port, '0.0.0.0', function() { 
            //'listening' listener
        });
        return server;
    };
    Domain.prototype.tcpConnect = function (point, port, host) {
        var d = this;
        var serverRoute = point;
        var client = net.connect({ port: port, host: host }
                           , function() {
                               var handler = function (body, ctxt) {
                                   client.write(BSON.serialize({
                                       to: ctxt.params.serverhost
                                       , from: ctxt.from
                                       , body: ctxt.body
                                       , options: ctxt.options
                                   }));
                               };
                               d.mount(serverRoute.concat('::serverhost'), handler);
                               var cleanup = function () {
                                   d.removeListener(serverRoute.concat('**'), handler)
                               };
                               client.pipe(new BSONStream()).on('data', function (msg) {
                                   d.send({
                                       to: msg.to
                                       , from: serverRoute.concat(msg.from)
                                       , body: msg.body
                                       , options: msg.options
                                   });
                               });
                               client.on('close', function() {
                                   client.destroy();
                                   cleanup();
                                   d.send(['disconnect'].concat(point));
                               });
                               client.on('error', function() {
                                   client.destroy();
                                   cleanup();
                                   d.send(['disconnect'].concat(point));
                               });
                               d.send(['connect'].concat(serverRoute));
                           });
        return client;
    };
};
