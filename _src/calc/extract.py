"""Export an Excel calculator workbook to a JSON model for the JS engine.
Usage: python3 extract.py <workbook.xlsx> <out.json> [--cached <out_cached.json>]"""
import sys, json, datetime, openpyxl
from openpyxl.utils import get_column_letter

def jsonable(v):
    if isinstance(v, (datetime.datetime, datetime.date)):
        # Excel serial date
        base = datetime.datetime(1899, 12, 30)
        if isinstance(v, datetime.date) and not isinstance(v, datetime.datetime):
            v = datetime.datetime(v.year, v.month, v.day)
        return round((v - base).total_seconds() / 86400, 10)
    if isinstance(v, datetime.time):
        return (v.hour * 3600 + v.minute * 60 + v.second) / 86400
    return v

def main():
    src, out = sys.argv[1], sys.argv[2]
    wb = openpyxl.load_workbook(src)
    model = {"sheets": [], "cells": {}, "names": {}, "formats": {}}
    for ws in wb.worksheets:
        model["sheets"].append({"name": ws.title, "maxRow": ws.max_row, "maxCol": ws.max_column})
        for row in ws.iter_rows():
            for c in row:
                v = c.value
                if v is None:
                    continue
                if hasattr(v, "text"):  # ArrayFormula
                    v = "=" + v.text.lstrip("=")
                key = f"{ws.title}!{c.coordinate}"
                model["cells"][key] = jsonable(v)
                if c.number_format and c.number_format != "General":
                    model["formats"][key] = c.number_format
    for name, dn in wb.defined_names.items():
        model["names"][name.upper()] = dn.attr_text
    for ws in wb.worksheets:  # sheet-scoped names
        for name, dn in ws.defined_names.items():
            model["names"][f"{ws.title}!{name}".upper()] = dn.attr_text
    json.dump(model, open(out, "w"), ensure_ascii=False, separators=(",", ":"))
    if "--cached" in sys.argv:
        cached_out = sys.argv[sys.argv.index("--cached") + 1]
        wbv = openpyxl.load_workbook(src, data_only=True)
        cached = {}
        for ws in wbv.worksheets:
            for row in ws.iter_rows():
                for c in row:
                    key = f"{ws.title}!{c.coordinate}"
                    if isinstance(model["cells"].get(key), str) and model["cells"][key].startswith("="):
                        cached[key] = jsonable(c.value)
        json.dump(cached, open(cached_out, "w"), ensure_ascii=False, separators=(",", ":"))
    f = sum(1 for v in model["cells"].values() if isinstance(v, str) and v.startswith("="))
    print(f"{src}: {len(model['cells'])} cells, {f} formulas, {len(model['names'])} names")

main()
