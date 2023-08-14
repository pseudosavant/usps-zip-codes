#!/usr/bin/env -S deno run --allow-net
const fetchZIPCodes = async () => {
  const JSONUrl = 'https://raw.githubusercontent.com/pseudosavant/usps-zip-codes/main/dist/ZIPCodes-0-99999.json';
  const res = await fetch(JSONUrl);
  const json = await res.json();
  console.log(`Loaded: ${JSONUrl}`)
  return json;
}

const getZIPFromUrl = (url: string) => {
  const u = new URL(url);
  const path = u.pathname;

  const re = /\d{5}/;
  const parts = re.exec(path);

  const output = (
    parts && !isUndefined(parts[0]) ?
    parts[0] : 
    ''
  );

  return output;
}

const isUndefined = (v: any) => typeof v === 'undefined';

const main = async () => {
  const ZIPCodes = await fetchZIPCodes();
  console.log(`Loaded ${Object.keys(ZIPCodes).length} ZIP Codes`);

  Deno.serve(async (req: Request) => {
    const requestedZIP = getZIPFromUrl(req.url);
    const ZIPData = ZIPCodes[requestedZIP];
    const headers = {
      'context-type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }

    if (!isUndefined(requestedZIP) && !isUndefined(ZIPData)) {
      const { city, state } = ZIPData;
      const json = JSON.stringify({ city, state}, null, 2);

      return new Response(json, { headers });
    }

    return new Response('{}', { headers });
  });
}
  
main();