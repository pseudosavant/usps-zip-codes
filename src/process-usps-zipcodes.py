# /// script
# requires-python = ">=3.9"
# dependencies = [
#     "pandas>=2.1.0",
#     "openpyxl>=3.1.2",
#     "xlrd>=2.0.1",
# ]
# ///

"""
Process USPS ZIP Locale Excel into a compact JSON mapping keyed by ZIP.

Input:  Excel (.xls/.xlsx/.xlsm) containing ZIP/City/State columns.
Output: JSON of the form:
  {
    "00501": {"city": "HOLTSVILLE", "state": "NY"},
    ...
  }

Behavior:
- If called with no arguments and ./ZIP_Locale_Detail.xls exists, it converts it.
- If called with no arguments and no local file exists, it prints where to download:
    https://postalpro.usps.com/ZIP_Locale_Detail
- Default output filename: zipcodes-YYYY-MM-DD.json (in the current working directory)

Usage (Windows cmd):
    uv run src\process-usps-zipcodes.py
    uv run src\process-usps-zipcodes.py --in ZIP_Locale_Detail.xls --pretty
"""

from __future__ import annotations

import argparse
import json
from datetime import date
from pathlib import Path
from typing import Dict, Iterable, Optional, Tuple

import pandas as pd
import sys


def _norm_header(h: str) -> str:
    return (
        h.strip().lower()
        .replace("-", " ")
        .replace("/", " ")
        .replace("\\", " ")
        .replace("(", " ")
        .replace(")", " ")
        .replace(",", " ")
        .replace(".", " ")
        .replace(":", " ")
        .replace("_", " ")
    )


ZIP_CANDIDATES: Tuple[str, ...] = (
    "zip",
    "zip5",
    "zip 5",
    "zip code",
    "zipcode",
    "zip_code",
    "zip code 5 digit",
    "zip code 5",
    "zip5 code",
    "zip code tm",
)

CITY_CANDIDATES: Tuple[str, ...] = (
    "city",
    "city name",
    "primary city",
    "preferred city",
    "usps preferred city",
    "default city",
    "default last line city",
)

STATE_CANDIDATES: Tuple[str, ...] = (
    "state",
    "state abbr",
    "state abbrev",
    "state code",
    "stusab",
    "usps state abbr",
)


def _find_column(headers: Iterable[str], candidates: Tuple[str, ...]) -> Optional[str]:
    norm = {h: _norm_header(h) for h in headers}
    for h, n in norm.items():
        if n in candidates:
            return h
    for h, n in norm.items():
        for c in candidates:
            tokens = c.split()
            if all(t in n for t in tokens):
                return h
    return None


def _coerce_zip(v) -> Optional[str]:
    if pd.isna(v):
        return None
    try:
        s = str(int(v))
    except Exception:
        s = str(v).strip()
    s = s.replace(" ", "")
    if not s:
        return None
    s = "".join(ch for ch in s if ch.isdigit())
    if not s:
        return None
    if len(s) > 5:
        s = s[:5]
    return f"{int(s):05d}" if s.isdigit() else None


def _coerce_city(v) -> Optional[str]:
    if pd.isna(v):
        return None
    s = str(v).strip()
    if not s:
        return None
    # Preserve original casing/value as provided
    return s


def _coerce_state(v) -> Optional[str]:
    if pd.isna(v):
        return None
    s = str(v).strip()
    if not s:
        return None
    # Preserve original casing/value as provided (could be abbrev or full name)
    return s


def load_table(path: Path, sheet: Optional[str]) -> pd.DataFrame:
    ext = path.suffix.lower()
    if ext in (".xlsx", ".xlsm"):
        df = pd.read_excel(path, sheet_name=sheet or 0, engine="openpyxl")
    elif ext == ".xls":
        df = pd.read_excel(path, sheet_name=sheet or 0, engine="xlrd")
    else:
        raise SystemExit(f"Unsupported input extension: {ext}. Only .xls, .xlsx, .xlsm are supported.")
    return df


