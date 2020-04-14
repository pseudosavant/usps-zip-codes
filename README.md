# USPS ZIP Codes
Retrieve USPS ZIP Codes and make it easy to fill out city/state in forms. This currently just has a script for retrieving all of the USPS ZIP Codes from usps.com. That file can be found in `dist\ZIPCodes.json`.

The `ZIPCodes.json` file is <300k gzipped but is about 1.7MB uncompressed. It can be used on the server either as a json file or database, but it can also be used directly in the browser without any backend (see example below).

The `ZIPCodes.json` file can be used directly (courtesy of [statically.io](https://statically.io/)) with CORS here: https://cdn.statically.io/gh/pseudosavant/USPSZIPCodes/9c75e95cbddd241bd8761f29a91d7d24fe66f086/dist/ZIPCodes.json

Example client-side usage here: https://usps-zipcodes-demo.glitch.me/
Source view: https://glitch.com/edit/#!/usps-zipcodes-demo?path=script.js

© 2017 Paul Ellis, pseudosavant.com

License: MIT
