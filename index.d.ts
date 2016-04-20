import * as stream from "stream";

declare module ProtobufStream {

    interface Options {
        limit_buffer_size:number;
        header_32_bit:boolean;
    }

    interface Callback {
        (err):void;
    }

    class Serializer extends stream.Transform {
        wrapMessage(message:any):Buffer;
    }

    class Parser extends stream.Transform {
        unwrapBuffer(message:Buffer):any;
    }

    //function setWrap():void;
    //function setUnwrap():void;

    function initStream(dirOrFile:string,
                        options?:Options,
                        done?:Callback):void;

    function resetStream():void;

    function getMessageType(pkgName:string):any;

    //function getLimitBufferSize():void;
    //function getHeaderSize():void;

}

declare module "node-protobuf-stream" {
    export = ProtobufStream;
}