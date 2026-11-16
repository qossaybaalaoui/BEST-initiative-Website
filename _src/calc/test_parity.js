// Parity test: every formula cell must match the value Excel saved in the workbook.
const fs = require("fs");
const E = require("../../assets/calc/engine.js");
const [modelFile, cachedFile] = process.argv.slice(2);
const model = JSON.parse(fs.readFileSync(modelFile, "utf8"));
const cached = JSON.parse(fs.readFileSync(cachedFile, "utf8"));
const wb = new E.Workbook(model);
const t0 = Date.now();
let ok = 0, bad = [], parseErr = {};
function same(a, b) {
  if (b === null || b === undefined) return a === 0 || a === "" || a === null;
  if (typeof b === "number" && typeof a === "number") return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b));
  if (typeof b === "string" && b.startsWith("#") && E.isErr(a)) return a.err === b;
  if (E.isErr(a)) return false;
  if (typeof b === "boolean") return a === b;
  return String(a) === String(b);
}
for (const key of Object.keys(cached)) {
  const m = /^(.*)!([A-Z]+)(\d+)$/.exec(key);
  let v;
  try { v = wb.cell(m[1], +m[3], E.colToNum(m[2])); }
  catch (e) { parseErr[e.message.slice(0, 80)] = (parseErr[e.message.slice(0, 80)] || 0) + 1; v = "EXC"; }
  if (same(v, cached[key])) ok++; else bad.push([key, cached[key], E.isErr(v) ? v.err : v]);
}
const ms = Date.now() - t0;
console.log(`match ${ok}/${Object.keys(cached).length}  (${(100 * ok / Object.keys(cached).length).toFixed(2)}%)  in ${ms} ms`);
const bySheet = {};
bad.forEach(b => { const s = b[0].split("!")[0]; bySheet[s] = (bySheet[s] || 0) + 1; });
console.log("mismatches by sheet", bySheet);
console.log("exceptions", parseErr);
const show = +(process.env.SHOW || 25);
bad.slice(0, show).forEach(b => console.log(" ", b[0], "| excel:", JSON.stringify(b[1]).slice(0, 90), "| js:", JSON.stringify(b[2]).slice(0, 90)));
if (wb.lastError) console.log("last internal error", wb.lastError.key, String(wb.lastError.error).slice(0, 200));
for (const k of ["8 Calc Engine!F70", "8 Calc Engine!F24", "9 Results!G26"]) console.log(k, "excel", cached[k], "js", (() => { try { return wb.get(k); } catch (e) { return e.message; } })());
