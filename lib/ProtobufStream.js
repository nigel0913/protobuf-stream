var fs     = require('fs');
var path   = require('path');
var util   = require('util');
var Stream = require('stream');

var async    = require('async');
var Protobuf = require('protobufjs');

var debug = require('debug')('protobuf:stream');

var builder         = null;
var root            = null;
var wrapperProtocol = null;

/**
 * The Max Size of Buffer in parsing buffer
 *  if any over MAX_BUFFER_SIZE, will emit error event and not emit data event,
 *  parse is still work
 * @type {number}
 */

var MAX_BUFFER_SIZE = 16 * 1024;

/**
 * Protobuf Message Object Serializer
 *  Wrap Protobuf Message to ._ProtobufStream.Protocol in predefine
 * @api public
 */

function Serializer() {
    Stream.Duplex.call(this, {writableObjectMode: true});
    this.data = [];
}

util.inherits(Serializer, Stream.Duplex);

/**
 * Implement Stream.Duplex API
 *
 * Note: This function MUST NOT be called directly.
 * It should be implemented by child classes, and called by the internal Writable class methods only.
 *
 * @param {Protobuf.Message} chunk
 * @param {String} encoding
 * @param {Function} callback
 * @api private
 */

Serializer.prototype._write = function (chunk, encoding, callback) {
    this.data.push(chunk);
    callback();
};

/**
 *
 * @param size
 * @api private
 */

Serializer.prototype._read = function (size) {
    if (this.data.length > 0) {
        var message = this.data.shift();

        try {
            var buffer = Serializer.wrapEncode(message);
            this.push(buffer);
        } catch (err) {
            this.emit('error', err);
        }
    }
};

/**
 *
 * @param message
 * @returns {Buffer}
 */

Serializer.wrapEncode = function (message) {
    debug('Wrap ' + message.$type.fqn());

    var wrapper = new root._ProtbufStream.Protocol({
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
};

function Parser() {
    Stream.Writable.call(this);

    this.headBufferSize = 0;
    this.dataBufferSize = 0;

    this.packetSize = 0;

    this.headBuffer = new Buffer(2);
    this.dataBuffer = null;
}

util.inherits(Parser, Stream.Writable);

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
            this.emit('error', new Error('WriteSize equal 0'));
        }

        rpos += writeSize;

        if (this._leftHeadSize() === 0 && this._leftDataSize() === 0) {
            this._parseBuffer();
        }
    }
    callback();
};

Parser.prototype._leftHeadSize = function () {
    return 2 - this.headBufferSize;
};

Parser.prototype._leftDataSize = function () {
    return this.packetSize - 2 - this.dataBufferSize;
};

Parser.prototype._writeHead = function (data, rpos, size) {
    data.copy(this.headBuffer, this.headBufferSize, rpos, rpos + size);
    this.headBufferSize += size;
    if (this.headBufferSize >= 2) {
        this.packetSize = this.headBuffer.readUInt16LE(0);
        if (this.packetSize < 2) {
            this.emit('error', new Error('E_PACKET_SIZE_NOT_ENOUGH'));
        }
        debug('packetSize=' + this.packetSize);

        if (this._isOverMaxLimit()) {
            this.emit('error', new Error('E_PACKET_SIZE_OVER_MAX'));
        } else {
            this.dataBuffer = new Buffer(this.packetSize - 2);
        }
    }
};

Parser.prototype._writeData = function (data, rpos, size) {
    if (!this._isOverMaxLimit()) {
        data.copy(this.dataBuffer, this.dataBufferSize, rpos, rpos + size);
    }
    this.dataBufferSize += size;
};

Parser.prototype._parseBuffer = function () {
    try {
        var data = Parser.parseBuffer(this.dataBuffer);
        if (data)
            this.emit('data', data);
    } catch (err) {
        this.emit('error', err);
    }

    this._resetBuffer();
};

Parser.parseBuffer = function (buffer) {
    var message  = wrapperProtocol.decode(buffer);
    var MsgProto = getProtobufNode(message.name);
    return MsgProto ? MsgProto.decode(message.data) : null;
};

Parser.prototype._isOverMaxLimit = function () {
    return this.packetSize > MAX_BUFFER_SIZE;
};

Parser.prototype._resetBuffer = function () {
    this.packetSize     = -1;
    this.headBufferSize = 0;
    this.dataBufferSize = 0;
    this.dataBuffer     = null;
};

function loadFile(builder, filename) {
    var ext = path.extname(filename);
    switch (ext) {
        case '.proto':
            Protobuf.loadProtoFile(filename, builder);
            break;
        case '.json':
            Protobuf.loadJsonFile(filename, builder);
            break;
        default:
            break;
    }
}

function loadPath(builder, filename, callback) {
    fs.stat(filename, function (err, stats) {
        if (stats.isFile()) {
            loadFile(builder, filename);
            callback(null);
        } else if (stats.isDirectory()) {
            fs.readdir(filename, function (err, files) {
                async.eachSeries(files, function (name, next) {
                    loadPath(builder, filename + name, next);
                }, function (err) {
                    callback(err);
                });
            });
        }
    });
}

function loadProto(dirOrFile, done) {
    builder = Protobuf.newBuilder();
    Protobuf.loadProtoFile(path.join(__dirname, './proto/protocol_wrapper.proto'), builder);
    loadPath(builder, dirOrFile, function (err) {
        root            = builder.build();
        wrapperProtocol = root._ProtbufStream.Protocol;
        done(err);
    });
}

function getProtobufNode(pkg) {
    var part = pkg.split('.'),
        ptr  = root;

    if (part[0] === '') part.shift();   // remote leading '' case '.Test.A'

    for (var i = 0; i < part.length; i++) {
        if (ptr[part[i]]) {
            ptr = ptr[part[i]];
        } else {
            ptr = null;
            break;
        }
    }
    return ptr;
}

module.exports = {
    loadProto      : loadProto,
    getProtobufNode: getProtobufNode,
    Parser         : Parser,
    Serializer     : Serializer,
    MAX_BUFFER_SIZE: MAX_BUFFER_SIZE
};