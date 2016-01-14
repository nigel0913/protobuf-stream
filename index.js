var ProtobufMgr = require('./lib/ProtobufMgr');
var Serializer  = require('./lib/Serializer');
var Parser      = require('./lib/Parser');


module.exports = {

    Serializer        : Serializer,
    Parser            : Parser,
    setWrap           : Serializer.setWrap,
    setUnwrap         : Parser.setUnwrap,
    initStream        : ProtobufMgr.initStream,
    resetStream       : ProtobufMgr.resetStream,
    getMessageType    : ProtobufMgr.getMessageType,
    getLimitBufferSize: ProtobufMgr.getLimitBufferSize,
    getHeaderSize     : ProtobufMgr.getHeaderSize

};