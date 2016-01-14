# node-protobuf-stream

[![Build Status](https://travis-ci.org/nigel0913/protobuf-stream.svg?branch=master)](https://travis-ci.org/nigel0913/protobuf-stream)
[![NPM Version](https://img.shields.io/npm/v/node-protobuf-stream.svg?style=flat)](https://www.npmjs.com/package/node-protobuf-stream)
[![NPM Downloads](https://img.shields.io/npm/dm/node-protobuf-stream.svg?style=flat)](https://www.npmjs.com/package/node-protobuf-stream)

## Installation

    $ npm install node-protobuf-stream
    
## Usage

Simple example:

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

var Test = ProtobufStream.getMessageType('Test');

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

# API

## Options

...

## Events

...

## Custom Wrapper

...