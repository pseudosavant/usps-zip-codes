# USPS ZIP Codes Lookup

Easily retrieve USPS ZIP Codes to auto-fill city/state in forms without the hassle.

## Motivation

Ever got tired of filling in the City and State fields every time a form asked for a ZIP code? Although the USPS readily provides data over an API, it's challenging to find a valid and comprehensive list of all USPS codes. This project aims to bridge that gap by providing an up-to-date and easily accessible JSON file containing all USPS ZIP codes and their associated City and State.

## Features

- **Comprehensive JSON Data**: Find every USPS ZIP code alongside its City and State in our `dist/ZIPCodes.json` file.
- **Easy Updates**: Included script (`src/fetchZIPs.ts`) to fetch an updated list using the USPS API. Defaults to a subset of ZIP Codes (90210-90310) but all ZIP codes can be specified with CLI arguments (`deno run --allow-env --allow-net --allow-write fetchZIPs.ts 0 99999`).
- **Lightweight**: The `ZIPCodes.json` file is only <300k  when gzipped (`gzip -v -c ZIPCodes-0-99999.json | wc -c`) or ~1.7MB uncompressed.
- **Versatile Use Cases**: Use it server-side as a JSON file or a database, or client-side directly in the browser.

## Quick Links

- **Direct JSON Access** (via [statically.io](https://statically.io/)): [https://cdn.statically.io/gh/pseudosavant/USPSZIPCodes/main/dist/ZIPCodes.json](https://cdn.statically.io/gh/pseudosavant/USPSZIPCodes/main/dist/ZIPCodes.json)
- **Client-side Usage Demo**: [https://usps-zipcodes-demo.glitch.me/](https://usps-zipcodes-demo.glitch.me/)
- **Demo Source**: [https://glitch.com/edit/#!/usps-zipcodes-demo?path=script.js](https://glitch.com/edit/#!/usps-zipcodes-demo?path=script.js)

## License

This project is licensed under the [MIT License](https://opensource.org/license/MIT/).

© 2023 Paul Ellis, [pseudosavant.com](http://pseudosavant.com)
