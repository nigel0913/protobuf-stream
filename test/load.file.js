var path   = require('path');
var should = require('should');

var ProtobufStream = require('../');

function check() {
    var root = ProtobufStream.getProtobufNode();
    should.exist(root);

    var Test = root.Test;
    should.exist(Test);

    should.exist(Test.A);
    should.exist(Test.B);
}

describe('LoadFile', function () {

    var src = path.join(__dirname, 'protobuf.define');

    beforeEach(function () {
        ProtobufStream.clearProto();
    });

    it('#single.proto', function (done) {
        ProtobufStream.loadProto(
            path.join(src, 'single.proto'),
            function (err) {
                should.not.exist(err);
                check();
                done();
            }
        );
    });

    it('#single.json', function (done) {
        ProtobufStream.loadProto(
            path.join(src, 'single.json'),
            function (err) {
                should.not.exist(err);
                check();
                done();
            }
        );
    });

    it('#proto-folder', function (done) {
        ProtobufStream.loadProto(
            path.join(src, 'proto'),
            function (err) {
                should.not.exist(err);
                check();
                done();
            }
        );
    });

    it('#json-folder', function (done) {
        ProtobufStream.loadProto(
            path.join(src, 'json'),
            function (err) {
                should.not.exist(err);
                check();
                done();
            }
        );
    });

    it('#mix-files', function (done) {
        ProtobufStream.loadProto(
            path.join(src, 'mix'),
            function (err) {
                should.not.exist(err);
                check();
                done();
            }
        );
    });

    it('#duplicate-define', function (done) {
        ProtobufStream.loadProto(
            path.join(src, './'),
            function (err) {
                should.exist(err);
                var root = ProtobufStream.getProtobufNode();
                should.not.exist(root);

                done();
            }
        );
    });

});