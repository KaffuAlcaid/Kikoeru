"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.LOCAL_LISTEN_ADDRESS = void 0;
exports.getHttpListenAddress = getHttpListenAddress;

exports.LOCAL_LISTEN_ADDRESS = "127.0.0.1";

function getHttpListenAddress(localOnly, enableIPV6) {
    if (localOnly) {
        return exports.LOCAL_LISTEN_ADDRESS;
    }
    return enableIPV6 ? "::" : "0.0.0.0";
}
