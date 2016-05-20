var path   = require('path');
var should = require('should');

var ProtobufStream = require('../');

describe('InitOptions', function () {

    var src = path.join(__dirname, 'protobuf.define');

    beforeEach(function () {
        ProtobufStream.resetStream();
    });

    //it('#set.header_size.4', function () {
    //    ProtobufStream.initStream(
    //        path.join(src, 'single.proto'),
    //        {
    //            header_32_bit: true
    //        }
    //    );
    //    ProtobufStream.getHeaderSize().should.equal(4);
    //});
    //
    //it('#set.limit_buffer_size.1byte', function () {
    //    ProtobufStream.initStream(
    //        path.join(src, 'single.proto'),
    //        {
    //            header_32_bit    : true,
    //            limit_buffer_size: (1 << 8)
    //        }
    //    );
    //    ProtobufStream.getHeaderSize().should.equal(4);
    //    ProtobufStream.getLimitBufferSize().should.equal(256);
    //});
    //
    //it('#set.limit.over.head', function () {
    //    var options = {
    //        limit_buffer_size: (1 << (2 * 8 + 1))
    //    };
    //    ProtobufStream.initStream(
    //        path.join(src, 'single.proto'),
    //        options
    //    );
    //    ProtobufStream.getHeaderSize().should.equal(2);
    //    var limitSize = ProtobufStream.getLimitBufferSize();
    //    limitSize.should.not.equal(options.limit_buffer_size);
    //    limitSize.should.equal((1 << (2 * 8)) - 1);
    //});

});