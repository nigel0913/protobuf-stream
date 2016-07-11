var fs     = require('fs');
var util   = require('util');
var stream = require('stream');
var debug  = require('debug')('protobuf:serializer');

var ProtobufMgr = require('./ProtobufMgr');

/**
 * Expose `Serializer`
 */

module.exports = Serializer;

/**
 * Protobuf Message Object Serializer
 *
 * @api public
 */

function Serializer() {
    stream.Transform.call(this, {writableObjectMode: true});
}

util.inherits(Serializer, stream.Transform);

/**
 * Wrap Protobuf Message to ._ProtobufStream.Protocol in predefine
 *
 * @param {Protobuf.Message} message
 * @returns {Buffer}
 */

function wrapMessage(message) {
    debug('Wrap ' + message.$type.fqn());

    var Wrapper    = ProtobufMgr.getWrapper();
    var headerSize = ProtobufMgr.getHeaderSize();
    var bigEndian  = ProtobufMgr.getHeaderBigEndian();
    if (!Wrapper) throw new Error('E_NO_PROTOBUF_WRAPPER');

    var wrapper = new Wrapper({
        name: message.$type.fqn(),
        data: message.encode().toBuffer()
    });

    debug('headerSize', headerSize);
    debug('Wrap Result: ' + JSON.stringify(wrapper));

    var content = wrapper.toBuffer();
    var size    = headerSize + content.length;
    var buffer  = new Buffer(size);

    if (headerSize === 4) {
        if (bigEndian) buffer.writeUInt32BE(size, 0);
        else buffer.writeUInt32LE(size, 0);
    } else {
        // default is 16 bits
        if (bigEndian) buffer.writeUInt16BE(size, 0);
        else buffer.writeUInt16LE(size, 0);
    }

    content.copy(buffer, headerSize);

    return buffer;
}

Serializer.wrapMessage = wrapMessage;

/**
 * Set custom wrap function
 *
 *  the function should pass in {Protobuf.Message} and output {Buffer}
 *
 * @param {Function} fn
 * @api public
 */

Serializer.setWrap = function (fn) {
    Serializer.wrapMessage = fn;
};

/**
 * Implement Stream.Transform API
 *
 * Note: This function MUST NOT be called directly.
 * It should be implemented by child classes, and called by the internal Writable class methods only.
 *
 * @param {Protobuf.Message} message
 * @param {String} encoding
 * @param {Function} callback
 * @api private
 */

Serializer.prototype._transform = function (message, encoding, callback) {
    //debug('_transform: ' + JSON.stringify(message));  proto3 map will cause Error `Converting circular structure to JSON`
    var buffer = Serializer.wrapMessage(message);

    if (buffer && buffer.length > ProtobufMgr.getLimitBufferSize()) {
        debug('E_OVER_MAX_BUFFER_SIZE: ' + ProtobufMgr.getLimitBufferSize());
        return callback(new Error('E_OVER_MAX_BUFFER_SIZE'));
    }

    debug('_transform: callback ' + JSON.stringify(buffer));
    callback(null, buffer);
};