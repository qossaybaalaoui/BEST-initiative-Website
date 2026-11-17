# Engine validation against the spreadsheet

Random scenarios are applied to a worked example, each workbook is recalculated by a spreadsheet
program, and every formula cell is compared with the engine.

```
python3 make_scenarios.py <example.xlsx> pe-scenarios.json 25 101     # input changes (seeded)
python3 recalc_all.py <example.xlsx> pe-scenarios.json pe               # LibreOffice recalculation
node compare.js ../../../assets/calc/pe-v3-example.json ../../../assets/calc/pe-v3-example.excel.json \
     pe-scenarios.json pe "8 Calc Engine!F70" pe-result.json            # cell-by-cell comparison
```

`recalc_all.py` also writes `<dir>/xlsx/*.xlsx`: the changed workbooks with no saved results, set to
recalculate on open. Saved again from Microsoft Excel, they give the Excel reference: read their values
the same way (the last loop of `recalc_all.py`) and run `compare.js`.

Run of 17 Nov 2026: 52 scenarios (seeds 101 and 202), PCF identical in all 52, 99.76% of 395,460 cells
identical; all differences traced to two LibreOffice-vs-Excel behaviours (see the validation report).
