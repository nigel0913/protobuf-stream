# node-protobuf-stream

[![Build Status](https://travis-ci.org/nigel0913/protobuf-stream.svg?branch=master)](https://travis-ci.org/nigel0913/protobuf-stream)
[![NPM Version](https://img.shields.io/npm/v/node-protobuf-stream.svg?style=flat)](https://www.npmjs.com/package/node-protobuf-stream)
[![NPM Downloads](https://img.shields.io/npm/dm/node-protobuf-stream.svg?style=flat)](https://www.npmjs.com/package/node-protobuf-stream)

## Installation

    $ npm install node-protobuf-stream
    
## Usage Example

define.proto file
```
package Test;

message A {
    required uint32 a = 1;
}

```

test.js file

```js
var path = require('path');
var ProtobufStream = require('node-protobuf-stream');

ProtobufStream.initStream(path.join(__dirname, 'define.proto'));

var Test = ProtobufStream.get('Test');

var serializer = new ProtobufStream.Serializer();
var parser     = new ProtobufStream.Parser();

serializer.pipe(parser);

parser.on('data', function (data) {
    console.log(data.$type.fqn(), JSON.stringify(data));
});

[1, 2, 3].forEach(function (value) {
    serializer.write(new Test.A({a: value}));
});

```

output

```
.Test.A {"a":1}
.Test.A {"a":2}
.Test.A {"a":3}
```

## API

### initStream(`dirOrFile` [, `options`] [, `done`])

* `dirOrFile`: the protobuf definition file or directory (load all proto&json files recursively)
* `options`: module options, see below.
* `done (err)`: callback when init finished. it will be sync if not given.

#### `options`
| Property | Default | Description |
|--------|--------|---------|
| header_32_bit | false     | Default is 16 bit , and max buffer size is 64K |
| header_big_endian | false | Default is little endian |
| limit_buffer_size | 1 << 16 - 1 | Custom limit for buffer size |

### resetStream()

reset module data.

### Serializer()

return stream class instance for serializing protobuf object.

### Parser()

return stream class instance for parsing protobuf buffer.

### get([`fqn`])

get Protobuf.js module class by fqn (fully qualified name as of ".PATH.TO.THIS")


### setCustomWrap(`serializeFn`, `parseFn`)

Custom Method to serialize protobuf object to buffer & parse buffer to protobuf object.

* `serializeFn(message)`: message is protobuf object, should return Buffer;
* `parseFn(buffer)`: buffer is Buffer, should return protobuf object;

## Events

### Serializer Events

#### "error"

`serializer` will emit `error` when some error occurs.

#### stream.Writable events

such as
* "finish"
* "end"
* "close"
* ...

### Parser Events

#### "error"

`parser` will emit `error` when some error occurs.

#### "data"

`parse` will emit `data` when one protobuf object has been parsed from buffer.

#### stream.Readable events

such as
* "close"
* "end"
* ...

## Custom Wrapper

The module Wrapper:
```protobuf
syntax = "proto3";
package _ProtbufStream;
message Protocol {
    string name = 1;
    bytes data = 2;
}
```
Serializer.wrapMessage(`message`:ProtobufObject):Buffer && Parser.unwrapBuffer(buffer):ProtobufObject

You can use `setCustomWrap(serializeFn, parseFn)` api to realize custom wrapper.


## Typescript support

Waiting for [Github Issues: Package scopes](https://github.com/Microsoft/TypeScript/pull/4913) to write index.d.ts.

Another way: copy below to your project typings folder

``` typescript
/// <reference path="../node/node.d.ts" />

declare module "node-protobuf-stream" {

    import stream = require("stream");

    interface Options {
        limit_buffer_size:number;
        header_32_bit:boolean;
        header_big_endian:boolean;
    }

    interface Callback {
        (err):void;
    }

    export class Serializer extends stream.Transform {
        wrapMessage(message:any):Buffer;
    }

    export class Parser extends stream.Transform {
        unwrapBuffer(message:Buffer):any;
    }

    function setCustomWrap(serializeFn, parseFn):void;

    function initStream(dirOrFile:string,
                        options?:Options,
                        done?:Callback):void;

    function resetStream():void;

    function get(pkgName?:string):any;
}
```