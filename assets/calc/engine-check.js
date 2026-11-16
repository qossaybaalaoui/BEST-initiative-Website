/* Engine check page: proves the browser engine reproduces the Excel calculators. */
(function () {
  var root = document.body.getAttribute("data-root") || "";
  var MODELS = {
    pe: { model: "pe-v3-example.json", excel: "pe-v3-example.excel.json", unit: "t CO₂e / t PE" },
    eth: { model: "ethylene-v2-example.json", excel: "ethylene-v2-example.excel.json", unit: "t CO₂e / t ethylene" }
  };
  var state = { wb: null, excel: null, key: "pe" };
  var $ = function (id) { return document.getElementById(id); };
  function fmt(v, d) { return typeof v === "number" ? v.toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d }) : String(v); }
  function same(a, b) {
    if (b === null || b === undefined) return a === 0 || a === "" || a === null;
    if (typeof b === "number" && typeof a === "number") return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b));
    if (BestEngine.isErr(a)) return typeof b === "string" && b === a.err;
    if (typeof b === "boolean") return a === b;
    return String(a) === String(b);
  }
  function load(key) {
    state.key = key;
    $("ec-status").textContent = "Loading the calculator model…";
    $("ec-run").disabled = true;
    var m = MODELS[key];
    return Promise.all([fetch(root + "assets/calc/" + m.model).then(function (r) { return r.json(); }), fetch(root + "assets/calc/" + m.excel).then(function (r) { return r.json(); })])
      .then(function (res) {
        state.wb = new BestEngine.Workbook(res[0]); state.excel = res[1];
        $("ec-input-label").textContent = state.wb.get("4 Production Input!E17") + " — fresh feed (t/yr)";
        $("ec-input").value = state.wb.get("4 Production Input!F17");
        $("ec-status").textContent = "Model loaded. Press “Run check”.";
        $("ec-run").disabled = false;
        showTerms();
      })
      .catch(function () { $("ec-status").textContent = "Could not load the model files."; });
  }
  function showTerms() {
    var wb = state.wb, rows = "";
    for (var r = 5; r <= 23; r++) {
      var id = wb.get("8 Calc Engine!B" + r), name = wb.get("8 Calc Engine!C" + r), v = wb.get("8 Calc Engine!F" + r);
      var x = state.excel["8 Calc Engine!F" + r]; if (x === undefined) x = state.wb.model.cells["8 Calc Engine!F" + r];
      var changed = state.wb.inputs && Object.keys(state.wb.inputs).length > 0;
      rows += "<tr><td>" + id + "</td><td>" + String(name).split(" (")[0] + "</td><td class=\"num\">" + fmt(v, 1) + "</td><td class=\"num\">" + (changed ? "—" : fmt(x, 1)) + "</td></tr>";
    }
    $("ec-terms").innerHTML = rows;
    var pcf = wb.get("8 Calc Engine!F70");
    $("ec-pcf").textContent = fmt(pcf, 3);
    $("ec-unit").textContent = MODELS[state.key].unit;
    $("ec-status-line").textContent = wb.get("8 Calc Engine!F177");
  }
  function runCheck() {
    var wb = state.wb; wb.reset();
    $("ec-input").value = wb.get("4 Production Input!F17");
    var t0 = performance.now(), keys = Object.keys(state.excel), ok = 0;
    keys.forEach(function (k) {
      var m = /^(.*)!([A-Z]+)(\d+)$/.exec(k);
      if (same(wb.cell(m[1], +m[3], BestEngine.colToNum(m[2])), state.excel[k])) ok++;
    });
    var ms = Math.round(performance.now() - t0);
    $("ec-match").textContent = ok.toLocaleString("en-US") + " / " + keys.length.toLocaleString("en-US");
    $("ec-time").textContent = ms + " ms";
    $("ec-result").className = "ec-result " + (ok === keys.length ? "pass" : "fail");
    $("ec-result-text").textContent = ok === keys.length ? "Every formula cell matches Excel." : (keys.length - ok) + " cells differ from Excel.";
    $("ec-status").textContent = "Check complete.";
    showTerms();
  }
  document.addEventListener("DOMContentLoaded", function () {
    Array.prototype.forEach.call(document.querySelectorAll("[data-model]"), function (b) {
      b.addEventListener("click", function () {
        Array.prototype.forEach.call(document.querySelectorAll("[data-model]"), function (x) { x.setAttribute("aria-selected", x === b ? "true" : "false"); });
        $("ec-match").textContent = "—"; $("ec-time").textContent = "—"; $("ec-result").className = "ec-result";
        load(b.getAttribute("data-model"));
      });
    });
    $("ec-run").addEventListener("click", runCheck);
    $("ec-input").addEventListener("input", function () {
      var v = parseFloat(this.value);
      var field = this.closest(".field");
      if (isNaN(v) || v < 0) { field.classList.add("invalid"); return; }
      field.classList.remove("invalid");
      state.wb.set("4 Production Input!F17", v);
      showTerms();
    });
    load("pe");
  });
})();
