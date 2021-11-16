/**
 * Simple Grenton Client
 * https://domktorymysli.pl/
 */
const aesjs = require('aes-js');
const arrayBuffer = require('base64-arraybuffer');
const net = require('net');
const dgram = require('dgram');

let GrentonApi = {
    encoder: {},
    utils: {},
    clu: {},
    client: {}
};

/**
 * @param keyArray {Uint8Array} 16 bit key
 * @param ivArray {Uint8Array} 16 bit vector
 * @param msg Uint8Array() message to encrypt
 *
 * @return {Uint8Array} encrypted message
 */
GrentonApi.encoder.encrypt = function(keyArray, ivArray, msg) {
    let msgBytes = aesjs.padding.pkcs7.pad(msg);
    let aesCbc = new aesjs.ModeOfOperation.cbc(keyArray, ivArray);

    return aesCbc.encrypt(msgBytes);
}

/**
 * @param keyArray {Uint8Array} 16 bit key
 * @param ivArray {Uint8Array} 16 bit vector
 * @param msg Uint8Array() encrypted message
 *
 * @return {Uint8Array()} decrypted message
 */
GrentonApi.encoder.decrypt = function (keyArray, ivArray, msg) {
    let aesCbc = new aesjs.ModeOfOperation.cbc(keyArray, ivArray);
    let decryptedBytes = aesjs.padding.pkcs7.strip(aesCbc.decrypt(msg));

    return decryptedBytes;
}

/**
 * Call function on the CLU
 * @param clu {object} with Clu configuration
 * @param fn {string} function name
 * @param p {array} array with function parameters
 *
 * @return {Promise<ValidationOptions.unknown>}
 */
GrentonApi.client.callFunction = function (clu, fn, p) {
    if (p == null) {
        p = [];
    }
    let cmd = GrentonApi.client.prepareFunctionCommand(fn, p, clu.fromIp);
    return GrentonApi.client.send(clu, cmd);
}

/**
 * Call raw code on the CLU
 *
 * @param clu {object} with Clu configuration
 * @param raw
 * @return {Promise<ValidationOptions.unknown>}
 */
GrentonApi.client.callRaw = function (clu, raw) {
    let msg = "req:" + clu.ip + ":" + GrentonApi.client.generateRandomSessionId() + ":" + raw;
    return GrentonApi.client.send(clu, msg);
}

/**
 * Set a variable in the main scope of the CLU
 *
 * @param clu {object} with Clu configuration
 * @param name {string} name of the variable
 * @param value {string} value of the variable
 *
 * @return {Promise<ValidationOptions.unknown>}
 */
GrentonApi.client.setVar = function (clu, name, value) {
    return GrentonApi.client.callFunction(clu, "setVar", [name, value]);
}

/**
 * Get a CLU variable
 *
 * @param clu {object} with Clu configuration
 * @param name {string} name of the variable
 *
 * @return {Promise<ValidationOptions.unknown>}
 */
GrentonApi.client.getVar = function (clu, name) {
    return GrentonApi.client.callFunction(clu, "getVar", [name]);
}

/**
 * @param resp
 * @return {{msg: {string}, ip: {string}, sessionId: {string}, type: {string}}}
 */
GrentonApi.client.parseMsg = function(resp) {
    const regexp = /(req|resp):([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}):([a-z0-9]{6,8}):(.*)/;
    const match = resp.match(regexp)

    if (!match) {
        throw new Error("couldn't parse message: " + resp)
    }

    return {
        msg: match[4],
        type: match[1],
        ip: match[2],
        sessionId: match[3],
    }
}

/**
 * @param clu {object} with Clu configuration
 * @param data {string}
 *
 * @return {Promise<unknown>}
 */
GrentonApi.client.send = function (clu, data) {
    if (typeof clu !== "object") {
        throw new Error("clu should be object")
    }
    let dataBytes = aesjs.utils.utf8.toBytes(data);
    let msgBytes = GrentonApi.encoder.encrypt(clu.key, clu.iv, dataBytes);

    return new Promise(function(resolve, reject) {
        let client = dgram.createSocket("udp4");

        client.on('error', function(e) {
            reject(e);
        });

        client.on("message", function (msg, rinfo) {
            client.close();
            try {
                let decoded = GrentonApi.encoder.decrypt(clu.key, clu.iv, msg);
                let decodedStr = aesjs.utils.utf8.fromBytes(decoded);

                resolve(GrentonApi.client.parseMsg(decodedStr));
            } catch (e) {
                reject(e);
            }
        });

        client.send(msgBytes, 0, msgBytes.length, clu.port, clu.ip,function(err, bytes) {
            if (err) {
                reject(e);
            }
        });
    });
}

/**
 * Prepare the Grenton request
 *
 * @param fn {string} function name
 * @param p {array} function parameters
 * @param ip {string} IP address of the sender
 *
 * @return {string}
 */
GrentonApi.client.prepareFunctionCommand = function (fn, p, ip) {
    let cmd = "req:" + ip + ":" + GrentonApi.client.generateRandomSessionId() + ":" + fn + "(" + p.join(",") + ");";

    return cmd;
}

/**
 * Generate sessionId for the request
 *
 * @return {number}
 */
GrentonApi.client.generateRandomSessionId = function () {
    let min = 10000000;
    let max = 90000000;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Create CLU object
 * @param ip {string} IP address of the CLU
 * @param port {number} port number of the CLU
 * @param key {string} base64 encoded key
 * @param iv {string} base64 encoded vector
 * @param fromIp {string} the IP of the sender
 * @return {{port: number, ip: string, fromIp: string, iv: string, key: string, fromIp: string}}
 */
GrentonApi.clu.create = function (ip, port, key, iv, fromIp) {
    if (!net.isIP(ip)) {
        throw new Error("ip is not valid");
    }
    if (typeof port !== 'number') {
        throw new Error("port is not valid " + typeof port)
    }

    let keyArr = new Uint8Array(arrayBuffer.decode(key));
    let ivArr = new Uint8Array(arrayBuffer.decode(iv));

    if (keyArr.length != 16) {
        throw new Error("key length is not 16");
    }

    if (ivArr.length != 16) {
        throw new Error("key length is not 16");
    }

    if (!net.isIP(fromIp)) {
        throw new Error("fromIp is not valid");
    }

    return {
        ip: ip,
        port: port,
        key: keyArr,
        iv: ivArr,
        fromIp: fromIp,
    }
}

module.exports = GrentonApi;
