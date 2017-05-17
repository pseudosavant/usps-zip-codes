'use strict';

var Promise = require('bluebird'),
    fetch = require('node-fetch'),
    xml = require("node-xml-lite"),
    jsonfile = require('jsonfile');

fetch.Promise = Promise; // Use Bluebird with `fetch`

var USPSUserID = process.env.USPSUserID || ''; // You must supply your own. Sign up for free here: https://www.usps.com/business/web-tools-apis/
var baseUSPSUrl = 'http://production.shippingapis.com/ShippingAPITest.dll?API=CityStateLookup&XML=';

var ZIPCodes = {};

var startTimestamp = Date.now();

function pad(num, length) {
  var s = num.toString();
  var prefix = (s.length < length ? '0'.repeat(length - s.length) : '');

  return prefix + s;
}

function ZIPToNumber(ZIP) {
  if (typeof ZIP === 'number') {
    return ZIP;
  }

  return parseInt(ZIP, 10);
}

function createZIPRequest(ZIPs) {
  var header = `<CityStateLookupRequest USERID="${USPSUserID}">`;
    var body = '';
    var footer = '</CityStateLookupRequest>';

    ZIPs.forEach(function (ZIP, id) {
      body += `<ZipCode ID="${id}"><Zip5>${ZIP}</Zip5></ZipCode>`;
    });

    return baseUSPSUrl + header + body + footer;
}

function ZIPRequest(opts) {
  var from = (opts.from >= 0 ? opts.from : 0);
  var to = (opts.to < 99999 ? opts.to : 99999);

  var ZIPs = [];
  for (var i = from; i <= to; i++) {
    ZIPs.push(pad(i, 5));
  }

  console.log(`Fetching ZIPs: ${pad(from, 5)} - ${pad(to, 5)}`);
  var url = createZIPRequest(ZIPs);

  return fetch(url)
    .then(processZIPResponse);
}

function processZIPResponse(res) {
  function transform(xmlObj) {
    var zipResponse = xmlObj.childs;
    return {
      code: zipResponse[0].childs[0],
      city: zipResponse[1].childs[0],
      state: zipResponse[2].childs[0]
    };
  }



  var promise = res.text()
    .then(function (t) {
      var o = xml.parseString(t);
      var ZIPs = o.childs;

      if (o.name === 'Error') {
        throw `Error: ${ZIPs[1].childs[0]}` || 'General USPS Error';
      } else {
        ZIPs.forEach(function (rawZIP) {
          if (rawZIP.name === "ZipCode" && rawZIP.childs && rawZIP.childs[0] && rawZIP.childs[0].name !== "Error") {
            var ZIP = transform(rawZIP);
            ZIPCodes[ZIP.code] = {
              city: ZIP.city,
              state: ZIP.state
            };
          }
        });
      }
    });
  return promise;
}

function writeJSON() {
  var filename = 'ZIPCodes.json';
  console.log(`Writing ${filename}`);
  jsonfile.writeFileSync(filename, ZIPCodes);
}

function performance() {
  var duration = Date.now() - startTimestamp;
  var ZIPCount = Object.keys(ZIPCodes).length;
  var rate = Math.round(duration / ZIPCount);
  var perf = (Number.isFinite(rate) ? `(${rate} ms/ZIP)` : '');

  var time = `Processing time: ${duration}ms`;
  var ZIPs = `${ZIPCount} ZIP Codes ${perf}`;

  console.log(time);
  console.log(ZIPs);
}

function getZIPs(from, to) {
  var batchSize = 5;
  var ranges = []
  var concurrency = 10;
  from = ZIPToNumber(from);
  to = ZIPToNumber(to);

  if (!(from < to)) {
    console.error('Invalid arguments: `to` must be larger than `from`');
    return;
  }

  for (var i = from; i <= to; i += batchSize) {
    var batchEnd = Math.min(to, i + (batchSize - 1));
    ranges.push({ from: i, to: batchEnd });
  }

  console.log(`Requesting USPS ZIP Codes: ${from} - ${to}`);
  return Promise.map(ranges, ZIPRequest, { concurrency })
    .then(writeJSON)
    .then(performance)
    .catch(err => console.dir(err, null, 2));
}

getZIPs(90210, 90310);