var fs     = require('fs');
var path   = require('path');
var util   = require('util');

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

var MAX_BUFFER_SIZE = 16 * 1024;     // set 16K

var HEADER_SIZE = 2;                 // (2^8^2) => (2^16)

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
        if (options.max_buffer_size) {
            MAX_BUFFER_SIZE = options.max_buffer_size;
        }
        if (options.header_size && options.header_size < 4) {
            HEADER_SIZE = options.header_size;
        }
    }

    var limitBufferSize = ((1 << HEADER_SIZE) - 1);
    if (MAX_BUFFER_SIZE > limitBufferSize) {
        MAX_BUFFER_SIZE = limitBufferSize;
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
 */

function resetStream() {
    builder = null;
    root    = null;
    Wrapper = null;
}

/**
 * Get message struct by the fully qualified name
 * @param pkg
 * @returns {*}
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

function getWrapper() {
    return Wrapper;
}

module.exports = {
    initStream    : initStream,
    resetStream   : resetStream,
    getMessageType: getMessageType,
    getWrapper    : getWrapper,

    MAX_BUFFER_SIZE: MAX_BUFFER_SIZE
};