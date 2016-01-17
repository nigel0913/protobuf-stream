var fs     = require('fs');
var path   = require('path');
var should = require('should');

var ProtobufStream = require('../');

describe('FileFlow', function () {

    var filename = path.join(__dirname, 'temp.pb');
    var content  = ['hello', 'world', 'protobuf', 'stream'];

    before(function (done) {
        ProtobufStream.initStream(
            path.join(__dirname, 'protobuf.define/single.proto'),
            done
        );
    });

    afterEach(function (done) {
        fs.unlink(filename, done);
    });

    function checkFile(done) {
        var rs     = fs.createReadStream(filename);
        var parser = new ProtobufStream.Parser();

        rs.pipe(parser);

        var count = 0;
        parser.on('data', function (data) {
            should.exist(data);
            data.$type.fqn().should.equal('.Test.A');
            data.should.have.property('content', content[count]);

            count++;
            if (count === content.length)
                return done();
        });

        parser.on('error', function (err) {
            return done(err);
        });
    }

    it('#write.Test.A', function (done) {
        var Test       = ProtobufStream.getMessageType('Test');
        var ws         = fs.createWriteStream(filename);
        var serializer = new ProtobufStream.Serializer();

        ws.on('pipe', function (src) {
            console.log(src instanceof ProtobufStream.Serializer);
        });

        ws.on('open', function () {
            content.forEach(function (value) {
                serializer.write(new Test.A({content: value}));
            });
            serializer.end();
            //ws.end();
            checkFile(done);
        });

        ws.on('drain', function () {
            console.log('ws.drain');
        });

        ws.on('finish', function () {
            console.log('ws.finish');
        });

        serializer.on('data', function (data) {
            console.log('serializer.data');
            console.log(JSON.stringify(data));
        });

        // Writable:
        // When the end() method has been called, and all data has been flushed to the underlying system, this event is emitted.
        serializer.on('finish', function () {
            console.log('serializer.finish');
        });

        /*

         Readable:

         This event fires when there will be no more data to read.

         Note that the 'end' event will not fire unless the data is completely consumed.
         This can be done by switching into flowing mode, or by calling read() repeatedly until you get to the end.
         */
        serializer.on('end', function () {
            console.log('serializer.end');
        });

        serializer.pipe(ws);


    });

});