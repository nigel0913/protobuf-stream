var ProtobufStream = require('../lib/ProtobufStream');

ProtobufStream.loadProto('./', function (err) {
    var Test = ProtobufStream.getProtobufNode('Test');

    var serializer = new ProtobufStream.Serializer();
    var parser = new ProtobufStream.Parser();

    serializer.pipe(parser);

    parser.on('data', function (data) {
        console.log(data.$type.fqn() + ':' + JSON.stringify(data));
    });

    parser.on('error', function (err) {
        console.log('Error: ' + err);
    });

    serializer.write(new Test.A({content: 'hello'}));
    serializer.write(new Test.A({content: 'world'}));
});
