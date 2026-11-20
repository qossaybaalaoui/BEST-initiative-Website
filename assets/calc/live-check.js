/* Live check: drop a workbook saved in Excel; the engine recalculates it from its own formulas and
   inputs and every formula cell is compared with the result Excel saved. Nothing leaves the browser. */
(function (root, factory) {
  var api = factory(root.BestEngine || (typeof require === "function" ? require("./engine.js") : null),
                    root.BestXlsx || (typeof require === "function" ? require("./xlsx-read.js") : null));
  if (typeof module === "object" && module.exports) module.exports = api; else root.BestLiveCheck = api;
})(typeof self !== "undefined" ? self : this, function (E, X) {
  "use strict";

  function same(a, b) {                       // a = engine, b = Excel's saved value
    if (b === null || b === undefined || b === "") return a === 0 || a === "" || a === null || a === false;
    if (E.isErr(a)) return typeof b === "string" && b === a.err;
    if (typeof b === "number" && typeof a === "number") return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b));
    if (typeof b === "number" && typeof a === "boolean") return (a ? 1 : 0) === b;
    if (typeof b === "boolean") return a === b || a === (b ? 1 : 0);
    return String(a) === String(b);
  }
  function show(v) {
    if (v && E.isErr(v)) return v.err;
    if (v === null || v === undefined) return "(empty)";
    if (typeof v === "number") return Math.abs(v) >= 1e-4 || v === 0 ? +v.toPrecision(10) + "" : v.toExponential(6);
    return String(v);
  }
  function kind(model) {
    var t = String(model.cells["1 Introduction!A1"] || "").toUpperCase();
    if (!model.cells["8 Calc Engine!F70"] && !("8 Calc Engine!F70" in model.cells)) return null;
    if (t.indexOf("POLYETHYLENE") >= 0) return { id: "pe", name: "Polyethylene (PE) calculator", unit: "t CO₂e / t PE" };
    if (t.indexOf("ETHYLENE") >= 0) return { id: "eth", name: "Ethylene calculator", unit: "t CO₂e / t ethylene" };
    return { id: "other", name: "BEST calculator", unit: "t CO₂e / t" };
  }

  // Run the whole check on a workbook already read by BestXlsx
  function check(read) {
    var model = read.model, saved = read.saved, wb = new E.Workbook(model);
    var t0 = Date.now(), keys = Object.keys(saved), ok = 0, diffs = [], bySheet = {};
    keys.forEach(function (k) {
      var m = /^(.*)!([A-Z]+)(\d+)$/.exec(k), v;
      try { v = wb.cell(m[1], +m[3], E.colToNum(m[2])); } catch (e) { v = { err: "#ENGINE" }; }
      var sh = bySheet[m[1]] || (bySheet[m[1]] = { cells: 0, ok: 0 });
      sh.cells++;
      if (same(v, saved[k])) { ok++; sh.ok++; }
      else diffs.push({ cell: k, excel: show(saved[k]), engine: show(v) });
    });
    var ms = Date.now() - t0, c = kind(model);
    var terms = [];
    if (c) for (var r = 5; r <= 23; r++) {
      var id = wb.get("8 Calc Engine!B" + r);
      if (id === null || id === undefined || id === "" || id === 0) continue;
      terms.push({ id: id, name: String(wb.get("8 Calc Engine!C" + r)).split(" (")[0],
                   engine: wb.get("8 Calc Engine!F" + r), excel: saved["8 Calc Engine!F" + r] });
    }
    return {
      calculator: c, cells: keys.length, ok: ok, diffs: diffs, bySheet: bySheet, ms: ms,
      pcf: c ? { engine: wb.get("8 Calc Engine!F70"), excel: saved["8 Calc Engine!F70"] } : null,
      status: c ? { engine: wb.get("8 Calc Engine!F177"), excel: saved["8 Calc Engine!F177"] } : null,
      terms: terms, info: read.info
    };
  }

  /* ------------------------------------------------------------------ page */
  function ui() {
    var $ = function (id) { return document.getElementById(id); };
    var drop = $("lc-drop"), input = $("lc-file");
    if (!drop) return;
    function fmt(v, d) { return typeof v === "number" ? v.toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d }) : (v === undefined || v === null ? "—" : String(v)); }
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
    function status(msg, bad) { $("lc-status").textContent = msg; $("lc-status").className = "lc-status" + (bad ? " bad" : ""); }
    function handle(file) {
      if (!file) return;
      if (!/\.xlsx$/i.test(file.name)) { status("Please choose an .xlsx workbook saved in Excel.", true); return; }
      if (typeof DecompressionStream === "undefined") { status("This browser is too old to read .xlsx files. Please use a recent Chrome, Edge, Firefox or Safari.", true); return; }
      status("Reading " + file.name + " …");
      $("lc-out").hidden = true;
      var t0 = performance.now();
      file.arrayBuffer().then(X.read).then(function (read) {
        var tRead = Math.round(performance.now() - t0);
        status("Recalculating " + read.info.formulas.toLocaleString("en-US") + " formulas with the engine …");
        return new Promise(function (res) { setTimeout(function () { res([read, tRead]); }, 30); });
      }).then(function (x) {
        var read = x[0], res = check(read);
        render(file, res, x[1]);
        status("");
      }).catch(function (e) { status("Could not read this file: " + e.message, true); });
    }
    function render(file, res, tRead) {
      $("lc-out").hidden = false;
      $("lc-file-name").textContent = file.name;
      $("lc-calc").textContent = res.calculator ? res.calculator.name : "Workbook (not recognised as a BEST calculator)";
      var by = res.info.savedBy || "unknown", byName = /Microsoft Excel/i.test(by) ? "Microsoft Excel" : /LibreOffice/i.test(by) ? "LibreOffice" : by;
      $("lc-saved-by").textContent = "Last saved by: " + byName;
      var warn = [];
      if (res.info.withoutSaved > res.cells * 0.5) warn.push("This file holds no results saved by Excel. Open it in Excel, let it calculate, save it, then drop it here again.");
      else if (res.info.withoutSaved) warn.push(res.info.withoutSaved + " formulas have no saved result in the file.");
      if (byName !== "Microsoft Excel" && res.info.withoutSaved < res.cells * 0.5) warn.push("This file was last saved by " + byName + ", so the saved results are that program's, not Excel's.");
      if (res.info.manualCalc) warn.push("Excel is set to manual calculation in this file: press F9 in Excel before saving, or the saved results may be out of date.");
      $("lc-warn").hidden = !warn.length; $("lc-warn").textContent = warn.join(" ");
      var pass = res.ok === res.cells, empty = res.info.withoutSaved > res.cells * 0.5;
      $("lc-result").className = "ec-result " + (empty ? "" : pass ? "pass" : "fail");
      $("lc-match").textContent = res.ok.toLocaleString("en-US") + " / " + res.cells.toLocaleString("en-US");
      $("lc-time").textContent = res.ms + " ms (file read in " + tRead + " ms)";
      $("lc-verdict").textContent = empty ? "Nothing to compare yet: the file has no saved results."
        : pass ? "Every formula cell matches the result " + (byName === "Microsoft Excel" ? "Excel" : byName) + " saved."
        : (res.cells - res.ok).toLocaleString("en-US") + " cells differ from the results saved in the file: see the list below.";
      $("lc-diff-wrap").hidden = empty || !res.diffs.length;
      if (res.pcf) {
        $("lc-pcf-x").textContent = fmt(res.pcf.excel, 4); $("lc-pcf-e").textContent = fmt(res.pcf.engine, 4);
        $("lc-unit").textContent = res.calculator.unit;
        $("lc-st-x").textContent = fmt(res.status.excel); $("lc-st-e").textContent = fmt(res.status.engine);
        $("lc-pcf").hidden = false;
        $("lc-terms").innerHTML = res.terms.map(function (t) {
          var ok = same(t.engine, t.excel);
          return "<tr><td>" + esc(t.id) + "</td><td>" + esc(t.name) + "</td><td class=\"num\">" + fmt(t.excel, 1) + "</td><td class=\"num\">" + fmt(t.engine, 1) + "</td><td>" + (ok ? "Same" : "<b>Different</b>") + "</td></tr>";
        }).join("");
      } else $("lc-pcf").hidden = true;
      $("lc-sheets").innerHTML = Object.keys(res.bySheet).map(function (s) {
        var b = res.bySheet[s];
        return "<tr><td>" + esc(s) + "</td><td class=\"num\">" + b.cells.toLocaleString("en-US") + "</td><td class=\"num\">" + b.ok.toLocaleString("en-US") + "</td><td class=\"num\">" + (b.cells - b.ok ? "<b>" + (b.cells - b.ok) + "</b>" : "0") + "</td></tr>";
      }).join("");
      $("lc-diffs").innerHTML = res.diffs.slice(0, 200).map(function (d) {
        return "<tr><td>" + esc(d.cell) + "</td><td>" + esc(d.excel).slice(0, 90) + "</td><td>" + esc(d.engine).slice(0, 90) + "</td></tr>";
      }).join("") + (res.diffs.length > 200 ? "<tr><td colspan=\"3\">… and " + (res.diffs.length - 200) + " more</td></tr>" : "");
      $("lc-out").scrollIntoView({ behavior: "smooth", block: "start" });
    }
    input.addEventListener("change", function () { handle(input.files[0]); input.value = ""; });
    ["dragenter", "dragover"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("over"); }); });
    ["dragleave", "drop"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("over"); }); });
    drop.addEventListener("drop", function (e) { handle(e.dataTransfer.files[0]); });
  }
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ui); else ui();
  }
  return { check: check, same: same };
});
