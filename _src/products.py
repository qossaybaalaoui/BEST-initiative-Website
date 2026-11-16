# Uses ICON and tiles() from about.py (executed before this file)
def facts(items):
    return '<dl class="facts">' + "".join(f'<div><dt>{k}</dt><dd>{v}</dd></div>' for k, v in items) + '</dl>'

def routes(items):
    return '<div class="routes">' + "".join(f'<span>{r}</span>' for r in items) + '</div>'

def example(title, value, unit, tier_note, drivers, stats):
    bar = "".join(f'<span class="{c}" style="width:{w}%"></span>' for c, w, _ in drivers)
    leg = "".join(f'<span><i style="background:{col}"></i>{lab} {w}%</span>' for (c, w, lab), col in zip(drivers, ["var(--accent-on-dark)", "#F3D9A4", "rgba(255,255,255,.35)"]))
    st = "".join(f'<div><dt>{k}</dt><dd>{v}</dd></div>' for k, v in stats)
    return f'''<div class="example">
<div>
<div class="label">Worked example</div>
<div class="big">{value}</div>
<div class="unit">{unit}</div>
<div class="tier tier-best">BEST</div> <span style="font-size:13px;color:#C9DAD6">{tier_note}</span>
</div>
<div>
<h3>{title}</h3>
<div class="drivers" role="img" aria-label="Share of gross emissions: {', '.join(f'{lab} {w}%' for _, w, lab in drivers)}">{bar}</div>
<div class="legend">{leg}</div>
<dl class="ex-stats" style="margin-bottom:0">{st}</dl>
<p class="note">Example case with illustrative facility data. The tier position is indicative only.</p>
</div>
</div>'''

ETH = (facts([("Declared unit", "1 t ethylene at the factory gate"), ("Boundary", "Cradle-to-gate"), ("Method", 'BEST Ethylene · July 2026'), ("Status", "For further review")])
 + '<div><p class="sub-h">Production routes covered</p>' + routes([
   "<b>Liquid-feed steam cracking</b> · naphtha, condensate, gas oil, LPG",
   "<b>Gas-feed steam cracking</b> · ethane, propane, NGL",
   "<b>Methanol-to-olefins</b> · from coal or natural gas"]) + '</div>'
 + '<div><p class="sub-h">What makes this method specific</p>' + tiles("eth", [
   ("boundary", "Co-products", "Propylene, C4s and other co-products share the cracker's emissions. Ethylene's share is set by mass; economic allocation only where values differ by more than 5:1."),
   ("capture", "Decoking", "Burning coke off cracking furnaces is counted as its own emission source, not hidden in fuel use."),
   ("check", "Carbon capture", "Captured CO₂ is deducted only with full evidence of capture and storage — the result before capture is always shown too."),
   ("tiers", "Compared like for like", "Results are reported by route and feedstock, so each plant is compared on the same basis."),
 ]) + '</div>'
 + example("Ethane cracker · North America · 2025", "0.743", "t CO₂e per t ethylene", "against approved thresholds",
   [("d1", 54, "Feedstock upstream"), ("d2", 40, "Fuel combustion"), ("d3", 6, "Other")],
   [("Before carbon capture", "0.858 t CO₂e/t"), ("Output", "1,000,000 t/yr"), ("Data quality (1–5)", "3.34 · High uncertainty")])
 + '<div class="actions-row"><a class="btn btn-primary" href="{root}tools/ethylene-calculator/">Open the ethylene calculator</a><a class="btn btn-secondary" href="{root}chemicals/methodology/">Read the methodology</a><a class="btn btn-secondary" href="{root}chemicals/benchmarks/">See benchmarks</a></div>')

