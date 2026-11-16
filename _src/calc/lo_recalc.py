"""Write input changes into a copy of a workbook, recalculate it with LibreOffice, return cached values.
Usage: python3 lo_recalc.py <in.xlsx> <changes.json> <out.xlsx>"""
import sys, json, openpyxl, subprocess, os, shutil, tempfile
src, changes_file, out = sys.argv[1:4]
changes = json.load(open(changes_file))
wb = openpyxl.load_workbook(src)
for key, val in changes.items():
    sheet, addr = key.rsplit("!", 1)
    wb[sheet][addr].value = val
tmpdir = tempfile.mkdtemp()
tmp = os.path.join(tmpdir, "in.xlsx")
wb.save(tmp)
# LibreOffice headless: open, recalculate all formulas, save as xlsx
subprocess.run(["soffice", "--headless", "--norestore", "--convert-to", "xlsx:Calc MS Excel 2007 XML",
                "--outdir", tmpdir + "/o", tmp], check=True, capture_output=True, timeout=300,
               env=dict(os.environ, HOME=tmpdir))
shutil.move(os.path.join(tmpdir, "o", "in.xlsx"), out)
print("recalculated ->", out)
