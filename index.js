var ProtobufMgr = require('./lib/ProtobufMgr');
var Serializer  = require('./lib/Serializer');
var Parser      = require('./lib/Parser');


module.exports = {

    Serializer     : Serializer,
    Parser         : Parser,
    initStream     : ProtobufMgr.initStream,
    initStream     : ProtobufMgr.initStream,
    resetStream    : ProtobufMgr.resetStream,
    getMessageType : ProtobufMgr.getMessageType,
    MAX_BUFFER_SIZE: ProtobufMgr.MAX_BUFFER_SIZE

};