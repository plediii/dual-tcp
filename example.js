"use strict";

var bson = require("bson");
var BSON = new bson.BSONPure.BSON();
var BSONStream = require('bson-stream');

var net = require('net');
var server = net.createServer(function(c) { //'connection' listener
    c.pipe(new BSONStream()).on('data', function (obj) {
        console.log(obj);
        c.write(BSON.serialize({ message: 'hello' }));
    });

  // console.log('client connected');
  c.on('end', function() {
    console.log('client disconnected');
  });
  // c.write('hello\r\n');
  // c.pipe(c);
});
server.listen(8124, function() { //'listening' listener
  console.log('server bound');
});


var client = net.connect({port: 8124}
                         , function() { //'connect' listener
                             console.log('connected to server!');
                             client.write(BSON.serialize({ message: 'world' }));
                         });
client.pipe(new BSONStream()).on('data', function (obj) {
    console.log(obj);
    client.end();
});
client.on('end', function() {
  console.log('disconnected from server');
});
