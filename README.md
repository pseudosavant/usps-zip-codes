# USPS ZIP Codes
Retrieve USPS ZIP Codes and make it easy to fill out city/state in forms. This currently just has a script for retrieving all of the USPS ZIP Codes from usps.com. That file can be found in `dist\ZIPCodes.json`.

The ZIPCodes.json file is <300k gzipped but is about 1.7MB uncompressed. It can be used on the server either as a json file or database, but it can also be used directly in the browser without any backend (see example below).

Example client-side usage here: http://jsbin.com/zihizo/15/edit?html,js,console

© 2017 Paul Ellis, pseudosavant.com

License: MIT