def guess_sheet_name(xl_path: Path) -> Optional[str]:
    if xl_path.suffix.lower() not in (".xlsx", ".xls", ".xlsm"):
        return None
    try:
        xls = pd.ExcelFile(xl_path)
        for name in xls.sheet_names:
            n = _norm_header(name)
            if any(tok in n for tok in ("zip", "locale", "city", "state")):
                return name
        return xls.sheet_names[0] if xls.sheet_names else None
    except Exception:
        return None


def to_zip_json(df: pd.DataFrame, zip_col: Optional[str], city_col: Optional[str], state_col: Optional[str]) -> Dict[str, Dict[str, str]]:
    headers = list(df.columns)
    if not zip_col:
        zip_col = _find_column(headers, ZIP_CANDIDATES)
    if not city_col:
        city_col = _find_column(headers, CITY_CANDIDATES)
    if not state_col:
        state_col = _find_column(headers, STATE_CANDIDATES)

    missing = [name for name, val in [("ZIP", zip_col), ("City", city_col), ("State", state_col)] if not val]
    if missing:
        raise SystemExit(
            "Could not detect required columns: "
            + ", ".join(missing)
            + ". Specify them explicitly with --zip-col/--city-col/--state-col."
        )

    out: Dict[str, Dict[str, str]] = {}
    for _, row in df[[zip_col, city_col, state_col]].iterrows():
        z = _coerce_zip(row[zip_col])
        c = _coerce_city(row[city_col])
        s = _coerce_state(row[state_col])
        if not (z and c and s):
            continue
        if z not in out:
            out[z] = {"city": c, "state": s}
    return dict(sorted(out.items()))


def main(argv: Optional[Iterable[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Process USPS ZIP Locale Excel into JSON keyed by ZIP")
    parser.add_argument("--in", dest="in_path", default=None, help="Input Excel path (default: ./ZIP_Locale_Detail.xls)")
    parser.add_argument("--sheet", default=None, help="Excel sheet name to read (optional)")
    parser.add_argument("--zip-col", default=None, help="Column name for ZIP")
    parser.add_argument("--city-col", default=None, help="Column name for City")
    parser.add_argument("--state-col", default=None, help="Column name for State (2-letter)")
    parser.add_argument("--out", dest="out_path", default=None, help="Output JSON path (default: ./zipcodes-YYYY-MM-DD.json)")
    parser.add_argument("--pretty", action="store_true", help="Pretty-print JSON with indentation")

    args = parser.parse_args(list(argv) if argv is not None else None)
    no_cli_args = False
    if argv is None:
        no_cli_args = len(sys.argv) <= 1
    else:
        no_cli_args = len(list(argv)) == 0

    # Resolve input path
    if args.in_path:
        in_path = Path(args.in_path)
    else:
        in_path = Path.cwd() / "ZIP_Locale_Detail.xls"
        if not in_path.exists():
            if no_cli_args:
                print(
                    "No input file found. Please download the USPS 'ZIP Locale Detail' Excel from\n"
                    "  https://postalpro.usps.com/ZIP_Locale_Detail\n"
                    "and save it as ZIP_Locale_Detail.xls in this directory, or pass --in to specify the file."
                )
                return 2
            else:
                raise SystemExit(f"Input file not found: {in_path}. Pass --in to specify the path.")

    if not in_path.exists():
        raise SystemExit(f"Input file not found: {in_path}")

    sheet = args.sheet or guess_sheet_name(in_path)
    df = load_table(in_path, sheet)

    data = to_zip_json(df, args.zip_col, args.city_col, args.state_col)

    # Resolve output path
    if args.out_path:
        out_path = Path(args.out_path)
    else:
        today = date.today().isoformat()
        out_path = Path.cwd() / f"zipcodes-{today}.json"

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as f:
        if args.pretty:
            json.dump(data, f, ensure_ascii=False, indent=2)
        else:
            json.dump(data, f, ensure_ascii=False, separators=(",", ":"))

    print(f"Wrote {out_path} ({len(data)} ZIP codes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