PE = (facts([("Declared unit", "1 t PE resin (pellets) at the factory gate"), ("Boundary", "Cradle-to-gate"), ("Method", "BEST Polyethylene"), ("Status", "Draft for comments")])
 + '<div><p class="sub-h">Resins and routes covered</p>' + routes([
   "<b>LDPE</b> · high pressure, tubular or autoclave",
   "<b>HDPE</b> · slurry, gas phase or solution",
   "<b>LLDPE</b> · gas phase or solution"]) + '</div>'
 + '<div><p class="sub-h">What makes this method specific</p>' + tiles("pe", [
   ("trend", "Ethylene carries its footprint", "Ethylene is the main input. Its own footprint — ideally the supplier's verified BEST ethylene result — flows into the polyethylene result."),
   ("quality", "Catalysts always counted", "Catalysts and initiators are never cut off: tiny in mass, but their upstream factors can be high."),
   ("boundary", "Grade disclosed, not scaled", "Density and melt flow rate are reported for each grade but never multiply the footprint."),
   ("leaf", "Bio-based feedstock", "Bio-ethylene is tracked stream by stream; biogenic carbon is reported separately and never netted."),
   ("coins", "Only sold co-products share", "Off-spec resin and wax share emissions only when sold; everything else is classified before allocation."),
 ]) + '</div>'
 + example("HDPE gas phase · China · 2025", "1.588", "t CO₂e per t HDPE", "against draft thresholds",
   [("d1", 76, "Feedstock (ethylene, comonomer, H₂)"), ("d2", 14, "Fuel combustion"), ("d3", 10, "Other")],
   [("Output", "296,800 t/yr"), ("Energy intensity", "4.3 GJ/t"), ("Data quality (1–5)", "3.81 · High uncertainty")])
 + '<div class="actions-row"><a class="btn btn-primary" href="{root}tools/polyethylene-calculator/">Open the polyethylene calculator</a><a class="btn btn-secondary" href="{root}chemicals/methodology/">Read the methodology</a><a class="btn btn-secondary" href="{root}chemicals/benchmarks/">See benchmarks</a></div>')

PRODUCTS = '''<section class="section"><div class="container">
<div class="section-head fade">
<div class="eyebrow">The value chain</div>
<h2>Two linked products</h2>
<p>Ethylene is the largest building block of the chemical industry, and most of it becomes plastics — polyethylene above all. BEST covers both, so the ethylene footprint carries straight into the polyethylene result.</p>
</div>
<ol class="chain fade">
<li><span class="tag">Inputs</span><h3>Feedstocks</h3><p>Ethane, naphtha, LPG, methanol</p></li>
<li class="is-best"><span class="tag">BEST method</span><h3>Ethylene</h3><p>Steam cracking or methanol-to-olefins</p></li>
<li class="is-best"><span class="tag">BEST method</span><h3>Polyethylene</h3><p>LDPE, LLDPE, HDPE resins</p></li>
<li><span class="tag">Downstream</span><h3>Everyday products</h3><p>Film, pipe, packaging, cable</p></li>
</ol>
</div></section>

<section class="section band" id="products"><div class="container">
<div class="section-head fade">
<div class="eyebrow">Products</div>
<h2>Choose a product</h2>
</div>
<div class="tabs product-tabs fade">
<div class="tab-list" role="tablist" aria-label="BEST Chemicals products">
<button class="tab" type="button" role="tab" id="prod-t1" aria-controls="prod-p1" aria-selected="true">Ethylene</button><button class="tab" type="button" role="tab" id="prod-t2" aria-controls="prod-p2" aria-selected="false">Polyethylene</button>
</div>
<div class="tab-panel product-panel" role="tabpanel" id="prod-p1" aria-labelledby="prod-t1" tabindex="0">
''' + ETH + '''
</div>
<div class="tab-panel product-panel" role="tabpanel" id="prod-p2" aria-labelledby="prod-t2" tabindex="0">
''' + PE + '''
</div>
</div>
</div></section>

<section class="section"><div class="container">
<div class="cta-band fade">
<div><h2>More chemicals to come</h2><p>BEST Chemicals will extend to further products on the same principles. Tell us which products matter to you.</p></div>
<div class="hero-actions"><a class="btn btn-light" href="{root}contact/">Contact us</a></div>
</div>
</div></section>
'''
