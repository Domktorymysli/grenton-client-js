# grenton-client-js
Javascript Grenton client by https://domktorymysli.pl/

# Usage

To call function on the CLU (simple RPC)

```javascript

// prepare the CLU object
let ip = "192.168.0.6";
let port = 1234;
let key = "KY1Ajg+pDBQcP2cHnIFNRQ==";
let iv = "/gV+nXMOUlBbuc3uhkk/eA==";
let fromIp = "192.168.0.50";

let clu = GrentonApi.clu.create(ip, port, key, iv, fromIp);

// to call function test on the CLU 
GrentonApi.client.callFunction(clu, "test", []).then(function (resp) {
    console.log(resp)
});

// the resul
expect(resp).toBe("resp:192.168.0.6:10000000:dupa");
```

API
===

Encrypt a message
--

```javascript
let encoded = GrentonApi.encoder.encrypt(keyArray, ivArray, msg);
```

Decrypt a message
--

```javascript
let decrypted = GrentonApi.encoder.decrypt(keyArray, ivArray, msg);
```

Prepare Clu configuration object
--

```javascript
let cluObject = GrentonApi.clu.create(ip, port, key, iv, fromIp);
```

Raw raw code on the CLU
--

```javascript
GrentonApi.client.callRaw(cluObject, string).then(...).catch(...);
```

Call script / function on the CLU
--

```javascript
GrentonApi.client.callFunction(cluObject, 'functionName', ['param1', param2]).then(...).catch(...);
```

Set global variable on the CLU
--

```javascript
GrentonApi.client.setVar(cluObject, "name", "value");
```

Get global variable from the CLU
--

```javascript
GrentonApi.client.getVar(cluObject, "name").then(...).catch(...);
```
 
# How to get cypher Keys?

1) Unzip Object Manager project file "*.omp"
2) Open `properties.xml` file
3) Look for two keys: `keyBytes`, `ivBytes`
4) Done!

# Clients in other languages

Java client -> https://github.com/Domktorymysli/grenton-simple-client

PHP client -> https://github.com/Domktorymysli/grenton-client-php

GoLang client -> https://github.com/Domktorymysli/HouseProxy

# Grenton

https://www.grenton.pl/
