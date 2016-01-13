var should = require('should');
var ProtobufStream = require('../lib/ProtobufStream');

describe('MemoryFlow', function () {

    before(function (done) {
        ProtobufStream.loadProto(__dirname, done);
    });

    it('#content.hello', function (done) {
        var Test = ProtobufStream.getProtobufNode('Test');
        should.exist(Test);

        var serializer = new ProtobufStream.Serializer();
        var parser = new ProtobufStream.Parser();

        serializer.pipe(parser);

        parser.on('data', function (data) {
            data.$type.fqn().should.equal('.Test.A');
            data.should.hasOwnProperty('content');
            data.content.should.equal('hello1');
            done();
        });

        parser.on('error', function (err) {
            console.log('Error: ' + err);
            done(err);
        });

        serializer.write(new Test.A({content: 'hello'}));
    });

});

