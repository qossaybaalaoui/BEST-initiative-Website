"""Write each scenario into a copy of the workbook and recalculate them all with LibreOffice.
Writes <outdir>/xlsx/<id>.xlsx (inputs changed, no saved values) and <outdir>/lo/<id>.xlsx (recalculated),
then <outdir>/lo/<id>.values.json with the value of every formula cell.
Usage: python3 recalc_all.py <example.xlsx> <scenarios.json> <outdir>"""
import sys, json, os, subprocess, tempfile, glob
import openpyxl

src, scen_file, outdir = sys.argv[1:4]
spec = json.load(open(scen_file))
scen = [{"id": "S00", "kind": "baseline", "changes": {}}] + spec["scenarios"]
os.makedirs(f"{outdir}/xlsx", exist_ok=True); os.makedirs(f"{outdir}/lo", exist_ok=True)

formula_cells = None
for s in scen:
    wb = openpyxl.load_workbook(src)
    if formula_cells is None:
        formula_cells = [(ws.title, c.coordinate) for ws in wb.worksheets for row in ws.iter_rows()
                         for c in row if isinstance(c.value, str) and c.value.startswith("=")]
    for key, val in s["changes"].items():
        sheet, addr = key.rsplit("!", 1)
        wb[sheet][addr].value = val
    wb.calculation.fullCalcOnLoad = True        # Excel recalculates everything when the file opens
    wb.save(f"{outdir}/xlsx/{s['id']}.xlsx")

# LibreOffice, headless: open each file, recalculate, save. One call for all files.
home = tempfile.mkdtemp()
files = sorted(glob.glob(f"{outdir}/xlsx/*.xlsx"))
subprocess.run(["soffice", "--headless", "--norestore", "--convert-to", "xlsx:Calc MS Excel 2007 XML",
                "--outdir", f"{outdir}/lo"] + files, check=True, capture_output=True, timeout=3600,
               env=dict(os.environ, HOME=home))

for s in scen:
    wv = openpyxl.load_workbook(f"{outdir}/lo/{s['id']}.xlsx", data_only=True)
    vals = {}
    for sh, addr in formula_cells:
        v = wv[sh][addr].value
        if hasattr(v, "isoformat"): v = v.isoformat()
        vals[f"{sh}!{addr}"] = v
    json.dump(vals, open(f"{outdir}/lo/{s['id']}.values.json", "w"), ensure_ascii=False)
print(f"{len(scen)} workbooks recalculated, {len(formula_cells)} formula cells each")
