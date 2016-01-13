var path   = require('path');
var net    = require('net');

var ProtobufStream = require('../');

var opts    = {
    host: 'localhost',
    port: 5050
};

ProtobufStream.loadProto(
    path.join(__dirname, '../test/protobuf.define/single.proto'),
    function () {
        var Test = ProtobufStream.getProtobufNode('Test');

        var server = net.createServer(function (socket) {
            var serializer = new ProtobufStream.Serializer();
            var parser     = new ProtobufStream.Parser();

            serializer.pipe(socket);
            socket.pipe(parser);

            parser.on('data', function (data) {
                console.log('server received: ' + JSON.stringify(data));
                serializer.write(new Test.A({content: data.content}));
            });
        });

        server.listen(opts, function () {
            console.log('listening');
        });
    }
);