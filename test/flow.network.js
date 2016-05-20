var path   = require('path');
var net    = require('net');
var should = require('should');

var ProtobufStream = require('../');

describe('NetworkFlow', function () {

    var content = ['hello', 'world', 'protobuf', 'stream'];
    var opts    = {
        host: 'localhost',
        port: 5050
    };

    before(function (done) {
        ProtobufStream.initStream(
            path.join(__dirname, 'protobuf.define/single.proto'),
            function () {
                var Test = ProtobufStream.get('Test');

                var server = net.createServer(function (socket) {
                    var serializer = new ProtobufStream.Serializer();
                    var parser     = new ProtobufStream.Parser();

                    serializer.pipe(socket);
                    socket.pipe(parser);

                    parser.on('data', function (data) {
                        //console.log('server received: ' + JSON.stringify(data));
                        serializer.write(new Test.A({content: data.content}));
                    });
                });

                server.listen(opts);
                done();
            }
        );

    });


    it('#connect.local.5050', function (done) {
        var serializer = new ProtobufStream.Serializer();
        var parser     = new ProtobufStream.Parser();
        var socket     = net.connect(opts);
        var Test       = ProtobufStream.get('Test');
        var count      = 0;

        socket.pipe(parser);
        serializer.pipe(socket);

        // if not
        parser.on('data', function (data) {
            data.$type.fqn().should.equal('.Test.A');
            data.should.hasOwnProperty('content');
            data.content.should.equal(content[count]);
            //console.log('client received: ' + data.content);

            ++count;
            if (count === content.length) {
                return done();
            }

            serializer.write(new Test.A({content: content[count]}));
        });

        parser.on('error', function (err) {
            console.log('Error: ' + err);
            done(err);
        });

        serializer.write(new Test.A({content: content[count]}));
    });
});