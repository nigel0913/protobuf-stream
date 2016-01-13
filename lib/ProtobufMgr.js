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

function loadProto(dirOrFile, done) {
    builder = Protobuf.newBuilder();
    Protobuf.loadProtoFile(path.join(__dirname, './proto/protocol_wrapper.proto'), builder);
    _loadPath(builder, dirOrFile, function (err) {
        if (err) return done(err);

        try {
            root            = builder.build();
            wrapperProtocol = root._ProtbufStream.Protocol;
        } catch (err) {
            return done(err);
        }
        done(null);
    });
}

function clearProto() {
    root            = null;
    wrapperProtocol = null;
}

function getProtobufNode(pkg) {
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
    return wrapperProtocol;
}

module.exports = {
    loadProto      : loadProto,
    clearProto     : clearProto,
    getProtobufNode: getProtobufNode,
    getWrapper     : getWrapper,

    MAX_BUFFER_SIZE: MAX_BUFFER_SIZE
};