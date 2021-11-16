const GrentonApi = require('../index');

let ip = "192.168.0.3";
let port = 1234;
let key = ""; // base64 encoded key
let iv = ""; // base64 encoded vector
let fromIp = "0.0.0.0";
let clu = GrentonApi.clu.create(ip, port, key, iv, fromIp); // create object with clu configuration

/**
 * Raw raw code on the CLU
 */
GrentonApi.client.callRaw(clu,'DOU4157:execute(0, 0)'); // DOU4157:switch()

/**
 * Given script `example` on the CLU
 *
 * With body:
 *
 * return "hello world!"
 */
GrentonApi.client.callFunction(clu, 'example', []).then(function (resp) {
    console.log(resp);
});

/**
 * Response
 *
 * {
 *   msg: 'hello world!',
 *   type: 'resp',
 *   ip: '192.168.0.3',
 *   sessionId: '54729710'
 * }
 */


/**
 * Set var on the Clu
 */
GrentonApi.client.setVar(clu,"sunset", 12);
GrentonApi.client.getVar(clu,"sunset").then(function (resp) {
    console.log(resp);
});

/**
 * Response
 *
 * { msg: '12', type: 'resp', ip: '192.168.0.3', sessionId: '62510876' }
 */
