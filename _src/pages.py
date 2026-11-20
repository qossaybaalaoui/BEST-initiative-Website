import os, sys, hashlib
R = sys.argv[1]
os.chdir(R)
def ver(path):
    return hashlib.sha1(open(path, "rb").read()).hexdigest()[:8]
V_TOK, V_BASE, V_JS = ver("assets/css/tokens.css"), ver("assets/css/base.css"), ver("assets/js/site.js")

def page(path, title, desc, section, pid, body, theme=None, subnav=False):
    depth = 0 if path == "index.html" else path.count("/")
    root = "../" * depth
    th = f' data-theme="{theme}"' if theme else ""
    sn = '<div id="section-nav"></div>\n' if subnav else ""
    html = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script>document.documentElement.classList.add("js")</script>
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="icon" href="{root}assets/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;700&display=swap">
<link rel="stylesheet" href="{root}assets/css/tokens.css?v={V_TOK}">
<link rel="stylesheet" href="{root}assets/css/base.css?v={V_BASE}">
</head>
<body data-root="{root}" data-section="{section}" data-page="{pid}"{th}>
<a class="skip-link" href="#main">Skip to content</a>
<div id="site-header"></div>
{sn}<main id="main">
{body.replace("{root}", root)}</main>
<div id="site-footer"></div>
<script src="{root}assets/js/site.js?v={V_JS}"></script>
</body>
</html>
'''
    d = os.path.dirname(path)
    if d: os.makedirs(d, exist_ok=True)
    open(path, "w").write(html)

def stub(eyebrow, h1, lead, note="This page is being prepared."):
    return f'''<section class="page-hero"><div class="container">
