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

        serializer.pipe(ws);

        ws.on('open', function () {
            content.forEach(function (value) {
                serializer.write(new Test.A({content: value}));
            });
            serializer.end();
            ws.end();
            checkFile(done);
        });

    });

});