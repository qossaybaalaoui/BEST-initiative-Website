// Compare the engine with recalculated workbooks, scenario by scenario, every formula cell.
// Usage: node compare.js <model.json> <excel-cached.json> <scenarios.json> <dir> <headlineCell> <out.json>
// <excel-cached.json> = values real Excel saved for the unchanged example: used to tell apart cells where
// LibreOffice itself differs from Excel (a LibreOffice quirk, not an engine error).
const fs = require("fs");
const E = require("../../../assets/calc/engine.js");
const [modelFile, excelFile, scenFile, dir, headline, outFile] = process.argv.slice(2);
const model = JSON.parse(fs.readFileSync(modelFile, "utf8"));
const excel = JSON.parse(fs.readFileSync(excelFile, "utf8"));
const spec = JSON.parse(fs.readFileSync(scenFile, "utf8"));
const scen = [{ id: "S00", kind: "baseline", changes: {} }].concat(spec.scenarios);

function norm(v) { return E.isErr(v) ? v.err : v; }
function same(a, b) {                       // a = engine, b = reference
  if (b === null || b === undefined || b === "") return a === 0 || a === "" || a === null || a === false;
  if (typeof b === "number" && typeof a === "number") return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b));
  if (typeof b === "number" && typeof a === "boolean") return (a ? 1 : 0) === b;
  if (typeof b === "boolean") return a === b || a === (b ? 1 : 0);
  if (typeof b === "string" && b.startsWith("#") && E.isErr(a)) return true;  // both an error
  if (E.isErr(a)) return false;
  return String(a) === String(b);
}
function relDiff(a, b) { return (typeof a === "number" && typeof b === "number") ? Math.abs(a - b) / Math.max(1e-12, Math.abs(b)) : null; }

// Cells where LibreOffice already disagrees with real Excel on the unchanged example
const lo0 = JSON.parse(fs.readFileSync(`${dir}/lo/S00.values.json`, "utf8"));
const loQuirk = new Set(Object.keys(lo0).filter(k => k in excel && !same(lo0[k], excel[k]) && !same(excel[k], lo0[k])));

const rows = [];
let totalCells = 0, totalMatch = 0, totalQuirk = 0;
const allBad = [];
for (const s of scen) {
  const ref = JSON.parse(fs.readFileSync(`${dir}/lo/${s.id}.values.json`, "utf8"));
  const wb = new E.Workbook(model);
  wb.setMany(s.changes);
  const t0 = Date.now();
  let match = 0, quirk = 0, bad = [], maxRel = 0;
  for (const key of Object.keys(ref)) {
    const m = /^(.*)!([A-Z]+)(\d+)$/.exec(key);
    let v; try { v = wb.cell(m[1], +m[3], E.colToNum(m[2])); } catch (e) { v = { err: "EXC" }; }
    if (same(v, ref[key])) { match++; const d = relDiff(v, ref[key]); if (d !== null && d > maxRel) maxRel = d; }
    else if (loQuirk.has(key)) quirk++;
    else bad.push({ cell: key, reference: ref[key], engine: norm(v) });
  }
  const ms = Date.now() - t0;
  const eh = norm(wb.get(headline)), rh = ref[headline];
  totalCells += Object.keys(ref).length; totalMatch += match; totalQuirk += quirk;
  bad.forEach(b => allBad.push(Object.assign({ scenario: s.id }, b)));
  rows.push({ id: s.id, kind: s.kind, inputs_changed: Object.keys(s.changes).length, cells: Object.keys(ref).length,
              match, lo_quirk: quirk, mismatch: bad.length, max_rel_diff: maxRel, headline_engine: eh,
              headline_reference: rh, ms });
  console.log(`${s.id} ${s.kind.padEnd(9)} inputs ${String(Object.keys(s.changes).length).padStart(3)}  ` +
              `match ${match}/${Object.keys(ref).length}  LO-quirk ${quirk}  mismatch ${bad.length}  ` +
              `PCF engine ${typeof eh === "number" ? eh.toFixed(6) : eh}  ref ${typeof rh === "number" ? rh.toFixed(6) : rh}  ${ms} ms`);
}
console.log(`\nTOTAL match ${totalMatch}/${totalCells}  LibreOffice quirks ${totalQuirk}  mismatches ${allBad.length}`);
console.log(`LibreOffice-vs-Excel quirk cells on the unchanged example: ${loQuirk.size}`);
allBad.slice(0, +(process.env.SHOW || 30)).forEach(b => console.log(" ", b.scenario, b.cell, "| ref:", JSON.stringify(b.reference).slice(0, 80), "| engine:", JSON.stringify(b.engine).slice(0, 80)));
fs.writeFileSync(outFile, JSON.stringify({ headline, quirk_cells: [...loQuirk].map(k => ({ cell: k, excel: excel[k], libreoffice: lo0[k] })),
  rows, mismatches: allBad }, null, 1));