<div class="eyebrow">{eyebrow}</div>
<h1>{h1}</h1>
<p class="lead">{lead}</p>
</div></section>
<section><div class="container">
<div class="placeholder">{note}</div>
</div></section>
'''

# ---------------- Home: "How it works" flow with animated icons ----------------
HW_ICONS = {
 "align": '<svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true"><circle class="ln draw" pathLength="100" cx="24" cy="24" r="16"/><circle class="ln acc draw" pathLength="100" cx="24" cy="24" r="8"/><circle class="dot pulse" cx="24" cy="24" r="3.2"/><line class="ln" x1="24" y1="3" x2="24" y2="9"/><line class="ln" x1="24" y1="39" x2="24" y2="45"/><line class="ln" x1="3" y1="24" x2="9" y2="24"/><line class="ln" x1="39" y1="24" x2="45" y2="24"/></svg>',
 "calculate": '<svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true"><rect class="ln draw" pathLength="100" x="11" y="5" width="26" height="38" rx="4"/><line class="ln acc slide" x1="17" y1="13" x2="31" y2="13"/><circle class="dot" cx="18" cy="23" r="2"/><circle class="dot" cx="24" cy="23" r="2"/><circle class="dot" cx="30" cy="23" r="2"/><circle class="dot" cx="18" cy="30" r="2"/><circle class="dot" cx="24" cy="30" r="2"/><circle class="dot" cx="30" cy="30" r="2"/><line class="ln slide" x1="18" y1="37" x2="30" y2="37"/></svg>',
 "benchmark": '<svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true"><line class="ln" x1="7" y1="40" x2="41" y2="40"/><rect class="bar b1" x="11" y="26" width="7" height="13" rx="1.5"/><rect class="bar b2" x="20.5" y="18" width="7" height="21" rx="1.5"/><rect class="bar b3" x="30" y="9" width="7" height="30" rx="1.5"/></svg>',
 "communicate": '<svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true"><polyline class="ln" points="17,30 14,43 20,40 24,44"/><polyline class="ln" points="31,30 34,43 28,40 24,44"/><circle class="ln draw" pathLength="100" cx="24" cy="20" r="13"/><polyline class="ln acc draw" pathLength="100" points="18,20 22.5,24.5 30,16"/></svg>',
 "improve": '<svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true"><line class="ln" x1="7" y1="41" x2="41" y2="41"/><polyline class="ln draw" pathLength="100" points="7,34 17,24 24,29 38,14"/><polyline class="ln acc draw" pathLength="100" points="29,13 39,13 39,23"/><circle class="dot pulse" cx="7" cy="34" r="3.2"/></svg>',
}
HW_STEPS = [
 ("align", "Align", "Product-specific PCF methods aligned with ISO 14067 and the TfS guideline."),
 ("calculate", "Calculate", "Consistent, comparable product carbon intensity in t CO₂e per tonne."),
 ("benchmark", "Benchmark", 'Compare with peers against <span class="tier tier-good">GOOD</span> <span class="tier tier-better">BETTER</span> <span class="tier tier-best">BEST</span> bands.'),
 ("communicate", "Communicate", "Verified results and the BEST carbon label send a clear market signal."),
 ("improve", "Improve", "Turn benchmark results into actionable improvement on energy, feedstock and process."),
]
HOW_IT_WORKS = ('<section class="section" style="padding-top:0"><div class="container">\n<h2>How it works</h2>\n'
  '<ol class="hw-flow" data-spotlight="2800">\n' + "".join(
  f'<li class="sub-card hw-card" style="--d:{i*0.1:.1f}s"><div class="hw-top"><span class="ico">{HW_ICONS[k]}</span><span class="hw-num">{i+1:02d}</span></div><h3>{t}</h3><p>{d}</p></li>\n'
  for i, (k, t, d) in enumerate(HW_STEPS)) + '</ol>\n</div></section>\n')

# ---------------- Home ----------------
home = '''<section class="hero" aria-labelledby="hero-title">
<img class="hero-img" src="{root}assets/img/hero.jpg" alt="" onerror="this.remove()">
<div class="container">
<div class="eyebrow">Benchmarking &amp; Evaluation for Sustainability and Transparency</div>
<h1 id="hero-title">Measure, compare and improve the carbon performance of products</h1>
<p class="lead">Credible product carbon footprints, benchmarked against peers — starting with ethylene and polyethylene.</p>
<div class="hero-actions">
<a class="btn btn-light" href="{root}chemicals/">Discover BEST Chemicals</a>
<a class="btn btn-ghost" href="{root}tools/">Use the calculators</a>
</div>
</div>
</section>
<section class="section"><div class="container">
<div class="eyebrow">Sectors</div>
<h2>One method family, sector by sector</h2>
<p class="lead">Each sector gets product-specific rules, benchmarks and tools built on the same BEST principles.</p>
<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:24px;margin-top:32px">
<a class="sector-card chem" href="{root}chemicals/">
<div class="lockup"><img src="{root}assets/img/best-mark-reversed.svg" alt="" width="48" height="48"><strong>BEST</strong><span>Chemicals</span></div>
<p>Methods, benchmarks and calculators for ethylene and polyethylene, with more chemicals to follow.</p>
<span class="go">Explore BEST Chemicals →</span>
</a>
<a class="sector-card dc" href="{root}data-centers/">
<div class="lockup"><img src="{root}assets/img/best-mark-reversed-dc.svg" alt="" width="48" height="48"><strong>BEST</strong><span>Data Centers</span></div>
<p>Carbon performance evaluation and benchmarking for data centers. In preparation.</p>
<span class="go">Coming soon →</span>
</a>
</div>
</div></section>
''' + HOW_IT_WORKS + ''''''
page("index.html", "BEST — Benchmarking &amp; Evaluation for Sustainability and Transparency",
     "BEST turns product carbon footprint data into comparable performance, market signals and improvement.", "home", "home", home)

# ---------------- About ----------------
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "about.py")).read())
page("about/index.html", "About — BEST", "BEST is developed by UC Berkeley researchers with international stakeholders: mission, principles, method development, value, partnership and roadmap.",
     "about", "about", ABOUT)

# ---------------- BEST Chemicals ----------------
chem_hero = lambda h1, lead: f'''<section class="hero hero-short" aria-labelledby="page-title">
<div class="container">
<div class="hero-sector"><img src="{{root}}assets/img/best-mark-reversed.svg" alt="" width="44" height="44"><strong>BEST</strong> Chemicals</div>
<h1 id="page-title">{h1}</h1>
<p class="lead">{lead}</p>
</div>
</section>
'''
ICONS_SUB = {
 "products": '<svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true"><polyline class="ln draw" pathLength="100" points="37.9,22 37.9,32 24,40 10.1,32 10.1,16 24,8 31,12"/><polyline class="ln acc draw" pathLength="100" points="15,30 21,24 26,28 35,18"/><circle class="dot pulse" cx="36.5" cy="16.5" r="3.2"/></svg>',
 "methodology": '<svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true"><rect class="ln draw" pathLength="100" x="11" y="6" width="26" height="36" rx="4"/><line class="ln acc slide" x1="17" y1="16" x2="31" y2="16"/><line class="ln slide" x1="17" y1="23" x2="31" y2="23"/><line class="ln slide" x1="17" y1="30" x2="26" y2="30"/><circle class="dot pulse" cx="31" cy="35" r="3.2"/></svg>',
 "benchmarks": '<svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true"><line class="ln" x1="7" y1="40" x2="41" y2="40"/><rect class="bar b1" x="11" y="26" width="7" height="13" rx="1.5"/><rect class="bar b2" x="20.5" y="18" width="7" height="21" rx="1.5"/><rect class="bar b3" x="30" y="9" width="7" height="30" rx="1.5"/></svg>',
 "label": '<svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true"><polyline class="ln" points="17,30 14,43 20,40 24,44"/><polyline class="ln" points="31,30 34,43 28,40 24,44"/><circle class="ln draw" pathLength="100" cx="24" cy="20" r="13"/><polyline class="ln acc draw" pathLength="100" points="18,20 22.5,24.5 30,16"/></svg>',
 "calculator": '<svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true"><path class="ln g1" d="M8 31 A16 16 0 0 1 13.5 19"/><path class="ln g2" d="M16 16.6 A16 16 0 0 1 32 16.6"/><path class="ln g3" d="M34.5 19 A16 16 0 0 1 40 31"/><line class="ln needle" x1="24" y1="31" x2="24" y2="17"/><circle class="dot" cx="24" cy="31" r="3.2"/><line class="ln" x1="10" y1="40" x2="38" y2="40"/></svg>',
}
def subcard(href, key, title, text, link, i):
    return f'<a class="sub-card" style="--d:{i*0.08:.2f}s" href="{{root}}{href}"><span class="ico">{ICONS_SUB[key]}</span><h3>{title}</h3><p>{text}</p><span class="card-link">{link}&nbsp;→</span></a>\n'
chem_overview = chem_hero("Carbon performance for chemicals", "Product-specific methods, benchmarks, labels and calculators — starting with ethylene and polyethylene.") + '<section class="section"><div class="container">\n<div class="sub-cards">\n' + "".join([
 subcard("chemicals/products/", "products", "Products", "Ethylene and polyethylene: what each method covers.", "See products", 0),
 subcard("chemicals/methodology/", "methodology", "Methodology", "Cradle-to-gate rules aligned with ISO 14067, TfS and IPCC AR6.", "Read the methods", 1),
 subcard("chemicals/benchmarks/", "benchmarks", "Benchmarks", "BEST, BETTER and GOOD bands by product, technology and region.", "Explore benchmarks", 2),
 subcard("chemicals/label-verification/", "label", "Label &amp; Verification", "The BEST carbon label, data quality rating and verification.", "How labelling works", 3),
 subcard("chemicals/pcf-calculator/", "calculator", "PCF Calculator", "Calculate your footprint online and see your tier.", "Open the calculator", 4),
]) + '</div>\n</div></section>\n'
page("chemicals/index.html", "BEST Chemicals — BEST", "Methods, benchmarks, labels and calculators for chemicals, starting with ethylene and polyethylene.",
     "chemicals", "chem-overview", chem_overview, theme="chemicals", subnav=True)
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "products.py")).read())
page("chemicals/products/index.html", "Products — BEST Chemicals", "Ethylene and polyethylene under BEST Chemicals: declared unit, routes covered, method status and worked examples.",
     "chemicals", "chem-products", chem_hero("Products", "Ethylene and polyethylene: what each method covers, what makes it specific, and a worked example.") + PRODUCTS,
     theme="chemicals", subnav=True)
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "methodology.py")).read())
page("chemicals/methodology/index.html", "Methodology — BEST Chemicals", "How BEST Chemicals methods calculate cradle-to-gate product carbon footprints: steps, emission sources, key rules and data quality.",
     "chemicals", "chem-methodology", chem_hero("Methodology", "How a BEST Chemicals footprint is calculated — the steps, what is counted, the key rules and how data quality is rated.") + METHOD,
     theme="chemicals", subnav=True)
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "label.py")).read())
page("chemicals/label-verification/index.html", "Label &amp; Verification — BEST Chemicals", "The BEST carbon label, performance tiers, how results are verified and what verifiers check.",
     "chemicals", "chem-label", chem_hero("Label &amp; Verification", "How verified results become the BEST carbon label — and what independent verifiers check.") + LABEL,
     theme="chemicals", subnav=True)
for slug, pid, t, lead in [
    ("benchmarks", "chem-benchmarks", "Benchmarks", "BEST, BETTER and GOOD performance bands for each product, with the evidence behind them."),
]:
    page(f"chemicals/{slug}/index.html", f"{t} — BEST Chemicals", lead, "chemicals", pid,
         chem_hero(t, lead) + '<section class="section"><div class="container"><div class="placeholder">This page is being prepared.</div></div></section>\n',
         theme="chemicals", subnav=True)

calc = chem_hero("PCF Calculator", "Calculate the cradle-to-gate carbon footprint of your product online, see your BEST tier and data quality rating.") + '''<section class="section"><div class="container">
<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:24px">
<a class="card" href="{root}tools/ethylene-calculator/"><span class="status">In development</span><h3>Ethylene PCF calculator</h3><p class="muted">1 t specification-compliant ethylene at the factory gate. Steam cracking (liquid and gas feed) and methanol-to-olefins.</p><span class="card-link">Open →</span></a>
<a class="card" href="{root}tools/polyethylene-calculator/"><span class="status">In development</span><h3>Polyethylene PCF calculator</h3><p class="muted">1 t LDPE, LLDPE or HDPE resin at the factory gate, for each production route and grade.</p><span class="card-link">Open →</span></a>
</div>
<div class="card" style="margin-top:24px">
<h3>How it works</h3>
<p class="muted">Enter one year of plant data step by step — feedstocks, energy, utilities, transport and waste. The calculator applies the BEST Chemicals method and factor library, then shows your footprint per tonne, your BEST / BETTER / GOOD tier, where emissions come from and your data quality rating. Calculations run in your browser: your plant data stays on your computer.</p>
</div>
</div></section>
'''
page("chemicals/pcf-calculator/index.html", "PCF Calculator — BEST Chemicals", "Online product carbon footprint calculators for ethylene and polyethylene.",
     "chemicals", "chem-calculator", calc, theme="chemicals", subnav=True)

# ---------------- BEST Data Centers ----------------
dc = '''<section class="hero hero-short" aria-labelledby="page-title">
<div class="container">
<div class="hero-sector"><img src="{root}assets/img/best-mark-reversed-dc.svg" alt="" width="44" height="44"><strong>BEST</strong> Data Centers</div>
<h1 id="page-title">Carbon performance for data centers</h1>
<p class="lead">The BEST approach — common methods, benchmarks and verification — applied to data centers. In preparation.</p>
<div class="hero-actions"><a class="btn btn-light" href="{root}contact/">Get involved</a></div>
</div>
</section>
<section class="section"><div class="container">
<div class="placeholder">BEST Data Centers is in preparation. Methods, benchmarks and tools will be published here.</div>
</div></section>
'''
page("data-centers/index.html", "BEST Data Centers — BEST", "BEST for data centers: carbon performance evaluation and benchmarking. In preparation.",
     "datacenters", "datacenters", dc, theme="datacenters")

# ---------------- Tools ----------------
tools = '''<section class="page-hero"><div class="container">
<div class="eyebrow">Tools</div>
<h1>Tools</h1>
<p class="lead">Online tools to calculate, check and understand product carbon performance. All calculations run in your browser — your data stays on your computer.</p>
</div></section>
<section><div class="container">
<div class="grid">
<a class="card" href="{root}tools/ethylene-calculator/"><span class="status">BEST Chemicals · In development</span><h3>Ethylene PCF calculator</h3><p class="muted">Cradle-to-gate footprint of 1 t ethylene for steam cracking and methanol-to-olefins, with tier and data quality.</p><span class="card-link">Open →</span></a>
<a class="card" href="{root}tools/polyethylene-calculator/"><span class="status">BEST Chemicals · In development</span><h3>Polyethylene PCF calculator</h3><p class="muted">Cradle-to-gate footprint of 1 t LDPE, LLDPE or HDPE resin, with tier and data quality.</p><span class="card-link">Open →</span></a>
<div class="card" style="border-style:dashed"><h3>More tools coming</h3><p class="muted">A tier checker, report exports and tools for new sectors will be added here.</p></div>
</div>
</div></section>
'''
page("tools/index.html", "Tools — BEST", "Online PCF calculators for ethylene and polyethylene, and more tools to come.", "tools", "tools-overview", tools, subnav=True)
for slug, pid, t, lead in [
    ("ethylene-calculator", "tools-ethylene", "Ethylene PCF calculator", "Calculate the cradle-to-gate carbon footprint of ethylene, see your BEST tier and data quality rating."),
    ("polyethylene-calculator", "tools-pe", "Polyethylene PCF calculator", "Calculate the cradle-to-gate carbon footprint of LDPE, LLDPE or HDPE, see your BEST tier and data quality rating."),
]:
    page(f"tools/{slug}/index.html", f"{t} — BEST Tools", lead, "tools", pid,
         stub("Tools · BEST Chemicals", t, lead, "The online calculator is in development."), theme="chemicals", subnav=True)

# ---------------- Engine check (developer verification page, not in the menu) ----------------
ENGINE_CHECK = '''<section class="page-hero"><div class="container">
<div class="eyebrow">Tools · BEST Chemicals · Engine check</div>
<h1>Calculator engine check</h1>
<p class="lead">The online calculators run the BEST Excel workbooks in your browser. This page recalculates a worked example and compares every formula cell with the values Excel saved.</p>
</div></section>
<section style="padding-bottom:40px"><div class="container">
<div class="tab-list" role="group" aria-label="Choose a worked example" style="margin-bottom:24px">
<button class="tab" type="button" data-model="pe" aria-selected="true">Polyethylene · HDPE gas phase</button><button class="tab" type="button" data-model="eth" aria-selected="false">Ethylene · ethane cracker</button>
</div>
<div class="ec-grid">
<div class="ec-panel">
<div><p class="sub-h" style="margin-bottom:8px">Headline PCF (fossil, location-based)</p><div class="ec-big" id="ec-pcf">—</div><div class="muted" id="ec-unit"></div></div>
<div class="muted" id="ec-status-line" style="font-size:14px"></div>
<button class="btn btn-primary" type="button" id="ec-run" disabled>Run check</button>
<div class="ec-result" id="ec-result"><div class="ec-kv"><span>Formula cells matching Excel</span><b id="ec-match">—</b><span>Recalculation time</span><b id="ec-time">—</b></div><p id="ec-result-text" style="margin:8px 0 0;font-size:14px"></p></div>
<p class="muted" id="ec-status" role="status" style="font-size:14px;margin:0"></p>
<div class="field"><label for="ec-input" id="ec-input-label">Fresh feed (t/yr)</label><input id="ec-input" type="number" min="0" step="any"><span class="err">Enter a positive number.</span></div>
<p class="muted" style="font-size:13px;margin:0">Change the feed to see the footprint recalculate instantly. “Run check” restores the example.</p>
<p style="font-size:14px;margin:0"><a href="{root}tools/live-check/">Live check: compare your own Excel file →</a></p>
</div>
<div class="ec-panel ec-wrap">
<table class="ec-table"><thead><tr><th>ID</th><th>Emission term</th><th class="num">Engine (t CO₂e/yr)</th><th class="num">Excel</th></tr></thead><tbody id="ec-terms"></tbody></table>
</div>
</div>
</div></section>
<script src="{root}assets/calc/engine.js"></script>
<script src="{root}assets/calc/engine-check.js"></script>
'''
# ---------------- Live check against Excel (verification page, not in the menu) ----------------
LIVE_CHECK = """<section class="page-hero"><div class="container">
<div class="eyebrow">Tools · BEST Chemicals · Live check</div>
<h1>Live check against Excel</h1>
<p class="lead">Change anything in a BEST calculator workbook in Excel, save it, and drop it here. The engine recalculates the file from its own formulas and inputs and compares every formula cell with the result Excel saved.</p>
</div></section>
<section style="padding-bottom:40px"><div class="container">
<ol class="lc-steps">
<li><b>In Excel</b>, open the PE or ethylene calculator and change any inputs.</li>
<li><b>Save</b> the workbook (.xlsx). Excel stores its results in the file.</li>
<li><b>Drop the file</b> below. It is read in this browser and never uploaded.</li>
</ol>
<label class="lc-drop" id="lc-drop" for="lc-file">
<input type="file" id="lc-file" accept=".xlsx" class="visually-hidden">
<span class="lc-drop-title">Drop the saved workbook here</span>
<span class="muted">or click to choose a file · .xlsx</span>
</label>
<p class="lc-status" id="lc-status" role="status"></p>
<div id="lc-out" hidden style="scroll-margin-top:96px">
<div class="lc-head"><div><p class="sub-h" style="margin:0">File</p><b id="lc-file-name"></b><div class="muted" id="lc-calc"></div><div class="muted" id="lc-saved-by"></div></div></div>
<p class="lc-warn" id="lc-warn" hidden></p>
<div class="ec-grid lc-grid">
<div class="ec-panel">
<div class="ec-result" id="lc-result"><div class="ec-kv"><span>Formula cells matching Excel</span><b id="lc-match">—</b><span>Engine recalculation</span><b id="lc-time">—</b></div><p id="lc-verdict" style="margin:8px 0 0;font-size:14px"></p></div>
<div id="lc-pcf">
<table class="ec-table lc-pcf"><thead><tr><th></th><th class="num">Excel</th><th class="num">Engine</th></tr></thead>
<tbody><tr><td>Headline PCF <span class="muted" id="lc-unit"></span></td><td class="num lc-big" id="lc-pcf-x">—</td><td class="num lc-big" id="lc-pcf-e">—</td></tr>
<tr><td>Calculation status</td><td id="lc-st-x" style="font-size:13px">—</td><td id="lc-st-e" style="font-size:13px">—</td></tr></tbody></table>
</div>
<table class="ec-table"><thead><tr><th>Sheet</th><th class="num">Formulas</th><th class="num">Same</th><th class="num">Different</th></tr></thead><tbody id="lc-sheets"></tbody></table>
</div>
<div class="ec-panel ec-wrap">
<table class="ec-table"><thead><tr><th>ID</th><th>Emission term</th><th class="num">Excel (t CO₂e/yr)</th><th class="num">Engine</th><th></th></tr></thead><tbody id="lc-terms"></tbody></table>
</div>
</div>
<div id="lc-diff-wrap" hidden style="margin-top:24px">
<h2 style="font-size:22px">Cells that differ</h2>
<div class="ec-panel ec-wrap"><table class="ec-table"><thead><tr><th>Cell</th><th>Excel saved</th><th>Engine</th></tr></thead><tbody id="lc-diffs"></tbody></table></div>
</div>
</div>
<p class="muted" style="font-size:13px;margin-top:32px">Use desktop Excel and save after it has calculated. A file saved by another program (LibreOffice, Google Sheets, Numbers) holds that program's results, which can differ from Excel's in a few warning messages. See also the <a href="{root}tools/engine-check/">engine check on the worked examples</a>.</p>
</div></section>
<script src="{root}assets/calc/engine.js"></script>
<script src="{root}assets/calc/xlsx-read.js"></script>
<script src="{root}assets/calc/live-check.js"></script>
"""
page("tools/live-check/index.html", "Live check against Excel — BEST Tools", "Drop a BEST calculator workbook saved in Excel: the browser engine recalculates it and compares every formula cell with Excel's results.",
     "tools", "tools-engine", LIVE_CHECK, theme="chemicals", subnav=True)

page("tools/engine-check/index.html", "Calculator engine check — BEST Tools", "Verification page: the browser engine recalculates the BEST calculator examples and compares every formula cell with Excel.",
     "tools", "tools-engine", ENGINE_CHECK, theme="chemicals", subnav=True)

# ---------------- Resources, Contact ----------------
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "resources.py")).read())
page("resources/index.html", "Resources — BEST", "BEST method documents and guides, a glossary of key terms, frequently asked questions and news.", "resources", "resources", RESOURCES)
page("contact/index.html", "Contact — BEST", "Contact the BEST initiative: questions, joining, method review, document requests, verification and calculator support.", "contact", "contact", CONTACT)
