# USPS ZIP Codes Lookup

Easily retrieve USPS ZIP Codes to auto-fill city/state in forms without the hassle.

## Motivation

Ever got tired of filling in the City and State fields every time a form asked for a ZIP code? Although the USPS readily provides data over an API, it's challenging to find a valid and comprehensive list of all USPS codes. This project aims to bridge that gap by providing an up-to-date and easily accessible JSON file containing all USPS ZIP codes and their associated City and State.

## Features

- **Comprehensive JSON Data**: Find every USPS ZIP code alongside its City and State in our `dist/ZIPCodes.json` file.
- **Lightweight**: The `ZIPCodes.json` file is only <300k  when gzipped (`gzip -v -c ZIPCodes.json | wc -c`) or ~1.5MB uncompressed.
- **Versatile Use Cases**: Use it server-side as a JSON file or a database, or client-side directly in the browser.

### Generate JSON from USPS Excel/CSV with UV (PEP 723)

USPS now publishes an official Excel (https://postalpro.usps.com/ZIP_Locale_Detail) with ZIP → City/State and more. You can transform that file directly into the compact JSON mapping using the included UV inline-metadata Python script.

- Script: `src/process-usps-zipcodes.py`
- Default input: `ZIP_Locale_Detail.xls`
- Default output: `zipcodes-YYYY-MM-DD.json` (written to the current directory)

Run:

```cmd
uv run src\process-usps-zipcodes.py --in ZIP_Locale_Detail.xls --pretty
```

Notes:

- No manual installs needed; `uv` reads PEP 723 metadata and installs `pandas`, `openpyxl`, and `xlrd` as needed.
- The script auto-detects ZIP/City/State columns and preserves the original City/State values and casing from the source file.

## Quick Links

- **Direct JSON Access** (via [statically.io](https://statically.io/)): [https://cdn.statically.io/gh/pseudosavant/USPSZIPCodes/main/dist/ZIPCodes.json](https://cdn.statically.io/gh/pseudosavant/USPSZIPCodes/main/dist/ZIPCodes.json)

## License

This project is licensed under the [MIT License](https://opensource.org/license/MIT/).

© 2025 Paul Ellis, [pseudosavant.com](http://pseudosavant.com)
