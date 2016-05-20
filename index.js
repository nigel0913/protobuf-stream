var ProtobufMgr = require('./lib/ProtobufMgr');
var Serializer  = require('./lib/Serializer');
var Parser      = require('./lib/Parser');

function setCustomWrap(serializeFn, parseFn) {
    if (!serializeFn || !parseFn) throw new Error('E_SET_CUSTOM_WRAP');
    Serializer.setWrap(serializeFn);
    Parser.setUnwrap(parseFn);
}

module.exports = {

    Serializer   : Serializer,
    Parser       : Parser,
    setCustomWrap: setCustomWrap,
    initStream   : ProtobufMgr.initStream,
    resetStream  : ProtobufMgr.resetStream,
    get          : ProtobufMgr.getMessageType

};