# BEST calculator engine

The online PCF calculators run the BEST calculator workbooks in the browser.

- `assets/calc/engine.js` — Excel-compatible formula engine (parser + evaluator, 38 functions).
- `assets/calc/*-template.json` — blank calculators exported from the Excel templates.
- `assets/calc/*-example.json` — the worked examples (HDPE gas phase, ethane cracker).
- `assets/calc/*-example.excel.json` — values Excel saved for every formula cell of the examples (test reference).

## Rebuild a model from a workbook

```
python3 _src/calc/extract.py <workbook.xlsx> assets/calc/<name>.json --cached <name>.excel.json
```

## Tests

```
node _src/calc/test_parity.js assets/calc/pe-v3-example.json assets/calc/pe-v3-example.excel.json
node _src/calc/test_parity.js assets/calc/ethylene-v2-example.json assets/calc/ethylene-v2-example.excel.json
```

Every formula cell must match Excel (currently 7,482/7,482 for PE and 7,730/7,730 for ethylene).
`lo_recalc.py` recalculates a workbook with changed inputs in LibreOffice to test the engine on
scenarios beyond the examples (`tests/scenario-*.json`); the headline PCF matched in both scenarios.
The browser check page is `tools/engine-check/`.
