var path = require('path');
var net  = require('net');

var ProtobufStream = require('../');

var content = ['hello', 'world', 'protobuf', 'stream'];
var opts    = {
    host: 'localhost',
    port: 5050
};

function test(done) {
    var serializer = new ProtobufStream.Serializer();
    var parser     = new ProtobufStream.Parser();
    var socket     = net.connect(opts);
    var Test       = ProtobufStream.getProtobufNode('Test');
    var count      = 0;

    socket.pipe(parser);
    serializer.pipe(socket);

    parser.on('data', function (data) {
        console.log('client received: ' + data.content);

        ++count;
        if (count === content.length) {
            return done();
        }

        console.log('count=', count);
        serializer.write(new Test.A({content: content[count]}));
    });

    parser.on('error', function (err) {
        console.log('Error: ' + err.message);
        done(err);
    });

    serializer.write(new Test.A({content: content[count]}));
}

ProtobufStream.loadProto(
    path.join(__dirname, '../test/protobuf.define/single.proto'),
    function () {
        test(function () {
            console.log('end');
        });
    }
);