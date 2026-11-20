/* Read an Excel workbook (.xlsx) in the browser, with no library and no upload.
   Returns the workbook as an engine model (formulas, constant values, defined names) plus the
   results Excel saved for every formula cell, so the engine can be checked against Excel.
     BestXlsx.read(arrayBuffer) -> Promise<{ model, saved, info }>
   Works in browsers with DecompressionStream (Chrome 80+, Edge, Firefox 113+, Safari 16.4+)
   and in Node 18+. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.BestXlsx = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* ------------------------------------------------------------------ zip */
  async function unzip(buf, wanted) {
    var dv = new DataView(buf), u8 = new Uint8Array(buf), files = {};
    var eocd = -1;
    for (var i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 66000); i--) {
      if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error("This is not an .xlsx file (no zip directory found).");
    var count = dv.getUint16(eocd + 10, true), p = dv.getUint32(eocd + 16, true);
    var dec = new TextDecoder("utf-8");
    for (var n = 0; n < count; n++) {
      if (dv.getUint32(p, true) !== 0x02014b50) throw new Error("Damaged .xlsx file.");
      var method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true);
      var nlen = dv.getUint16(p + 28, true), xlen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true);
      var off = dv.getUint32(p + 42, true);
      var name = dec.decode(u8.subarray(p + 46, p + 46 + nlen));
      p += 46 + nlen + xlen + clen;
      if (!wanted(name)) continue;
      var lnlen = dv.getUint16(off + 26, true), lxlen = dv.getUint16(off + 28, true);
      var data = u8.subarray(off + 30 + lnlen + lxlen, off + 30 + lnlen + lxlen + csize);
      if (method === 0) files[name] = dec.decode(data);
      else if (method === 8) {
        var stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
        files[name] = dec.decode(await new Response(stream).arrayBuffer());
      } else throw new Error("Unsupported compression in " + name);
    }
    return files;
  }

  /* ------------------------------------------------------------------ xml helpers */
  function unesc(s) {
    return s.replace(/&(#x[0-9a-fA-F]+|#\d+|amp|lt|gt|quot|apos);/g, function (m, e) {
      if (e === "amp") return "&"; if (e === "lt") return "<"; if (e === "gt") return ">";
      if (e === "quot") return '"'; if (e === "apos") return "'";
      return String.fromCodePoint(e.charAt(1) === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    }).replace(/_x([0-9A-Fa-f]{4})_/g, function (m, h) { return String.fromCharCode(parseInt(h, 16)); }).replace(/\r\n/g, "\n");
  }
  function attrs(s) {
    var o = {}, re = /([\w:]+)="([^"]*)"/g, m;
    while ((m = re.exec(s))) o[m[1]] = unesc(m[2]);
    return o;
  }
  function texts(xml) {   // all <t> texts, phonetic runs (<rPh>) left out
    xml = xml.replace(/<rPh\b[\s\S]*?<\/rPh>/g, "");
    var out = "", re = /<t(?:\s[^>]*)?>([\s\S]*?)<\/t>|<t(?:\s[^>]*)?\/>/g, m;
    while ((m = re.exec(xml))) out += m[1] ? unesc(m[1]) : "";
    return out;
  }

  /* ------------------------------------------------------------------ references */
  function colNum(s) { var n = 0; for (var i = 0; i < s.length; i++) n = n * 26 + s.charCodeAt(i) - 64; return n; }
  function colName(n) { var s = ""; while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = (n - m - 1) / 26; } return s; }
  function rc(addr) { var m = /^([A-Z]+)(\d+)$/.exec(addr); return { r: +m[2], c: colNum(m[1]) }; }

  // Move the relative parts of every reference in a formula by (dr, dc): what Excel does to a
  // shared formula. Text in quotes and quoted sheet names are left alone.
  var REF = /(\$?)([A-Z]{1,3})(\$?)(\d+)(?![\w(])|(\$?)([A-Z]{1,3}):(\$?)([A-Z]{1,3})(?![\w(\d])|(\$?)(\d+):(\$?)(\d+)(?![\w(])/g;
  function shift(formula, dr, dc) {
    if (!dr && !dc) return formula;
    var out = "", i = 0;
    while (i < formula.length) {
      var ch = formula.charAt(i);
      if (ch === '"') {                         // string literal
        var j = i + 1;
        while (j < formula.length) { if (formula.charAt(j) === '"') { if (formula.charAt(j + 1) === '"') { j += 2; continue; } break; } j++; }
        out += formula.slice(i, j + 1); i = j + 1; continue;
      }
      if (ch === "'") {                         // quoted sheet name
        var k = formula.indexOf("'!", i + 1);
        while (k > 0 && formula.charAt(k - 1) === "'" && formula.charAt(k - 2) !== "'") k = formula.indexOf("'!", k + 1);
        if (k < 0) { out += formula.slice(i); break; }
        out += formula.slice(i, k + 2); i = k + 2; continue;
      }
      var next = formula.slice(i).search(/["']/), end = next < 0 ? formula.length : i + next;
      out += shiftPlain(formula.slice(i, end), dr, dc, i > 0 ? formula.charAt(i - 1) : "");
      i = end;
    }
    return out;
  }
  function shiftPlain(s, dr, dc, prevChar) {
    return s.replace(REF, function (m) {
      var a = arguments, pos = a[a.length - 2], whole = a[a.length - 1];
      var before = pos > 0 ? whole.charAt(pos - 1) : prevChar;
      if (/[\w.]/.test(before)) return m;      // part of a name or a number, not a reference
      if (a[2] !== undefined) {                 // A1 cell
        var c = a[1] ? a[2] : colName(colNum(a[2]) + dc), r = a[3] ? a[4] : String(+a[4] + dr);
        return a[1] + c + a[3] + r;
      }
      if (a[6] !== undefined) {                 // A:B whole columns
        return a[5] + (a[5] ? a[6] : colName(colNum(a[6]) + dc)) + ":" + a[7] + (a[7] ? a[8] : colName(colNum(a[8]) + dc));
      }
      return a[9] + (a[9] ? a[10] : String(+a[10] + dr)) + ":" + a[11] + (a[11] ? a[12] : String(+a[12] + dr));
    });
  }

  /* ------------------------------------------------------------------ workbook */
  async function read(buf) {
    var files = await unzip(buf, function (n) {
      return n === "xl/workbook.xml" || n === "docProps/app.xml" || n === "xl/_rels/workbook.xml.rels" || n === "xl/sharedStrings.xml" || /^xl\/worksheets\/[^/]+\.xml$/.test(n);
    });
    if (!files["xl/workbook.xml"]) throw new Error("This file is not an Excel workbook.");
    var wbx = files["xl/workbook.xml"], rels = {}, m, re;
    re = /<Relationship\b([^>]*)\/?>/g;
    while ((m = re.exec(files["xl/_rels/workbook.xml.rels"] || ""))) {
      var a = attrs(m[1]); var t = a.Target.replace(/^\/?xl\//, "").replace(/^\//, "");
      rels[a.Id] = "xl/" + t;
    }
    var sheets = []; re = /<sheet\b([^>]*)\/>/g;
    while ((m = re.exec(wbx))) { var sa = attrs(m[1]); sheets.push({ name: sa.name, path: rels[sa["r:id"]] }); }
    var strings = []; re = /<si>([\s\S]*?)<\/si>/g;
    while ((m = re.exec(files["xl/sharedStrings.xml"] || ""))) strings.push(texts(m[1]));

    var app = files["docProps/app.xml"] || "", am = /<Application>([\s\S]*?)<\/Application>/.exec(app), vm0 = /<AppVersion>([\s\S]*?)<\/AppVersion>/.exec(app);
    var model = { sheets: [], cells: {}, names: {} }, saved = {}, info = { savedBy: am ? unesc(am[1]) + (vm0 ? " " + unesc(vm0[1]) : "") : "unknown", formulas: 0, withoutSaved: 0, manualCalc: /calcMode="manual"/.test(wbx), fullCalcOnLoad: /fullCalcOnLoad="(1|true)"/.test(wbx) };
    re = /<definedName\b([^>]*)>([\s\S]*?)<\/definedName>/g;
    while ((m = re.exec(wbx))) {
      var da = attrs(m[1]), nm = da.name.toUpperCase();
      if (da.localSheetId !== undefined) nm = sheets[+da.localSheetId].name.toUpperCase() + "!" + nm;
      model.names[nm] = unesc(m[2]);
    }
    sheets.forEach(function (sh) {
      var xml = files[sh.path];
      if (!xml) throw new Error("Sheet " + sh.name + " is missing from the file.");
      var maxR = 0, maxC = 0, shared = {};
      var cre = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g, cm;
      while ((cm = cre.exec(xml))) {
        var ca = attrs(cm[1]), body = cm[2] || "", pos = rc(ca.r), key = sh.name + "!" + ca.r;
        if (pos.r > maxR) maxR = pos.r; if (pos.c > maxC) maxC = pos.c;
        var fm = /<f\b([^>]*?)(?:\/>|>([\s\S]*?)<\/f>)/.exec(body), formula = null;
        if (fm) {
          var fa = attrs(fm[1]), ftext = fm[2] !== undefined ? unesc(fm[2]) : "";
          if (fa.t === "shared") {
            if (ftext) { shared[fa.si] = { f: ftext, r: pos.r, c: pos.c }; formula = ftext; }
            else if (shared[fa.si]) formula = shift(shared[fa.si].f, pos.r - shared[fa.si].r, pos.c - shared[fa.si].c);
          } else formula = ftext;
        }
        var vm = /<v(?:\s[^>]*)?>([\s\S]*?)<\/v>/.exec(body), raw = vm ? unesc(vm[1]) : null, value;
        var t = ca.t || "n";
        if (t === "inlineStr") value = texts(body.replace(/<f\b[\s\S]*?(<\/f>|\/>)/, ""));
        else if (raw === null || (raw === "" && t !== "str")) value = null;
        else if (t === "s") value = strings[+raw];
        else if (t === "b") value = raw === "1";
        else if (t === "str" || t === "e") value = raw;
        else value = Number(raw);
        if (formula !== null && formula !== "") {
          model.cells[key] = "=" + formula; info.formulas++;
          if (value === null && t !== "str") info.withoutSaved++;
          saved[key] = value === null ? (t === "str" ? "" : null) : value;
        } else if (value !== null && value !== "") {
          model.cells[key] = value;
        }
      }
      model.sheets.push({ name: sh.name, maxRow: maxR, maxCol: maxC });
    });
    return { model: model, saved: saved, info: info };
  }

  return { read: read, shift: shift };
});
