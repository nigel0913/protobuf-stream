var path           = require('path');
var should         = require('should');
var ProtobufStream = require('../');

describe('MemoryFlow', function () {

    before(function (done) {
        ProtobufStream.initStream(
            path.join(__dirname, 'protobuf.define/single.proto'),
            done
        );
    });

    it('#single.content', function (done) {
        var Test = ProtobufStream.getMessageType('Test');
        should.exist(Test);

        var serializer = new ProtobufStream.Serializer();
        var parser     = new ProtobufStream.Parser();

        serializer.pipe(parser);

        parser.on('data', function (data) {
            data.$type.fqn().should.equal('.Test.A');
            data.should.have.property('content', 'hello');
            done();
        });

        parser.on('error', function (err) {
            console.log('Error: ' + err);
            done(err);
        });

        serializer.write(new Test.A({content: 'hello'}));
    });

    it('#multi.content', function (done) {
        var Test = ProtobufStream.getMessageType('Test');
        should.exist(Test);

        var serializer = new ProtobufStream.Serializer();
        var parser     = new ProtobufStream.Parser();

        serializer.pipe(parser);

        var count = 0;
        var content = ['hello', 'world', 'protobuf', 'stream'];

        parser.on('data', function (data) {
            data.$type.fqn().should.equal('.Test.A');
            data.should.have.property('content', content[count]);

            ++count;
            if (count === content.length) return done();
        });

        parser.on('error', function (err) {
            console.log('Error: ' + err);
            done(err);
        });

        content.forEach(function (value) {
            serializer.write(new Test.A({content: value}));
        });

    });

});

