var fs     = require('fs');
var util   = require('util');
var Stream = require('stream');
var debug  = require('debug')('protobuf:parser');

var ProtobufMgr = require('./ProtobufMgr');

/**
 * Expose `Parser`
 */

module.exports = Parser;

/**
 * Protobuf Message Object Parser
 *
 * @api public
 */

function Parser() {
    Stream.Writable.call(this);

    this.headerSize = ProtobufMgr.getHeaderSize();

    this.headBufferSize = 0;
    this.dataBufferSize = 0;

    this.packetSize = 0;

    this.headBuffer = new Buffer(this.headerSize);
    this.dataBuffer = null;
}

util.inherits(Parser, Stream.Writable);

/**
 * Parse Buffer
 *
 * @param {Buffer} buffer
 * @returns {Protobuf.Message}
 */

function unwrapBuffer(buffer) {
    var message  = ProtobufMgr.getWrapper().decode(buffer);
    var MsgProto = ProtobufMgr.getMessageType(message.name);
    return MsgProto ? MsgProto.decode(message.data) : null;
}

Parser.unwrapBuffer = unwrapBuffer;

/**
 * Set custom unwrap function
 *
 *  the function should pass in {Buffer} and output {Protobuf.Message}
 *
 * @param {Function} fn
 * @api public
 */

Parser.setUnwrap = function (fn) {
    Parser.unwrapBuffer = fn;
};

/**
 * Implement Stream.Writable API
 *
 * Note: This function MUST NOT be called directly.
 * It should be implemented by child classes, and called by the internal Writable class methods only.
 *
 * @param {Buffer} chunk
 * @param {String} encoding
 * @param {Function} callback
 * @api private
 */

Parser.prototype._write = function (chunk, encoding, callback) {
    var rpos          = 0,
        leftChunkSize = 0,
        writeSize     = 0;

    while (rpos < chunk.length) {
        writeSize     = 0;
        leftChunkSize = chunk.length - rpos;

        if (this._leftHeadSize() > 0) {
            writeSize = Math.min(this._leftHeadSize(), leftChunkSize);
            this._writeHead(chunk, rpos, writeSize);
        } else if (this._leftDataSize() > 0) {
            writeSize = Math.min(this._leftDataSize(), leftChunkSize);
            this._writeData(chunk, rpos, writeSize);
        }

        if (writeSize === 0) {
            // abort front part and read new buffer
            chunk = chunk.slice(rpos);
            rpos  = 0;
            this._resetBuffer();
            continue;
        }

        rpos += writeSize;

        if (this._leftHeadSize() === 0 && this._leftDataSize() === 0) {
            this._parseBuffer();
        }

    }
    callback();
};

/**
 * Get left head size in cache
 *
 * @returns {number}
 * @api private
 */

Parser.prototype._leftHeadSize = function () {
    return this.headerSize - this.headBufferSize;
};

/**
 * Get left data size in cache
 *
 * @returns {number}
 * @api private
 */

Parser.prototype._leftDataSize = function () {
    return this.packetSize - this.headerSize - this.dataBufferSize;
};

/**
 * Write data to cache's head
 *
 * @param {Buffer} data
 * @param {number} rpos
 * @param {number} size
 * @api private
 */

Parser.prototype._writeHead = function (data, rpos, size) {
    data.copy(this.headBuffer, this.headBufferSize, rpos, rpos + size);
    this.headBufferSize += size;
    if (this.headBufferSize >= this.headerSize) {

        var bigEndian = ProtobufMgr.getHeaderBigEndian();

        if (this.headerSize === 4) {
            if (bigEndian) this.packetSize = this.headBuffer.readUInt32BE(0);
            else this.packetSize = this.headBuffer.readUInt32LE(0);
        } else {
            // default is 16 bits
            if (bigEndian) this.packetSize = this.headBuffer.readUInt16BE(0);
            else this.packetSize = this.headBuffer.readUInt16LE(0);
        }

        if (this.packetSize < this.headerSize) {
            this.emit('error', new Error('E_PACKET_SIZE_NOT_ENOUGH'));
        }
        debug('packetSize=' + this.packetSize);

        if (this._isOverMaxLimit()) {
            this.emit('error', new Error('E_PACKET_SIZE_OVER_MAX'));
        } else {
            this.dataBuffer = new Buffer(this.packetSize - this.headerSize);
        }
    }
};

/**
 * Write data to cache's data
 *
 * @param {Buffer} data
 * @param {number} rpos
 * @param {number} size
 * @api private
 */

Parser.prototype._writeData = function (data, rpos, size) {
    if (!this._isOverMaxLimit()) {
        data.copy(this.dataBuffer, this.dataBufferSize, rpos, rpos + size);
    }
    this.dataBufferSize += size;
};

/**
 * Parse dataBuffer when have full data & Reset Cache Buffer
 *
 * @api private
 */

Parser.prototype._parseBuffer = function () {
    try {
        var data = Parser.unwrapBuffer(this.dataBuffer);
    } catch (err) {
        this.emit('error', err);
    }

    if (data)
        this.emit('data', data);

    this._resetBuffer();
};

/**
 * Check if over than MAX_BUFFER_SIZE
 *
 * @returns {boolean}
 * @api private
 */

Parser.prototype._isOverMaxLimit = function () {
    return this.packetSize > ProtobufMgr.getLimitBufferSize();
};

/**
 * Reset Cache
 *
 * @api private
 */

Parser.prototype._resetBuffer = function () {
    this.packetSize     = -1;
    this.headBufferSize = 0;
    this.dataBufferSize = 0;
    this.dataBuffer     = null;
};
