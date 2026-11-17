/* BEST formula engine — evaluates the BEST PCF calculator workbook model in JavaScript.
 *
 * The workbook is exported to JSON (cells, formulas, defined names) by extract.py.
 * This engine parses each Excel formula and evaluates it with Excel semantics
 * (lazy, memoised, array-aware), so the website reproduces the workbook exactly.
 *
 * Usage:
 *   const wb = new BestEngine.Workbook(model);
 *   wb.set("3 Setup!C6", "My plant");     // change an input
 *   wb.get("8 Calc Engine!F70");           // read any result (recalculates lazily)
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.BestEngine = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* ------------------------------------------------------------------ values */
  function XErr(code) { this.err = code; }
  XErr.prototype.toString = function () { return this.err; };
  var ERR = {};
  ["#NULL!", "#DIV/0!", "#VALUE!", "#REF!", "#NAME?", "#NUM!", "#N/A"].forEach(function (c) { ERR[c] = new XErr(c); });
  function isErr(v) { return v instanceof XErr; }

  // A rectangular reference to cells on one sheet (1-based rows/cols, inclusive).
  function Ref(sheet, r1, c1, r2, c2) { this.sheet = sheet; this.r1 = r1; this.c1 = c1; this.r2 = r2; this.c2 = c2; }
  Ref.prototype.rows = function () { return this.r2 - this.r1 + 1; };
  Ref.prototype.cols = function () { return this.c2 - this.c1 + 1; };
  Ref.prototype.isCell = function () { return this.r1 === this.r2 && this.c1 === this.c2; };

  // A 2-D array value: data[row][col]
  function Arr(data) { this.data = data; }
  Arr.prototype.rows = function () { return this.data.length; };
  Arr.prototype.cols = function () { return this.data.length ? this.data[0].length : 0; };

  var EMPTY = null; // empty cell

  /* ------------------------------------------------------------- addressing */
  function colToNum(s) { var n = 0; for (var i = 0; i < s.length; i++) n = n * 26 + (s.charCodeAt(i) - 64); return n; }
  function numToCol(n) { var s = ""; while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }
  function cellKey(sheet, r, c) { return sheet + "!" + numToCol(c) + r; }

  /* -------------------------------------------------------------- tokenizer */
  // Token types: num, str, bool, err, ref, name, func, op, comma, semi, lparen, rparen, lbrace, rbrace
  var ERR_RE = /^#(NULL!|DIV\/0!|VALUE!|REF!|NAME\?|NUM!|N\/A|GETTING_DATA)/i;
  function tokenize(f) {
    var toks = [], i = 0, n = f.length;
    function push(t, v, extra) { var o = { t: t, v: v }; if (extra) for (var k in extra) o[k] = extra[k]; toks.push(o); }
    while (i < n) {
      var ch = f[i];
      if (ch === " " || ch === "\n" || ch === "\r" || ch === "\t") { i++; continue; }
      if (ch === '"') {
        var s = ""; i++;
        while (i < n) { if (f[i] === '"') { if (f[i + 1] === '"') { s += '"'; i += 2; continue; } i++; break; } s += f[i++]; }
        push("str", s); continue;
      }
      if (ch === "#") {
        var m = ERR_RE.exec(f.slice(i));
        if (m) { push("err", ("#" + m[1]).toUpperCase()); i += m[0].length; continue; }
      }
      // sheet-qualified reference: 'Sheet name'!A1 or Sheet!A1
      var sheet = null, j = i;
      if (ch === "'") {
        var sn = ""; j = i + 1;
        while (j < n) { if (f[j] === "'") { if (f[j + 1] === "'") { sn += "'"; j += 2; continue; } j++; break; } sn += f[j++]; }
        if (f[j] === "!") { sheet = sn; j++; } else j = i;
      } else {
        var mm = /^([A-Za-z_][A-Za-z0-9_\.]*)!/.exec(f.slice(i));
        if (mm) { sheet = mm[1]; j = i + mm[0].length; }
      }
      var rest = f.slice(j);
      var rm = /^\$?([A-Za-z]{1,3})\$?(\d+)(?:\:\$?([A-Za-z]{1,3})\$?(\d+))?(?![A-Za-z0-9_\(\.])/.exec(rest);
      if (rm) {
        push("ref", null, { sheet: sheet, c1: colToNum(rm[1].toUpperCase()), r1: +rm[2], c2: rm[3] ? colToNum(rm[3].toUpperCase()) : null, r2: rm[4] ? +rm[4] : null });
        i = j + rm[0].length; continue;
      }
      var cm = /^\$?([A-Za-z]{1,3})\:\$?([A-Za-z]{1,3})(?![A-Za-z0-9_\(])/.exec(rest); // whole columns A:B
      if (cm) { push("ref", null, { sheet: sheet, c1: colToNum(cm[1].toUpperCase()), r1: 1, c2: colToNum(cm[2].toUpperCase()), r2: -1 }); i = j + cm[0].length; continue; }
      var wm = /^\$?(\d+)\:\$?(\d+)(?![0-9])/.exec(rest); // whole rows 1:3
      if (sheet && wm) { push("ref", null, { sheet: sheet, c1: 1, r1: +wm[1], c2: -1, r2: +wm[2] }); i = j + wm[0].length; continue; }
      if (sheet) { // sheet-scoped defined name: Sheet!Name
        var nm2 = /^[A-Za-z_\\][A-Za-z0-9_\.]*/.exec(rest);
        if (nm2) { push("name", sheet + "!" + nm2[0]); i = j + nm2[0].length; continue; }
      }
      var num = /^(\d+\.?\d*|\.\d+)(E[+-]?\d+)?/i.exec(f.slice(i));
      if (num) { push("num", parseFloat(num[0])); i += num[0].length; continue; }
      var id = /^(_xlfn\.|_xlws\.)?([A-Za-z_\\][A-Za-z0-9_\.]*)/.exec(f.slice(i));
      if (id) {
        var name = id[2]; i += id[0].length;
        while (f[i] === " ") i++;
        if (f[i] === "(") { push("func", name.toUpperCase()); continue; }
        var up = name.toUpperCase();
        if (up === "TRUE" || up === "FALSE") { push("bool", up === "TRUE"); continue; }
        push("name", name); continue;
      }
      var two = f.substr(i, 2);
      if (two === "<=" || two === ">=" || two === "<>") { push("op", two); i += 2; continue; }
      if ("+-*/^&=<>%".indexOf(ch) !== -1) { push("op", ch); i++; continue; }
      if (ch === ":") { push("op", ":"); i++; continue; }
      if (ch === ",") { push("comma"); i++; continue; }
      if (ch === ";") { push("semi"); i++; continue; }
      if (ch === "(") { push("lparen"); i++; continue; }
      if (ch === ")") { push("rparen"); i++; continue; }
      if (ch === "{") { push("lbrace"); i++; continue; }
      if (ch === "}") { push("rbrace"); i++; continue; }
      if (ch === "@") { i++; continue; } // implicit-intersection marker: ignore
      throw new Error("Cannot tokenize at: " + f.slice(i, i + 20));
    }
    return toks;
  }

  /* ----------------------------------------------------------------- parser */
  // AST nodes: {k:'num'|'str'|'bool'|'err'|'ref'|'name'|'arr'|'un'|'bin'|'post'|'fn', ...}
  var BIN_PREC = { "=": 1, "<>": 1, "<": 1, ">": 1, "<=": 1, ">=": 1, "&": 2, "+": 3, "-": 3, "*": 4, "/": 4, "^": 5 };
  function parse(formula) {
    var toks = tokenize(formula), p = 0;
    function peek() { return toks[p]; }
    function next() { return toks[p++]; }
    function expect(t) { var x = next(); if (!x || x.t !== t) throw new Error("Expected " + t + " in " + formula); return x; }
    function parseExpr(minPrec) {
      var left = parseUnary();
      for (;;) {
        var t = peek();
        if (!t || t.t !== "op" || !(t.v in BIN_PREC)) break;
        var prec = BIN_PREC[t.v];
        if (prec < minPrec) break;
        next();
        var right = parseExpr(t.v === "^" ? prec : prec + 1);
        left = { k: "bin", op: t.v, a: left, b: right };
      }
      return left;
    }
    function parseUnary() {
      var t = peek();
      if (t && t.t === "op" && (t.v === "-" || t.v === "+")) { next(); var e = parseUnary(); return t.v === "-" ? { k: "un", op: "-", a: e } : e; }
      return parsePostfix();
    }
    function parsePostfix() {
      var e = parseRange();
      while (peek() && peek().t === "op" && peek().v === "%") { next(); e = { k: "post", op: "%", a: e }; }
      return e;
    }
    function parseRange() {
      var e = parsePrimary();
      while (peek() && peek().t === "op" && peek().v === ":") { next(); var b = parsePrimary(); e = { k: "range", a: e, b: b }; }
      return e;
    }
    function parsePrimary() {
      var t = next();
      if (!t) throw new Error("Unexpected end in " + formula);
      switch (t.t) {
        case "num": return { k: "num", v: t.v };
        case "str": return { k: "str", v: t.v };
        case "bool": return { k: "bool", v: t.v };
        case "err": return { k: "err", v: t.v };
        case "ref": return { k: "ref", sheet: t.sheet, r1: t.r1, c1: t.c1, r2: t.r2, c2: t.c2 };
        case "name": return { k: "name", v: t.v };
        case "lparen": var e = parseExpr(0); expect("rparen"); return e;
        case "lbrace":
          var rows = [[]];
          for (;;) {
            var u = parseUnary();
            rows[rows.length - 1].push(u.k === "un" ? -u.a.v : u.v);
            var s = next();
            if (s.t === "comma") continue;
            if (s.t === "semi") { rows.push([]); continue; }
            if (s.t === "rbrace") break;
            throw new Error("Bad array constant in " + formula);
          }
          return { k: "arr", v: rows };
        case "func":
          expect("lparen");
          var args = [];
          if (peek() && peek().t === "rparen") { next(); return { k: "fn", f: t.v, args: args }; }
          for (;;) {
            if (peek() && (peek().t === "comma" || peek().t === "rparen")) args.push({ k: "missing" });
            else args.push(parseExpr(0));
            var d = next();
            if (d.t === "comma") continue;
            if (d.t === "rparen") break;
            throw new Error("Expected , or ) in " + formula);
          }
          return { k: "fn", f: t.v, args: args };
      }
      throw new Error("Unexpected token " + t.t + " in " + formula);
    }
    var ast = parseExpr(0);
    if (p !== toks.length) throw new Error("Trailing tokens in " + formula);
    return ast;
  }

  /* --------------------------------------------------------------- workbook */
  function Workbook(model) {
    this.model = model;
    this.sheets = {};
    var self = this;
    model.sheets.forEach(function (s) { self.sheets[s.name.toUpperCase()] = s; });
    this.inputs = {};      // overrides set by the user: key -> value
    this.cache = {};       // evaluated values
    this.asts = {};        // parsed formulas
    this.evaluating = {};  // cycle detection
    this.nameRefs = {};    // parsed defined names
  }
  Workbook.prototype.sheetName = function (s) {
    var sh = this.sheets[String(s).toUpperCase()];
    if (!sh) throw new Error("Unknown sheet " + s);
    return sh.name;
  };
  Workbook.prototype.raw = function (key) {
    if (Object.prototype.hasOwnProperty.call(this.inputs, key)) return this.inputs[key];
    var v = this.model.cells[key];
    return v === undefined ? EMPTY : v;
  };
  Workbook.prototype.isFormula = function (key) {
    var v = this.raw(key);
    return typeof v === "string" && v.charAt(0) === "=" && v.length > 1;
  };
  Workbook.prototype.set = function (key, value) {
    this.inputs[key] = value;
    this.cache = {};
  };
  Workbook.prototype.setMany = function (obj) { for (var k in obj) this.inputs[k] = obj[k]; this.cache = {}; };
  Workbook.prototype.reset = function () { this.inputs = {}; this.cache = {}; };
  // Value of a single cell (evaluates formulas lazily)
  Workbook.prototype.cell = function (sheet, r, c) {
    var key = cellKey(sheet, r, c);
    if (key in this.cache) return this.cache[key];
    var raw = this.raw(key), val;
    if (typeof raw === "string" && raw.charAt(0) === "=" && raw.length > 1) {
      if (this.evaluating[key]) return ERR["#REF!"]; // circular
      this.evaluating[key] = true;
      try {
        var ast = this.asts[key] || (this.asts[key] = parse(raw.slice(1)));
        val = toScalar(this, evalNode(this, ast, { sheet: sheet, row: r, col: c }), { sheet: sheet, row: r, col: c });
        if (val === EMPTY) val = 0;
        // Excel: when the last operation of a formula is + or − and the result is only rounding
        // noise next to its operands (e.g. 1e7 − 1e7 = 2.8e−9), the cell shows exactly 0.
        if (typeof val === "number" && val !== 0 && Math.abs(val) < 1e-6 && ast.k === "bin" && (ast.op === "+" || ast.op === "-")) {
          var ctx0 = { sheet: sheet, row: r, col: c };
          var pa = toScalar(this, evalNode(this, ast.a, ctx0), ctx0), pb = toScalar(this, evalNode(this, ast.b, ctx0), ctx0);
          if (typeof pa === "number" && typeof pb === "number" && Math.abs(val) <= Math.max(Math.abs(pa), Math.abs(pb)) * 3.6e-15) val = 0;
        }
      } catch (e) {
        if (e && e.message && e.message.indexOf("Unknown function") === 0) throw e;
        val = ERR["#VALUE!"];
        this.lastError = { key: key, error: e };
      } finally { delete this.evaluating[key]; }
    } else if (typeof raw === "string" && raw.charAt(0) === "'") {
      val = raw;
    } else {
      val = raw;
    }
    this.cache[key] = val;
    return val;
  };
  Workbook.prototype.get = function (addr) {
    var m = /^(.*)!\$?([A-Z]+)\$?(\d+)$/.exec(addr);
    if (!m) throw new Error("Bad address " + addr);
    var v = this.cell(this.sheetName(m[1]), +m[3], colToNum(m[2]));
    return isErr(v) ? v.err : v;
  };
  Workbook.prototype.name = function (n) {
    var v = deref(this, this.resolveName(n.toUpperCase(), { sheet: null, row: 1, col: 1 }), null);
    return isErr(v) ? v.err : v;
  };
  Workbook.prototype.resolveName = function (upName, ctx) {
    var text = null;
    if (ctx && ctx.sheet && this.model.names[(ctx.sheet + "!" + upName).toUpperCase()] !== undefined) text = this.model.names[(ctx.sheet + "!" + upName).toUpperCase()];
    else if (this.model.names[upName] !== undefined) text = this.model.names[upName];
    if (text === null) return ERR["#NAME?"];
    var key = upName;
    var ast = this.nameRefs[key] || (this.nameRefs[key] = parse(text.charAt(0) === "=" ? text.slice(1) : text));
    return evalNode(this, ast, ctx);
  };

  /* ------------------------------------------------------------ evaluation */
  function refFromNode(wb, n, ctx) {
    var sheet = n.sheet ? wb.sheetName(n.sheet) : ctx.sheet;
    var r1 = n.r1, c1 = n.c1, r2 = n.r2 == null ? n.r1 : n.r2, c2 = n.c2 == null ? n.c1 : n.c2;
    var sh = wb.sheets[sheet.toUpperCase()];
    if (r2 === -1) r2 = Math.max(sh.maxRow, 1);
    if (c2 === -1) c2 = Math.max(sh.maxCol, 1);
    return new Ref(sheet, Math.min(r1, r2), Math.min(c1, c2), Math.max(r1, r2), Math.max(c1, c2));
  }
  function evalNode(wb, n, ctx) {
    switch (n.k) {
      case "num": case "str": case "bool": return n.v;
      case "err": return ERR[n.v] || new XErr(n.v);
      case "missing": return EMPTY;
      case "arr": return new Arr(n.v.map(function (r) { return r.slice(); }));
      case "ref": return refFromNode(wb, n, ctx);
      case "name": return wb.resolveName(n.v.toUpperCase(), ctx);
      case "range":
        var a = evalNode(wb, n.a, ctx), b = evalNode(wb, n.b, ctx);
        if (isErr(a)) return a; if (isErr(b)) return b;
        if (!(a instanceof Ref) || !(b instanceof Ref)) return ERR["#REF!"];
        return new Ref(a.sheet, Math.min(a.r1, b.r1), Math.min(a.c1, b.c1), Math.max(a.r2, b.r2), Math.max(a.c2, b.c2));
      case "un": return map1(wb, evalNode(wb, n.a, ctx), function (x) { var v = toNum(x); return isErr(v) ? v : -v; });
      case "post": return map1(wb, evalNode(wb, n.a, ctx), function (x) { var v = toNum(x); return isErr(v) ? v : v / 100; });
      case "bin": return binop(wb, n.op, evalNode(wb, n.a, ctx), evalNode(wb, n.b, ctx));
      case "fn":
        var fn = FUNCS[n.f];
        if (!fn) throw new Error("Unknown function " + n.f);
        return fn(wb, n.args, ctx);
    }
    throw new Error("Bad node " + n.k);
  }

  // Materialise a value: Ref -> Arr (or scalar for single cell)
  function deref(wb, v, ctx) {
    if (v instanceof Ref) {
      if (v.isCell()) return wb.cell(v.sheet, v.r1, v.c1);
      var data = [];
      for (var r = v.r1; r <= v.r2; r++) { var row = []; for (var c = v.c1; c <= v.c2; c++) row.push(wb.cell(v.sheet, r, c)); data.push(row); }
      return new Arr(data);
    }
    return v;
  }
  // Final value of a formula cell: implicit intersection for ranges, top-left for arrays
  function toScalar(wb, v, ctx) {
    if (v instanceof Ref) {
      if (v.isCell()) return wb.cell(v.sheet, v.r1, v.c1);
      if (v.cols() === 1 && ctx.row >= v.r1 && ctx.row <= v.r2) return wb.cell(v.sheet, ctx.row, v.c1);
      if (v.rows() === 1 && ctx.col >= v.c1 && ctx.col <= v.c2) return wb.cell(v.sheet, v.r1, ctx.col);
      return wb.cell(v.sheet, v.r1, v.c1);
    }
    if (v instanceof Arr) return v.rows() ? v.data[0][0] : EMPTY;
    return v;
  }
  function scalarArg(wb, node, ctx) { return toScalar(wb, evalNode(wb, node, ctx), ctx); }

  // Apply f elementwise over a (possibly array) value
  function map1(wb, v, f) {
    v = deref(wb, v);
    if (v instanceof Arr) return new Arr(v.data.map(function (r) { return r.map(f); }));
    return f(v);
  }
  // Broadcast two values (Excel array semantics)
  function map2(wb, a, b, f) {
    a = deref(wb, a); b = deref(wb, b);
    var aA = a instanceof Arr, bA = b instanceof Arr;
    if (!aA && !bA) return f(a, b);
    var ar = aA ? a.rows() : 1, ac = aA ? a.cols() : 1, br = bA ? b.rows() : 1, bc = bA ? b.cols() : 1;
    var R = Math.max(ar, br), C = Math.max(ac, bc), out = [];
    for (var r = 0; r < R; r++) {
      var row = [];
      for (var c = 0; c < C; c++) {
        var x = aA ? pick(a, ar, ac, r, c) : a, y = bA ? pick(b, br, bc, r, c) : b;
        row.push(x === undefined || y === undefined ? ERR["#N/A"] : f(x, y));
      }
      out.push(row);
    }
    return new Arr(out);
  }
  function pick(arr, R, C, r, c) {
    var rr = R === 1 ? 0 : r, cc = C === 1 ? 0 : c;
    if (rr >= R || cc >= C) return undefined;
    return arr.data[rr][cc];
  }

  /* -------------------------------------------------------------- coercion */
  function toNum(v) {
    if (isErr(v)) return v;
    if (v === EMPTY || v === undefined) return 0;
    if (typeof v === "number") return v;
    if (typeof v === "boolean") return v ? 1 : 0;
    if (typeof v === "string") {
      var s = v.trim();
      if (s === "") return ERR["#VALUE!"];
      var pct = /%$/.test(s);
      var n = Number(s.replace(/,/g, "").replace(/%$/, ""));
      if (isNaN(n)) {
        var d = parseDate(s);
        return d === null ? ERR["#VALUE!"] : d;
      }
      return pct ? n / 100 : n;
    }
    return ERR["#VALUE!"];
  }
  function parseDate(s) {
    var m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
    if (!m) return null;
    return Math.round((Date.UTC(+m[1], +m[2] - 1, +m[3]) - Date.UTC(1899, 11, 30)) / 86400000);
  }
  function toBool(v) {
    if (isErr(v)) return v;
    if (v === EMPTY) return false;
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v !== 0;
    if (typeof v === "string") {
      var u = v.toUpperCase();
      if (u === "TRUE") return true; if (u === "FALSE") return false;
      return ERR["#VALUE!"];
    }
    return ERR["#VALUE!"];
  }
  function toStr(v) {
    if (isErr(v)) return v;
    if (v === EMPTY) return "";
    if (typeof v === "string") return v;
    if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
    return numToGeneral(v);
  }
  function numToGeneral(n) {
    if (!isFinite(n)) return ERR["#NUM!"];
    if (Number.isInteger(n) && Math.abs(n) < 1e15) return String(n);
    var s = Number(n.toPrecision(15)).toString();
    if (/e/.test(s)) {
      var m = /^(-?[\d.]+)e([+-]\d+)$/.exec(Number(n.toPrecision(6)).toExponential());
      if (m) { var e = +m[2]; return m[1].replace(/\.?0+$/, "") + "E" + (e < 0 ? "-" : "+") + String(Math.abs(e)).padStart(2, "0"); }
    }
    return s;
  }
  // Excel comparison: numbers < text < logicals; text case-insensitive
  function typeRank(v) { return typeof v === "number" ? 0 : typeof v === "string" ? 1 : typeof v === "boolean" ? 2 : 0; }
  function compare(a, b) {
    if (a === EMPTY) a = (typeof b === "string") ? "" : (typeof b === "boolean" ? false : 0);
    if (b === EMPTY) b = (typeof a === "string") ? "" : (typeof a === "boolean" ? false : 0);
    var ra = typeRank(a), rb = typeRank(b);
    if (ra !== rb) return ra < rb ? -1 : 1;
    if (typeof a === "string") { a = a.toLowerCase(); b = b.toLowerCase(); }
    if (typeof a === "boolean") { a = a ? 1 : 0; b = b ? 1 : 0; }
    return a < b ? -1 : a > b ? 1 : 0;
  }

  function binop(wb, op, a, b) {
    return map2(wb, a, b, function (x, y) {
      if (isErr(x)) return x; if (isErr(y)) return y;
      switch (op) {
        case "+": case "-": case "*": case "/": case "^":
          var p = toNum(x), q = toNum(y);
          if (isErr(p)) return p; if (isErr(q)) return q;
          if (op === "+") return p + q;
          if (op === "-") return p - q;
          if (op === "*") return p * q;
          if (op === "/") return q === 0 ? ERR["#DIV/0!"] : p / q;
          var r = Math.pow(p, q); return isFinite(r) ? r : ERR["#NUM!"];
        case "&": var s1 = toStr(x), s2 = toStr(y); if (isErr(s1)) return s1; if (isErr(s2)) return s2; return s1 + s2;
        case "=": return compare(x, y) === 0;
        case "<>": return compare(x, y) !== 0;
        case "<": return compare(x, y) < 0;
        case ">": return compare(x, y) > 0;
        case "<=": return compare(x, y) <= 0;
        case ">=": return compare(x, y) >= 0;
      }
      return ERR["#VALUE!"];
    });
  }

  /* ------------------------------------------------------------- functions */
  function flat(v) { // flatten to a list of values
    if (v instanceof Arr) { var o = []; v.data.forEach(function (r) { r.forEach(function (x) { o.push(x); }); }); return o; }
    return [v];
  }
  function argVals(wb, args, ctx) { return args.map(function (a) { return evalNode(wb, a, ctx); }); }
  // Numeric aggregation: values from references/arrays skip text & logicals; direct scalars are coerced
  function numbersOf(wb, args, ctx, opts) {
    var out = [];
    for (var i = 0; i < args.length; i++) {
      if (args[i].k === "missing") continue;
      var raw = evalNode(wb, args[i], ctx), fromRange = raw instanceof Ref || raw instanceof Arr;
      var v = deref(wb, raw);
      var list = flat(v);
      for (var j = 0; j < list.length; j++) {
        var x = list[j];
        if (isErr(x)) { if (opts && opts.skipErr) continue; return x; }
        if (typeof x === "number") out.push(x);
        else if (!fromRange) {
          if (x === EMPTY) continue;
          var n = toNum(x); if (isErr(n)) return n; out.push(n);
        }
      }
    }
    return out;
  }
  function wildcardRe(pattern) {
    var s = "", i = 0;
    while (i < pattern.length) {
      var ch = pattern[i];
      if (ch === "~" && i + 1 < pattern.length) { s += pattern[i + 1].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); i += 2; continue; }
      if (ch === "*") s += "[\\s\\S]*"; else if (ch === "?") s += "[\\s\\S]"; else s += ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      i++;
    }
    return new RegExp("^" + s + "$", "i");
  }
  // COUNTIF-style criterion -> predicate
  function criterion(c) {
    if (isErr(c)) return function (v) { return isErr(v) && v.err === c.err; };
    if (typeof c === "number" || typeof c === "boolean") return function (v) { return v !== EMPTY && compare(v, c) === 0 && typeof v === typeof c; };
    if (c === EMPTY) c = "";
    var s = String(c), m = /^(<=|>=|<>|<|>|=)?([\s\S]*)$/.exec(s), op = m[1] || "=", rhs = m[2];
    var num = rhs.trim() !== "" && !isNaN(Number(rhs)) ? Number(rhs) : null;
    var low = rhs.toLowerCase();
    if (num === null && (low === "true" || low === "false")) { var bv = low === "true"; return function (v) { var eq = typeof v === "boolean" && v === bv; return op === "<>" ? !eq : op === "=" ? eq : false; }; }
    if (op === "=" || op === "<>") {
      var test;
      if (num !== null) test = function (v) { return (typeof v === "number" && v === num) || (typeof v === "string" && v.trim() !== "" && Number(v) === num); };
      else if (rhs === "") test = function (v) { return v === EMPTY || v === ""; };
      else { var re = /[*?~]/.test(rhs) ? wildcardRe(rhs) : null; test = function (v) { if (typeof v !== "string") return false; return re ? re.test(v) : v.toLowerCase() === low; }; }
      if (op === "=") return test;
      if (rhs === "") return function (v) { return !(v === EMPTY || v === ""); };
      return function (v) { return !test(v); };
    }
    return function (v) {
      if (num !== null) { if (typeof v !== "number") return false; var d = v - num; return op === "<" ? d < 0 : op === ">" ? d > 0 : op === "<=" ? d <= 0 : d >= 0; }
      if (typeof v !== "string") return false;
      var cmp = compare(v, rhs);
      return op === "<" ? cmp < 0 : op === ">" ? cmp > 0 : op === "<=" ? cmp <= 0 : cmp >= 0;
    };
  }
  // Criteria may be arrays (e.g. COUNTIFS(P1:P9,P1:P9)): then the result is an array of the same shape.
  function eachCriterion(wb, critNodes, ctx, run) {
    var vals = critNodes.map(function (n) { return deref(wb, evalNode(wb, n, ctx)); });
    var arrIdx = -1;
    for (var i = 0; i < vals.length; i++) if (vals[i] instanceof Arr) { arrIdx = i; break; }
    if (arrIdx < 0) return run(vals.map(criterion));
    var shape = vals[arrIdx], out = [];
    for (var r = 0; r < shape.rows(); r++) {
      var row = [];
      for (var c = 0; c < shape.cols(); c++) {
        row.push(run(vals.map(function (v) { return criterion(v instanceof Arr ? pick(v, v.rows(), v.cols(), r, c) : v); })));
      }
      out.push(row);
    }
    return new Arr(out);
  }
  function rangeCells(wb, node, ctx) { var v = deref(wb, evalNode(wb, node, ctx)); return v instanceof Arr ? v : new Arr([[v]]); }

  function textFormat(n, fmt) {
    if (typeof n !== "number") return toStr(n);
    var f = String(fmt);
    var sections = f.split(";");
    if (sections.length > 1) { if (n < 0) { f = sections[1]; n = -n; } else if (n === 0 && sections.length > 2) f = sections[2]; else f = sections[0]; }
    if (/^[@]$/.test(f)) return toStr(n);
    if (/[yY]{2,4}|[dD]{1,2}|mm/.test(f) && !/[0#]/.test(f)) {
      var d = new Date(Date.UTC(1899, 11, 30) + Math.round(n * 86400000));
      var Y = d.getUTCFullYear(), M = d.getUTCMonth() + 1, D = d.getUTCDate();
      var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return f.replace(/yyyy|YYYY/g, String(Y)).replace(/yy|YY/g, String(Y).slice(2)).replace(/mmm/g, MON[M - 1]).replace(/mm/g, String(M).padStart(2, "0")).replace(/dd|DD/g, String(D).padStart(2, "0")).replace(/(^|[^a-z])d([^a-z]|$)/g, "$1" + D + "$2");
    }
    var lit = "", core = f, prefix = "", suffix = "";
    var mm = /^([^0#.,%]*)([0#.,]+)(%?)([\s\S]*)$/.exec(f.replace(/"([^"]*)"/g, "$1").replace(/\\(.)/g, "$1"));
    if (!mm) return toStr(n);
    prefix = mm[1]; core = mm[2]; var pct = mm[3] === "%"; suffix = mm[4];
    if (pct) n = n * 100;
    var dec = core.indexOf(".") >= 0 ? core.split(".")[1].replace(/[^0#]/g, "") : "";
    var minDec = (dec.match(/0/g) || []).length, maxDec = dec.length;
    var thousands = core.split(".")[0].indexOf(",") >= 0;
    var neg = n < 0; n = Math.abs(n);
    var s = roundHalfUp(n, maxDec).toFixed(maxDec);
    if (neg && Number(s) === 0) neg = false; // Excel shows -0.00001 as "0.0", not "-0.0"
    if (maxDec > minDec) { s = s.replace(new RegExp("0{1," + (maxDec - minDec) + "}$"), ""); s = s.replace(/\.$/, ""); }
    var parts = s.split(".");
    var intFmt = core.split(".")[0].replace(/,/g, "");
    var minInt = (intFmt.match(/0/g) || []).length;
    if (parts[0] === "0" && minInt === 0) parts[0] = "";
    while (parts[0].length < minInt) parts[0] = "0" + parts[0];
    if (thousands) parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    s = parts.join(".");
    return (neg ? "-" : "") + prefix + s + (pct ? "%" : "") + suffix;
  }
  function roundHalfUp(n, d) { var m = Math.pow(10, d); return Math.round((n + Number.EPSILON * n) * m) / m; }

  var FUNCS = {
    IF: function (wb, a, ctx) {
      var c = evalNode(wb, a[0], ctx);
      c = deref(wb, c);
      if (c instanceof Arr) {
        var t = a.length > 1 ? deref(wb, evalNode(wb, a[1], ctx)) : true, f = a.length > 2 ? deref(wb, evalNode(wb, a[2], ctx)) : false;
        return map2(wb, map2(wb, c, t, function (cc, tt) { return [cc, tt]; }), f, function (pair, ff) {
          var b = toBool(pair[0]); if (isErr(b)) return b; return b ? (pair[1] === EMPTY ? 0 : pair[1]) : (ff === EMPTY ? 0 : ff);
        });
      }
      var b = toBool(c);
      if (isErr(b)) return b;
      if (b) return a.length > 1 ? (a[1].k === "missing" ? 0 : evalNode(wb, a[1], ctx)) : true;
      return a.length > 2 ? (a[2].k === "missing" ? 0 : evalNode(wb, a[2], ctx)) : false;
    },
    IFERROR: function (wb, a, ctx) {
      var v = deref(wb, evalNode(wb, a[0], ctx));
      if (v instanceof Arr) { var alt = deref(wb, evalNode(wb, a[1], ctx)); return map2(wb, v, alt, function (x, y) { return isErr(x) ? y : x; }); }
      return isErr(v) ? evalNode(wb, a[1], ctx) : v;
    },
    AND: function (wb, a, ctx) { return logical(wb, a, ctx, true); },
    OR: function (wb, a, ctx) { return logical(wb, a, ctx, false); },
    NOT: function (wb, a, ctx) { return map1(wb, evalNode(wb, a[0], ctx), function (x) { var b = toBool(x); return isErr(b) ? b : !b; }); },
    TRUE: function () { return true; },
    FALSE: function () { return false; },
    N: function (wb, a, ctx) {
      var v = evalNode(wb, a[0], ctx);
      if (v instanceof Ref) v = wb.cell(v.sheet, v.r1, v.c1);
      return map1(wb, v, function (x) { return isErr(x) ? x : typeof x === "number" ? x : typeof x === "boolean" ? (x ? 1 : 0) : 0; });
    },
    ISNUMBER: function (wb, a, ctx) { return map1(wb, evalNode(wb, a[0], ctx), function (x) { return typeof x === "number"; }); },
    ISERROR: function (wb, a, ctx) { return map1(wb, evalNode(wb, a[0], ctx), function (x) { return isErr(x); }); },
    ISFORMULA: function (wb, a, ctx) { var r = evalNode(wb, a[0], ctx); if (!(r instanceof Ref)) return ERR["#VALUE!"]; return wb.isFormula(cellKey(r.sheet, r.r1, r.c1)); },
    INDEX: function (wb, a, ctx) {
      var src = evalNode(wb, a[0], ctx);
      var r = a.length > 1 && a[1].k !== "missing" ? toNum(scalarArg(wb, a[1], ctx)) : 0;
      var c = a.length > 2 && a[2].k !== "missing" ? toNum(scalarArg(wb, a[2], ctx)) : 0;
      if (isErr(r)) return r; if (isErr(c)) return c;
      r = Math.floor(r); c = Math.floor(c);
      if (src instanceof Ref) {
        var R = src.rows(), C = src.cols();
        if (a.length === 2 || (a.length > 2 && a[2].k === "missing")) { if (R === 1 && C > 1) { c = r; r = 1; } }
        if (r < 0 || c < 0 || r > R || c > C) return ERR["#REF!"];
        if (C === 1 && c === 0) c = 1;
        if (R === 1 && r === 0) r = 1;
        if (r === 0) return new Ref(src.sheet, src.r1, src.c1 + c - 1, src.r2, src.c1 + c - 1);
        if (c === 0) return new Ref(src.sheet, src.r1 + r - 1, src.c1, src.r1 + r - 1, src.c2);
        return new Ref(src.sheet, src.r1 + r - 1, src.c1 + c - 1, src.r1 + r - 1, src.c1 + c - 1);
      }
      src = deref(wb, src);
      if (!(src instanceof Arr)) return (r <= 1 && c <= 1) ? src : ERR["#REF!"];
      var RR = src.rows(), CC = src.cols();
      if (a.length === 2 && RR === 1) { c = r; r = 1; }
      if (CC === 1 && c === 0) c = 1;
      if (r < 0 || c < 0 || r > RR || c > CC) return ERR["#REF!"];
      if (r === 0) return new Arr(src.data.map(function (row) { return [row[c - 1]]; }));
      if (c === 0) return new Arr([src.data[r - 1].slice()]);
      return src.data[r - 1][c - 1];
    },
    MATCH: function (wb, a, ctx) {
      var look = scalarArg(wb, a[0], ctx);
      if (isErr(look)) return look;
      var arr = flat(deref(wb, evalNode(wb, a[1], ctx)));
      var type = a.length > 2 && a[2].k !== "missing" ? toNum(scalarArg(wb, a[2], ctx)) : 1;
      if (isErr(type)) return type;
      if (look === EMPTY) look = 0;
      if (type === 0) {
        if (typeof look === "string" && /[*?~]/.test(look)) {
          var re = wildcardRe(look);
          for (var i = 0; i < arr.length; i++) if (typeof arr[i] === "string" && re.test(arr[i])) return i + 1;
          return ERR["#N/A"];
        }
        for (var j = 0; j < arr.length; j++) {
          var x = arr[j];
          if (x === EMPTY || isErr(x)) continue;
          if (typeof x === typeof look && compare(x, look) === 0) return j + 1;
        }
        return ERR["#N/A"];
      }
      var best = -1;
      for (var k = 0; k < arr.length; k++) {
        var y = arr[k];
        if (y === EMPTY || isErr(y) || typeRank(y) !== typeRank(look)) continue;
        var cmp = compare(y, look);
        if (type > 0) { if (cmp <= 0) best = k; else break; }
        else { if (cmp >= 0) best = k; else break; }
      }
      return best < 0 ? ERR["#N/A"] : best + 1;
    },
    CHOOSE: function (wb, a, ctx) {
      var i = toNum(scalarArg(wb, a[0], ctx)); if (isErr(i)) return i;
      i = Math.floor(i); if (i < 1 || i >= a.length) return ERR["#VALUE!"];
      return evalNode(wb, a[i], ctx);
    },
    ROW: function (wb, a, ctx) {
      if (!a.length || a[0].k === "missing") return ctx.row;
      var r = evalNode(wb, a[0], ctx);
      if (!(r instanceof Ref)) return ERR["#VALUE!"];
      if (r.rows() === 1) return r.r1;
      var out = []; for (var i = r.r1; i <= r.r2; i++) out.push([i]); return new Arr(out);
    },
    SUM: function (wb, a, ctx) { var xs = numbersOf(wb, a, ctx); if (isErr(xs)) return xs; return xs.reduce(function (s, x) { return s + x; }, 0); },
    MAX: function (wb, a, ctx) { var xs = numbersOf(wb, a, ctx); if (isErr(xs)) return xs; return xs.length ? Math.max.apply(null, xs) : 0; },
    MIN: function (wb, a, ctx) { var xs = numbersOf(wb, a, ctx); if (isErr(xs)) return xs; return xs.length ? Math.min.apply(null, xs) : 0; },
    COUNT: function (wb, a, ctx) {
      var n = 0;
      a.forEach(function (node) {
        if (node.k === "missing") return;
        var raw = evalNode(wb, node, ctx), fromRange = raw instanceof Ref || raw instanceof Arr;
        flat(deref(wb, raw)).forEach(function (x) { if (typeof x === "number") n++; else if (!fromRange && !isErr(toNum(x)) && x !== EMPTY && typeof x !== "string") n++; });
      });
      return n;
    },
    SMALL: function (wb, a, ctx) { return kth(wb, a, ctx, true); },
    LARGE: function (wb, a, ctx) { return kth(wb, a, ctx, false); },
    SUMPRODUCT: function (wb, a, ctx) {
      var arrays = a.map(function (n) { return deref(wb, evalNode(wb, n, ctx)); });
      for (var i = 0; i < arrays.length; i++) if (isErr(arrays[i])) return arrays[i];
      var first = arrays[0] instanceof Arr ? arrays[0] : new Arr([[arrays[0]]]);
      var R = first.rows(), C = first.cols(), sum = 0;
      for (var j = 0; j < arrays.length; j++) {
        var x = arrays[j] instanceof Arr ? arrays[j] : new Arr([[arrays[j]]]);
        if (x.rows() !== R || x.cols() !== C) return ERR["#VALUE!"];
        arrays[j] = x;
      }
      for (var r = 0; r < R; r++) for (var c = 0; c < C; c++) {
        var p = 1;
        for (var k = 0; k < arrays.length; k++) {
          var v = arrays[k].data[r][c];
          if (isErr(v)) return v;
          p *= typeof v === "number" ? v : 0;
        }
        sum += p;
      }
      return sum;
    },
    COUNTIF: function (wb, a, ctx) {
      var rng = flat(rangeCells(wb, a[0], ctx));
      return eachCriterion(wb, [a[1]], ctx, function (preds) { var n = 0; rng.forEach(function (v) { if (preds[0](v)) n++; }); return n; });
    },
    COUNTIFS: function (wb, a, ctx) {
      var ranges = [], crit = [];
      for (var i = 0; i < a.length; i += 2) { ranges.push(flat(rangeCells(wb, a[i], ctx))); crit.push(a[i + 1]); }
      return eachCriterion(wb, crit, ctx, function (preds) {
        var n = 0; for (var k = 0; k < ranges[0].length; k++) { var all = true; for (var j = 0; j < preds.length; j++) if (!preds[j](ranges[j][k])) { all = false; break; } if (all) n++; } return n;
      });
    },
    SUMIF: function (wb, a, ctx) {
      var rng = flat(rangeCells(wb, a[0], ctx)), sumR = a.length > 2 ? flat(rangeCells(wb, a[2], ctx)) : rng;
      return eachCriterion(wb, [a[1]], ctx, function (preds) { var s = 0; for (var i = 0; i < rng.length; i++) if (preds[0](rng[i]) && typeof sumR[i] === "number") s += sumR[i]; return s; });
    },
    SUMIFS: function (wb, a, ctx) {
      var sumR = flat(rangeCells(wb, a[0], ctx)), ranges = [], crit = [];
      for (var i = 1; i < a.length; i += 2) { ranges.push(flat(rangeCells(wb, a[i], ctx))); crit.push(a[i + 1]); }
      return eachCriterion(wb, crit, ctx, function (preds) {
        var s = 0; for (var k = 0; k < sumR.length; k++) { if (typeof sumR[k] !== "number") continue; var all = true; for (var j = 0; j < preds.length; j++) if (!preds[j](ranges[j][k])) { all = false; break; } if (all) s += sumR[k]; } return s;
      });
    },
    COUNTBLANK: function (wb, a, ctx) { var n = 0; flat(rangeCells(wb, a[0], ctx)).forEach(function (v) { if (v === EMPTY || v === "") n++; }); return n; },
    ABS: function (wb, a, ctx) { return math1(wb, a, ctx, Math.abs); },
    INT: function (wb, a, ctx) { return math1(wb, a, ctx, Math.floor); },
    ROUNDUP: function (wb, a, ctx) {
      var x = toNum(scalarArg(wb, a[0], ctx)), d = toNum(scalarArg(wb, a[1], ctx));
      if (isErr(x)) return x; if (isErr(d)) return d;
      var m = Math.pow(10, d), v = Math.abs(x) * m, up = Math.ceil(v - 1e-9 * Math.max(1, v));
      return (x < 0 ? -up : up) / m;
    },
    LEFT: function (wb, a, ctx) {
      var nn = a.length > 1 ? deref(wb, evalNode(wb, a[1], ctx)) : 1;
      return map2(wb, evalNode(wb, a[0], ctx), nn, function (x, k) { var s = toStr(x); if (isErr(s)) return s; k = toNum(k); if (isErr(k)) return k; return s.slice(0, Math.max(0, Math.floor(k))); });
    },
    MID: function (wb, a, ctx) {
      var s = toStr(scalarArg(wb, a[0], ctx)), st = toNum(scalarArg(wb, a[1], ctx)), ln = toNum(scalarArg(wb, a[2], ctx));
      if (isErr(s)) return s; if (isErr(st)) return st; if (isErr(ln)) return ln;
      if (st < 1 || ln < 0) return ERR["#VALUE!"];
      return s.substr(Math.floor(st) - 1, Math.floor(ln));
    },
    LEN: function (wb, a, ctx) { return map1(wb, evalNode(wb, a[0], ctx), function (x) { var s = toStr(x); return isErr(s) ? s : s.length; }); },
    LOWER: function (wb, a, ctx) { return map1(wb, evalNode(wb, a[0], ctx), function (x) { var s = toStr(x); return isErr(s) ? s : s.toLowerCase(); }); },
    VALUE: function (wb, a, ctx) { return map1(wb, evalNode(wb, a[0], ctx), function (x) { if (typeof x === "number") return x; if (x === EMPTY) return 0; return toNum(String(x)); }); },
    SEARCH: function (wb, a, ctx) { return findText(wb, a, ctx, false); },
    FIND: function (wb, a, ctx) { return findText(wb, a, ctx, true); },
    TEXT: function (wb, a, ctx) {
      var fmt = toStr(scalarArg(wb, a[1], ctx));
      return map1(wb, evalNode(wb, a[0], ctx), function (x) {
        if (isErr(x)) return x;
        if (typeof x === "string") { var n = toNum(x); if (isErr(n)) return x; x = n; }
        if (x === EMPTY) x = 0;
        if (typeof x === "boolean") return x ? "TRUE" : "FALSE";
        return textFormat(x, fmt);
      });
    },
    HYPERLINK: function (wb, a, ctx) { return a.length > 1 ? scalarArg(wb, a[1], ctx) : scalarArg(wb, a[0], ctx); },
  };
  function logical(wb, a, ctx, isAnd) {
    var seen = false, acc = isAnd;
    for (var i = 0; i < a.length; i++) {
      var raw = evalNode(wb, a[i], ctx), fromRange = raw instanceof Ref || raw instanceof Arr;
      var list = flat(deref(wb, raw));
      for (var j = 0; j < list.length; j++) {
        var x = list[j];
        if (isErr(x)) return x;
        if (x === EMPTY) continue;
        if (typeof x === "string") { if (fromRange) continue; var bb = toBool(x); if (isErr(bb)) return bb; x = bb; }
        var b = typeof x === "boolean" ? x : x !== 0;
        seen = true;
        if (isAnd && !b) acc = false;
        if (!isAnd && b) acc = true;
      }
    }
    return seen ? acc : ERR["#VALUE!"];
  }
  function kth(wb, a, ctx, small) {
    var list = flat(deref(wb, evalNode(wb, a[0], ctx)));
    var k = toNum(scalarArg(wb, a[1], ctx)); if (isErr(k)) return k;
    var nums = [];
    for (var i = 0; i < list.length; i++) { if (isErr(list[i])) return list[i]; if (typeof list[i] === "number") nums.push(list[i]); }
    k = Math.ceil(k);
    if (k < 1 || k > nums.length) return ERR["#NUM!"];
    nums.sort(function (x, y) { return x - y; });
    return small ? nums[k - 1] : nums[nums.length - k];
  }
  function math1(wb, a, ctx, f) { return map1(wb, evalNode(wb, a[0], ctx), function (x) { var n = toNum(x); return isErr(n) ? n : f(n); }); }
  function findText(wb, a, ctx, caseSensitive) {
    var start = a.length > 2 ? toNum(scalarArg(wb, a[2], ctx)) : 1;
    if (isErr(start)) return start;
    var needleV = deref(wb, evalNode(wb, a[0], ctx));
    return map2(wb, needleV, evalNode(wb, a[1], ctx), function (nd, hs) {
      var needle = toStr(nd), hay = toStr(hs);
      if (isErr(needle)) return needle; if (isErr(hay)) return hay;
      if (start < 1 || start > hay.length + 1) return ERR["#VALUE!"];
      var idx;
      if (caseSensitive) idx = hay.indexOf(needle, start - 1);
      else if (/[*?~]/.test(needle)) {
        var re = new RegExp(wildcardRe(needle).source.slice(1, -1), "i"), sub = hay.slice(start - 1), m = re.exec(sub);
        idx = m ? m.index + start - 1 : -1;
      } else idx = hay.toLowerCase().indexOf(needle.toLowerCase(), start - 1);
      return idx < 0 ? ERR["#VALUE!"] : idx + 1;
    });
  }

  return { Workbook: Workbook, parse: parse, tokenize: tokenize, ERR: ERR, isErr: isErr, colToNum: colToNum, numToCol: numToCol, textFormat: textFormat };
});
