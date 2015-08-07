"use strict";

var bson = require("bson");
var BSON = new bson.BSONPure.BSON();
var BSONStream = require('bson-stream');
var net = require('net');

module.exports = function (Domain) {
    Domain.prototype.tcpServer = function (port, options) {
        var d = this;
        var server = net.createServer(function(c) { 
            d.uid()
                .then(function (clientid) {
                    var clientRoute = ['tcpClient'].concat(clientid);
                    c.on('end', function() {
                        d.unmount(clientRoute);
                        d.send(['disconnect'].concat(clientRoute));
                        console.log('client disconnected');
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
                        d.send({
                            to: msg.to
                            , from: clientRoute.concat(msg.from || [])
                            , body: msg.body
                            , options: msg.options
                        });
                    });
                    d.send(['connect'].concat(clientRoute));
                });
        });
        server.listen(port, function() { //'listening' listener
            console.log('server bound');
        });
    };
    Domain.prototype.tcpConnect = function (port, options) {
        var d = this;
        var serverRoute = ['tcpServer'];
        var client = net.connect({ port: port }
                                 , function() {
                                     console.log('connected to server!');
                                     client.pipe(new BSONStream()).on('data', function (msg) {
                                         d.send({
                                             to: msg.to
                                             , from: serverRoute.concat(msg.from)
                                             , body: msg.body
                                             , options: msg.options
                                         });
                                     });
                                     client.on('end', function() {
                                         console.log('disconnected from server');
                                         d.send(['disconnect'].concat(serverRoute));
                                     });
                                     d.mount(serverRoute.concat('::serverhost'), function (body, ctxt) {
                                         client.write(BSON.serialize({
                                             to: ctxt.params.serverhost
                                             , from: ctxt.from
                                             , body: ctxt.body
                                             , options: ctxt.options
                                         }));
                                     });
                                     d.send(['connect'].concat(serverRoute));
                                 });
    };
};
