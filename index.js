var ProtobufMgr = require('./lib/ProtobufMgr');
var Serializer  = require('./lib/Serializer');
var Parser      = require('./lib/Parser');


module.exports = {
    Serializer: Serializer,
    Parser    : Parser,

    loadProto      : ProtobufMgr.loadProto,
    clearProto     : ProtobufMgr.clearProto,
    getProtobufNode: ProtobufMgr.getProtobufNode,
    MAX_BUFFER_SIZE: ProtobufMgr.MAX_BUFFER_SIZE
};