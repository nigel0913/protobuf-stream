var fs     = require('fs');
var util   = require('util');
var Stream = require('stream');
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
    Stream.Transform.call(this, {writableObjectMode: true});
}

util.inherits(Serializer, Stream.Transform);

/**
 * Wrap Protobuf Message to ._ProtobufStream.Protocol in predefine
 *
 * @param {Protobuf.Message} message
 * @returns {Buffer}
 */

function wrapEncode(message) {
    debug('Wrap ' + message.$type.fqn());

    var Wrapper = ProtobufMgr.getWrapper();
    if (!Wrapper) throw new Error('E_NO_PROTOBUF_WRAPPER');

    var wrapper = new Wrapper({
        name: message.$type.fqn(),
        data: message.encode().toBuffer()
    });

    debug('Wrap Result: ' + JSON.stringify(wrapper));

    var content = wrapper.toBuffer();
    var size    = 2 + content.length;
    var buffer  = new Buffer(size);
    buffer.writeUInt16LE(size, 0);
    content.copy(buffer, 2);

    return buffer;
}

Serializer.wrapEncode = wrapEncode;


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
    debug('_transform: ' + JSON.stringify(message));
    try {
        var buffer = Serializer.wrapEncode(message);

        if (buffer && buffer.length > ProtobufMgr.MAX_BUFFER_SIZE) {
            return callback(new Error('E_OVER_MAX_BUFFER_SIZE'));
        }

        debug('_transform: callback ' + JSON.stringify(buffer));
        callback(null, buffer);
    } catch (err) {
        debug('_transform: Error ' + err.message);
        callback(err);
    }
};