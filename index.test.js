const aesjs = require('aes-js');
const arrayBuffer = require('base64-arraybuffer');
const GrentonApi = require('./index');
const dgram = require('dgram');

function getTestClu()
{
    let ip = "192.168.0.1";
    let port = 1234;
    let key = "KY1Ajg+pDBQcP2cHnIFNRQ==";
    let iv = "/gV+nXMOUlBbuc3uhkk/eA==";
    let fromIp = "192.168.0.50";

    return GrentonApi.clu.create(ip, port, key, iv, fromIp);
}

describe("encoder tests", () => {

    let fromHexString = function(hexString) {
        return new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)))
    };

    test('Encrypt message', () => {
        let clu = getTestClu();
        let msg = "req:192.168.1.104:00be11:DOUT_8565:execute(2, 0)\r\n";

        let msgBytes = aesjs.utils.utf8.toBytes(msg);
        let encrypted = GrentonApi.encoder.encrypt(clu.key, clu.iv, msgBytes);
        let hex = aesjs.utils.hex.fromBytes(encrypted)

        expect(hex).toBe("10636185295a6dbd45670d1e05db7d45324422c5548e8fc2014e4da013ba7626390db91181f95e73a2430e446d97d1cc5d6d6e535f96a598e00a0e99f0e51248");
    });

    test('Decode message', () => {
        /*
               0000   10 63 61 85 29 5a 6d bd 45 67 0d 1e 05 db 7d 45  .ca.)Zm.Eg....}E
               0010   32 44 22 c5 54 8e 8f c2 01 4e 4d a0 13 ba 76 26  2D".T....NM...v&
               0020   39 0d b9 11 81 f9 5e 73 a2 43 0e 44 6d 97 d1 cc  9.....^s.C.Dm...
               0030   5d 6d 6e 53 5f 96 a5 98 e0 0a 0e 99 f0 e5 12 48  ]mnS_..........H
         */
        let clu = getTestClu();
        let msg = "10636185295a6dbd45670d1e05db7d45324422c5548e8fc2014e4da013ba7626390db91181f95e73a2430e446d97d1cc5d6d6e535f96a598e00a0e99f0e51248";

        let msgArray = fromHexString(msg);

        let result = GrentonApi.encoder.decrypt(clu.key, clu.iv, msgArray);

        result = aesjs.utils.utf8.fromBytes(result);
        expect(result).toBe("req:192.168.1.104:00be11:DOUT_8565:execute(2, 0)\r\n");
    });
});

describe("Test Grenton client methods", () => {

    test('Create clu object', () => {
        let ip = "192.168.0.1";
        let port = 1234;
        let key = "KY1Ajg+pDBQcP2cHnIFNRQ==";
        let iv = "/gV+nXMOUlBbuc3uhkk/eA==";
        let fromIp = "192.168.0.50";

        let clu = GrentonApi.clu.create(ip, port, key, iv, fromIp);

        expect(clu).toStrictEqual(
        {
            ip: ip,
            port: port,
            key: new Uint8Array(arrayBuffer.decode(key)),
            iv: new Uint8Array(arrayBuffer.decode(iv)),
            fromIp: fromIp,
        })
    });

    test("Prepare function command", () => {
        let cmd = GrentonApi.client.prepareFunctionCommand("test", ["\"param1\"", "\"param2\"", 4], "192.168.1.3");
        let cmdParsed = GrentonApi.client.parseMsg(cmd);

        expect(cmdParsed.msg).toBe("test(\"param1\",\"param2\",4);");
        expect(cmdParsed.type).toBe("req");
        expect(cmdParsed.ip).toBe("192.168.1.3");
    });

    test("Parse message test", () => {
        let msg = "req:192.168.1.104:00be11:DOUT_8565:execute(2, 0)";

        expect(GrentonApi.client.parseMsg(msg)).toStrictEqual({
            msg: "DOUT_8565:execute(2, 0)",
            type: "req",
            ip: "192.168.1.104",
            sessionId: "00be11",
        });

        msg = "resp:192.168.0.6:10000000:dupa";

        expect(GrentonApi.client.parseMsg(msg)).toStrictEqual({
            msg: "dupa",
            type: "resp",
            ip: "192.168.0.6",
            sessionId: "10000000",
        });
    });

    test("Test generate random session id", () => {
        let sessionId = GrentonApi.client.generateRandomSessionId();
        expect(sessionId).toBeGreaterThanOrEqual(10000000);
        expect(sessionId).toBeLessThanOrEqual(90000000);
    });
});

describe("Functional tests of the Grenon client", () => {
    let ip = "127.0.0.1";
    let port = 1234;
    let key = "KY1Ajg+pDBQcP2cHnIFNRQ==";
    let iv = "/gV+nXMOUlBbuc3uhkk/eA==";
    let fromIp = "192.168.0.6";
    let clu = GrentonApi.clu.create(ip, port, key, iv, fromIp);

    const server = dgram.createSocket('udp4');

    server.on('message', (message, rinfo) => {
        let resp =  aesjs.utils.utf8.fromBytes(GrentonApi.encoder.decrypt(clu.key, clu.iv, message));
        let msg = GrentonApi.client.parseMsg(resp);
        expect(msg.msg).toBe("dupa();");
        expect(msg.type).toBe("req");
        expect(msg.ip).toBe("192.168.0.6");
    });

    server.bind(1234);

    test("Test call function", () => {
         GrentonApi.client.callFunction(clu, "dupa", []).then(function (resp) {
              expect(resp).toBe(msg);
              server.close();
         });
     });
});
