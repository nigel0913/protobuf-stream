var ProtobufMgr = require('./lib/ProtobufMgr');
var Serializer  = require('./lib/Serializer');
var Parser      = require('./lib/Parser');


module.exports = {

    Serializer      : Serializer,
    Parser          : Parser,
    initStream      : ProtobufMgr.initStream,
    resetStream     : ProtobufMgr.resetStream,
    getMessageType  : ProtobufMgr.getMessageType,
    getMaxBufferSize: ProtobufMgr.getMaxBufferSize,
    getHeaderSize   : ProtobufMgr.getHeaderSize

};