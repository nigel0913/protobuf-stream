var path   = require('path');
var should = require('should');

var ProtobufStream = require('../');

function check() {
    var root = ProtobufStream.get();
    should.exist(root);

    var Test = root.Test;
    should.exist(Test);

    should.exist(Test.A);
    should.exist(Test.B);
}

describe('LoadFileSync', function () {

    var src = path.join(__dirname, 'protobuf.define');

    beforeEach(function () {
        ProtobufStream.resetStream();
    });

    it('#single.proto', function () {
        ProtobufStream.initStream(path.join(src, 'single.proto'));
        check();
    });

    it('#single.json', function () {
        ProtobufStream.initStream(path.join(src, 'single.json'));
        check();
    });

    it('#proto-folder', function () {
        ProtobufStream.initStream(path.join(src, 'proto'));
        check();
    });

    it('#json-folder', function () {
        ProtobufStream.initStream(path.join(src, 'json'));
        check();
    });

    it('#mix-files', function () {
        ProtobufStream.initStream(path.join(src, 'mix'));
        check();
    });

    it('#duplicate-define', function () {
        try {
            ProtobufStream.initStream(path.join(src, './'));
        } catch (err) {
            should.exist(err);
        }
    });

});