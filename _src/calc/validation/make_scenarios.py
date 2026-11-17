"""Build random test scenarios for a BEST calculator workbook.

Each scenario is a set of input changes, "Sheet!A1": value, applied to the worked example:
  - numbers in the input sheets scaled up or down (sometimes set to zero)
  - dropdowns switched to another option from their own list
Usage: python3 make_scenarios.py <example.xlsx> <out.json> <count> <seed>
"""
import sys, json, random, re
import openpyxl
from openpyxl.utils import range_boundaries, get_column_letter

src, out, count, seed = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
INPUT_SHEETS = ("3 Setup", "4 Production Input", "5 Energy & Utilities", "6 Transport", "7 Waste & CCUS")

wb = openpyxl.load_workbook(src)                    # formulas
wv = openpyxl.load_workbook(src, data_only=True)    # values Excel saved

def list_options(formula):
    """Options of a list dropdown: a literal "a,b,c", a range, or a defined name."""
    f = (formula or "").strip()
    if f.startswith('"'):
        return [x.strip() for x in f.strip('"').split(",") if x.strip()]
    f = f.lstrip("=")
    if f in wb.defined_names:
        dests = list(wb.defined_names[f].destinations)
    elif "!" in f:
        sh, rng = f.rsplit("!", 1); dests = [(sh.strip("'"), rng)]
    else:
        return []
    opts = []
    for sh, rng in dests:
        if sh not in wv.sheetnames: continue
        c1, r1, c2, r2 = range_boundaries(rng.replace("$", ""))
        for r in range(r1, r2 + 1):
            for c in range(c1, c2 + 1):
                v = wv[sh].cell(r, c).value
                if v not in (None, "") and not (isinstance(v, str) and v.startswith("#")):
                    opts.append(v)
    return opts

numbers, dropdowns = [], []
for name in INPUT_SHEETS:
    ws = wb[name]
    dv_cells = {}
    for dv in ws.data_validations.dataValidation:
        if dv.type != "list": continue
        opts = list_options(dv.formula1)
        if len(opts) < 2: continue
        for rng in str(dv.sqref).split():
            c1, r1, c2, r2 = range_boundaries(rng)
            for r in range(r1, r2 + 1):
                for c in range(c1, c2 + 1):
                    dv_cells[(r, c)] = opts
    for row in ws.iter_rows():
        for cell in row:
            v = cell.value
            key = f"{name}!{cell.coordinate}"
            if (cell.row, cell.column) in dv_cells:
                if v not in (None, ""):                     # only dropdowns the example filled in
                    dropdowns.append((key, v, dv_cells[(cell.row, cell.column)]))
            elif isinstance(v, (int, float)) and not isinstance(v, bool):
                if isinstance(v, int) and 1900 <= v <= 2100:  # a year: leave it
                    continue
                numbers.append((key, v))

rnd = random.Random(seed)
kinds = ["moderate", "moderate", "wide", "dropdowns", "zeros"]
scenarios = []
for i in range(count):
    kind = kinds[i % len(kinds)]
    ch = {}
    share = {"moderate": .4, "wide": .6, "dropdowns": .2, "zeros": .3}[kind]
    for key, v in numbers:
        if rnd.random() < share:
            if kind == "zeros" and rnd.random() < .5:
                ch[key] = 0
            elif kind == "wide":
                ch[key] = round(v * rnd.choice([rnd.uniform(.05, .5), rnd.uniform(1.5, 4)]), 6)
            else:
                ch[key] = round(v * rnd.uniform(.6, 1.4), 6)
    n_dd = {"moderate": 2, "wide": 3, "dropdowns": 8, "zeros": 2}[kind]
    for key, v, opts in rnd.sample(dropdowns, min(n_dd, len(dropdowns))):
        others = [o for o in opts if o != v]
        if others: ch[key] = rnd.choice(others)
    scenarios.append({"id": f"S{i + 1:02d}", "kind": kind, "changes": ch})

json.dump({"source": src.split("/")[-1], "numbers": len(numbers), "dropdowns": len(dropdowns),
           "scenarios": scenarios}, open(out, "w"), ensure_ascii=False, indent=1)
print(f"{len(numbers)} numeric inputs, {len(dropdowns)} dropdowns -> {count} scenarios, "
      f"{sum(len(s['changes']) for s in scenarios)} input changes in total")
