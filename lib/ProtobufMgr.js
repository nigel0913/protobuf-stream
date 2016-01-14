var fs   = require('fs');
var path = require('path');
var util = require('util');

var async    = require('async');
var Protobuf = require('protobufjs');

var debug = require('debug')('protobuf:stream');

var builder = null;
var root    = null;
var Wrapper = null;

/**
 * The Max Size of Buffer in parsing buffer
 *  if any over MAX_BUFFER_SIZE, will emit error event and not emit data event,
 *  parse is still work
 * @type {number}
 */

var MAX_BUFFER_SIZE = 1 << (8 * 2) - 1;     // set 64K

var HEADER_SIZE = 2;                    // (2^8^2) => (2^16)

var HEADER_BIG_ENDIAN = false;            // default: little endian

/**
 * Init Module Stream
 *
 * @param {String} dirOrFile
 * @param {Object} options
 * @param {Function} done
 * @api public
 */

function initStream(dirOrFile, options, done) {

    if (typeof options === 'function') {
        done    = options;
        options = null;
    }

    if (options) {
        if (options.limit_buffer_size) {
            MAX_BUFFER_SIZE = options.limit_buffer_size;
        }

        if (options.header_32_bit) {
            HEADER_SIZE = 4;
        }

        if (options.header_big_endian) {
            HEADER_BIG_ENDIAN = true;
        }
    }

    var maxSize = (HEADER_SIZE == 4) ? (1 << 30) : (1 << 16) - 1;

    if (MAX_BUFFER_SIZE > maxSize) {
        MAX_BUFFER_SIZE = maxSize;
    }

    builder = Protobuf.newBuilder();
    Protobuf.loadProtoFile(path.join(__dirname, './proto/protocol_wrapper.proto'), builder);

    if (done) {

        _loadPath(builder, dirOrFile, function (err) {
            if (err) return done(err);

            try {
                root    = builder.build();
                Wrapper = root._ProtbufStream.Protocol;
            } catch (err) {
                return done(err);
            }
            done(null);
        });

    } else {

        _loadPathSync(builder, dirOrFile);
        root    = builder.build();
        Wrapper = root._ProtbufStream.Protocol;
    }

}

/**
 * Reset protobuf define in the module
 *
 * @api public
 */

function resetStream() {
    // reset constants
    HEADER_SIZE = 2;
    HEADER_BIG_ENDIAN = false;
    MAX_BUFFER_SIZE = 1 << (8 * 2) - 1;

    // reset object
    builder = null;
    root    = null;
    Wrapper = null;
}

/**
 * Get message struct by the fully qualified name
 *
 * @param pkg
 * @returns {Protobuf.Message}
 * @api public
 */

function getMessageType(pkg) {
    if (!root) return null;
    if (!pkg) return root;

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

/**
 * Get module pre-defined _ProtobufStream.Protocol MessageType
 *
 * @returns {Protobuf.Message}
 * @api public
 */

function getWrapper() {
    return Wrapper;
}

/**
 * Get MAX_BUFFER_SIZE
 *
 * @returns {number}
 * @api public
 */

function getMaxBufferSize() {
    return MAX_BUFFER_SIZE;
}

/**
 * Get HEADER_SIZE
 *
 * @returns {number}
 * @api public
 */

function getHeaderSize() {
    return HEADER_SIZE;
}

/**
 * Get BIG_ENDIAN
 *
 * @returns {boolean}
 * @api public
 */


function getHeaderBigEndian() {
    return HEADER_BIG_ENDIAN;
}

function _loadFile(builder, filename) {
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

function _loadPathSync(builder, filename) {
    var stats = fs.statSync(filename);

    if (stats.isFile()) {

        _loadFile(builder, filename);

    } else if (stats.isDirectory()) {

        var files = fs.readdirSync(filename);
        files.forEach((function (name) {
            _loadPathSync(builder, path.join(filename, name));
        }));
    }
}

function _loadPath(builder, filename, callback) {
    fs.stat(filename, function (err, stats) {
        if (err) return callback(err);

        if (stats.isFile()) {
            try {
                _loadFile(builder, filename);
            } catch (err) {
                return callback(err);
            }
            callback(null);

        } else if (stats.isDirectory()) {
            fs.readdir(filename, function (err, files) {
                async.eachSeries(files, function (name, next) {
                    _loadPath(builder, path.join(filename, name), next);
                }, function (err) {
                    callback(err);
                });
            });
        }
    });
}

module.exports = {
    initStream        : initStream,
    resetStream       : resetStream,
    getMessageType    : getMessageType,
    getWrapper        : getWrapper,
    getLimitBufferSize: getMaxBufferSize,
    getHeaderSize     : getHeaderSize,
    getHeaderBigEndian: getHeaderBigEndian
};