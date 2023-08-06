#!/usr/bin/env -S deno run --allow-env --allow-net --allow-write
// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { parse } from "https://deno.land/x/xml@2.1.1/mod.ts";

const USPSUserID = Deno.env.get("USPSUserID") || ''; // You must supply your own. Sign up for free here: https://www.usps.com/business/web-tools-apis/
const USPSZIPCodesRequestLimit = 5;

async function ZIPRequest(from: number, to: number) {  
  console.log(`Fetching ZIPs: ${pad(from, 5)} - ${pad(to, 5)}`);
  const url = createZIPRequestURL(from, to);
  const res = await fetch(url);
  return ZIPResponseToZIPCodes(res);
}

function createZIPRequestURL(from: number, to: number): string {
  if ((to - from) > 5) throw RangeError(`Maximum USPS request limit (${USPSZIPCodesRequestLimit}) exceeded`)
  const baseUSPSUrl = 'http://production.shippingapis.com/ShippingAPITest.dll?API=CityStateLookup&XML=';

  const header = `<CityStateLookupRequest USERID="${USPSUserID}">`;
  const footer = '</CityStateLookupRequest>';
  
  let body = '';
  for (let ZIP = from, id = 0; ZIP <= to; ZIP++, id++) {
    body += `<ZipCode ID="${id}"><Zip5>${ZIP}</Zip5></ZipCode>`;
  }

  const url = baseUSPSUrl + header + body + footer;
  return url;
}

type CityStateLookup = { Zip5: string, City: string, State: string }
type CityStateLookupRes = { ZipCode: CityStateLookup[] };

const ZIPResponseToZIPCodes = async (res: Response) => {
  const t = await res.text();
  const doc = parse(t) as unknown as { CityStateLookupResponse: CityStateLookupRes };
  const CityStateLookupResponse = doc.CityStateLookupResponse;

  // Handle situation where ZIPs are typically returned in an Array except
  // when only one ZIP code was returned
  const ZIPArray = (
    Array.isArray(CityStateLookupResponse.ZipCode) ?
    CityStateLookupResponse.ZipCode :
    [CityStateLookupResponse.ZipCode]
  );
  const validZIPCodes = ZIPArray.filter((ZIPCode) => !isUndefined(ZIPCode.Zip5));
  const lookup = validZIPCodes.map((ZIPCode) => {
    const city = ZIPCode.City;
    const state = ZIPCode.State;
    const code = ZIPCode.Zip5;
    return { code, state, city }
  });

  return lookup;
}

function writeJSON(ZIPCodes: ZipCodeMap, suffix?: string) {
  const folder = '../dist/';
  const filename = (suffix ? `ZIPCodes-${suffix}.json` : 'ZIPCodes.json');
  const filepath = folder + filename;
  console.log(`Writing ${filepath}`);
  Deno.writeTextFileSync(filepath, JSON.stringify(ZIPCodes));
}

type ZipCode = `${number}`; // A string representation of a number, from "0" to "99999".

type ZipCodeInfo = {
  city: string;
  state: string;
};

type ZipCodeMap = {
  [zip in ZipCode]?: ZipCodeInfo;
};

async function getZIPs(from: number, to: number) {
  const batchSize = USPSZIPCodesRequestLimit;

  if (!(from < to)) {
    console.error('Invalid arguments: `to` must be larger than `from`');
    return;
  }

  console.log(`Requesting USPS ZIP Codes: ${from} - ${to}`);
  const output = {} as ZipCodeMap;
  for (let batchFrom = from; batchFrom <= to; batchFrom += batchSize) {
    const batchTo = Math.min(to, batchFrom + (batchSize - 1));
    const ZIPCodes = await ZIPRequest(batchFrom, batchTo);

    if (ZIPCodes) {
      ZIPCodes.forEach((ZIP) => {
        const { code, state, city } = ZIP;
        output[code as ZipCode] = { state, city };
      });
    }
  }
  performance.mark('stop-processing');

  const filenameSuffix = `${from}-${to}`;

  writeJSON(output, filenameSuffix);
  showPerformance(output);
}

function showPerformance(ZIPCodes: ZipCodeMap) {
  const { duration } = performance.measure('processing-duration', 'start-processing', 'stop-processing');
  const ZIPCount = Object.keys(ZIPCodes).length;
  const msPerZIP= Math.round(duration / ZIPCount);
  const ZIPsPerSecond = ZIPCount / (duration/1000 );

  console.log(`Processing time: ${duration.toFixed(0)}ms
${ZIPCount} ZIP Codes
${msPerZIP} ms/ZIP
${ZIPsPerSecond.toFixed(1)} ZIP/second`);
}

// deno-lint-ignore no-explicit-any
const isUndefined = (v:any) => typeof v === 'undefined';

function pad(num: number, length: number): string {
  const s = num.toString();
  const prefix = (s.length < length ? '0'.repeat(length - s.length) : '');

  return prefix + s;
}

function main() {
  performance.mark('start-processing');
  console.log(`Requesting ZIP Codes from USPS using user ID: ${USPSUserID}`);
  
  const defaultFrom = 90210;
  const defaultTo = 90310;

  if (Deno.args.length > 1) {
    const from = +Deno.args[0];
    const to = +Deno.args[1];
    getZIPs(from, to);
  } else {
    console.log(`Requesting default ZIP code range (${defaultFrom}-${defaultTo})`);
    console.log(`Custom ZIP code ranges may be specified by CLI arguments: deno run --allow-env --allow-net --allow-write fetchUpdatedZIPs.ts 0 99999`)
    getZIPs(defaultFrom, defaultTo);
  }
}
main();
