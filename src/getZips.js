'use strict';

var Promise = require('bluebird'),
    cheerio = require('cheerio'),
    tableparser = require('cheerio-tableparser'),
    fetch = require('node-fetch'),
    FormData = require('form-data'),
    jsonfile = require('jsonfile');

fetch.Promise = Promise; // Use Bluebird with `fetch`

var ZIPCodes = {};

var baseFetchOptions = {
  headers: {
    'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36 Edge/15.15063',
    'referer':'http://webpmt.usps.gov/pmt008.cfm'
  },
  method: 'POST',
  body: ''
};

function zipFetchOptions(from, to) {
  var opts = Object.assign({}, baseFetchOptions);
  var form = new FormData();
  form.append('FromZip', pad(from));
  form.append('ToZip', pad(to));
  opts.body = form;
  return opts;
}

function pad(i) {
  var s = i.toString();
  var prefix = (s.length < 3 ? '0'.repeat(3 - s.length) : '');

  return prefix + s;  
}

function transformTableObject(tableObject) {
  var t = tableObject;

  for (var i = 1; i < t[0].length; i++) {
    var zips = t[0];
    var cities = t[1];
    var states = t[2];

    ZIPCodes[zips[i]] = {
      city: cities[i],
      state: states[i]
    };
  }

  return ZIPCodes;
}

function processHTML(html) {
  console.log('Processing HTML')

  var $ = cheerio.load(html);
  tableparser($);
  var $table = $('table[Summary="A listing of post offices by zip code"]');

  if ($table.length > 0) {
    var tableData = $table.parsetable(true, true, true);
    return transformTableObject(tableData);
  } else {
    return undefined;
  }
}

function writeJSON() {
  console.log('Writing zipcodes.json');
  jsonfile.writeFileSync('ZIPCodes.json', ZIPCodes);
}

function ZIPRequest(opts) {
  var to = opts.to < 999 ? opts.to : 999;
  var from = opts.from >= 0 ? opts.from : 0;

  return fetch('http://webpmt.usps.gov/pmt009.cfm', zipFetchOptions(from, to))
    .then(res => res.text())
    .then(processHTML);
}

function getZIPs(from, to) {
  console.log('Loading USPS ZIP Codes');
  var window = 10;
  var reqs = [];

  for (var i = from; i < to; i += window) {
    reqs.push(ZIPRequest({from: i, to: i + window}));
  }

  return Promise.all(reqs)
    .then(writeJSON)
    .catch(console.log.bind(console));
}

getZIPs(0, 999);