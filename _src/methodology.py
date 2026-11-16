# Uses ICON, I, tiles, stepper, facts from earlier scripts
ICON.update({
 "flame": I('<path d="M12 22c4 0 7-2.7 7-6.5 0-3.5-2.5-5.5-4-8-1 2-2 3-3.5 3.5C12 8 11 5 9 2c-.5 3.5-4 6.5-4 11.5C5 19.3 8 22 12 22z"/>'),
 "factory": I('<path d="M3 21V10l6 4V10l6 4V6h6v15z"/><path d="M7 17h2M12 17h2M17 17h2"/>'),
 "steam": I('<path d="M8 3c-1 1.5 1 2.5 0 4M12 3c-1 1.5 1 2.5 0 4M16 3c-1 1.5 1 2.5 0 4"/><rect x="4" y="10" width="16" height="11" rx="2"/>'),
 "drop": I('<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>'),
 "truck": I('<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>'),
 "trash": I('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
 "flask": I('<path d="M9 3h6M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2h12.4a1.5 1.5 0 0 0 1.3-2L14 9V3"/><path d="M7 15h10"/>'),
 "doc": '<svg viewBox="0 0 48 48" width="32" height="32" aria-hidden="true"><rect class="ln" x="11" y="6" width="26" height="36" rx="4"/><line class="ln acc" x1="17" y1="16" x2="31" y2="16"/><line class="ln" x1="17" y1="23" x2="31" y2="23"/><line class="ln" x1="17" y1="30" x2="26" y2="30"/></svg>',
})

def ruletabs(prefix, label, groups):
    tabs = "".join(f'<button class="tab" type="button" role="tab" id="{prefix}-t{i}" aria-controls="{prefix}-p{i}" aria-selected="{"true" if i==1 else "false"}">{name}</button>' for i, (name, _, _) in enumerate(groups, 1))
    panels = "".join(f'<div class="rule-panel" role="tabpanel" id="{prefix}-p{i}" aria-labelledby="{prefix}-t{i}" tabindex="0">{body}<p class="why">{why}</p></div>\n' for i, (_, body, why) in enumerate(groups, 1))
    return f'<div class="tabs fade">\n<div class="tab-list" role="tablist" aria-label="{label}">{tabs}</div>\n{panels}</div>\n'

DQR = [
 ("1", "Measured · verified", "Measured, site-specific and third-party verified", "Direct measurement at the site for the reporting period, verified by an independent body."),
 ("2", "Measured", "Measured, site-specific, not externally verified", "Direct measurement or mass balance at the site, reviewed internally."),
 ("3", "Supplier PCF", "Supplier-declared footprint", "A supplier's product footprint, compliant with a recognised standard and no more than three years old."),
 ("4", "Database", "Industry-average or database data", "Secondary data from an LCA database or an industry average."),
 ("5", "Default", "Generic defaults or proxies", "IPCC default factors, spend-based proxies or estimates — used only when nothing better exists."),
]
dqr_btns = "".join(f'<button class="dqr-btn dqr-{n}" type="button" role="tab" id="dq-t{n}" aria-controls="dq-p{n}" aria-selected="{"true" if n=="1" else "false"}"><span class="n">{n}</span><span class="t">{short}</span></button>' for n, short, _, _ in DQR)
dqr_panels = "".join(f'<div class="dqr-panel" role="tabpanel" id="dq-p{n}" aria-labelledby="dq-t{n}" tabindex="0"><h3>Score {n} — {title}</h3><p>{text}</p></div>\n' for n, _, title, text in DQR)

METHOD = '''<section class="section" style="padding-bottom:0"><div class="container">
''' + facts([("Scope", "Cradle-to-gate"), ("Declared unit", "1 t of product at the factory gate"), ("Impact", "Climate change · IPCC AR6 GWP-100"), ("Offsets", "Never deducted")]) + '''
<div class="standards fade" aria-label="Standards the methods build on"><span>ISO 14040 / 14044</span><span>ISO 14067</span><span>TfS PCF Guideline</span><span>GHG Protocol Scope 2</span></div>
</div></section>

<section class="section"><div class="container">
<div class="section-head fade">
<div class="eyebrow">Step by step</div>
<h2>How a BEST footprint is calculated</h2>
</div>
''' + stepper("calc", "How a BEST footprint is calculated", [
 ("Set the scope", "Define the product, the production route and the plant boundary — from raw-material extraction to the factory gate."),
 ("Collect data", "Gather one continuous year of plant data: feedstocks, energy, utilities, emissions and wastes. Measured data first, then supplier and database data."),
 ("Check the balances", "Mass, carbon and energy must add up. Any unexplained carbon is counted conservatively as an emission."),
 ("Share with co-products", "Where the plant also sells co-products, shared emissions are split between them by a fixed rule."),
 ("Calculate by source", "Each emission source — feedstock, fuels, process, electricity, steam, utilities, transport, waste — is calculated with its own equation."),
 ("Rate and report", "A data quality rating, an uncertainty class and the BEST tier complete the result, ready for verification."),
]) + '''</div></section>

<section class="section band"><div class="container">
<div class="section-head fade">
<div class="eyebrow">What is counted</div>
<h2>Every emission source, nothing hidden</h2>
<p>Select a source to see how it is treated.</p>
</div>
''' + tiles("src", [
 ("flask", "Feedstocks &amp; materials", "Each input carries its cradle-to-gate footprint — ideally the supplier's verified product footprint. Catalysts are always included."),
 ("flame", "Fuel combustion", "Every metered fuel is counted once, from its energy content and carbon, plus the emissions of producing that fuel."),
 ("factory", "Process emissions", "Flares, vents, leaks and non-CO₂ gases, measured or engineered from plant data. For ethylene, furnace decoking too."),
 ("bolt", "Electricity", "Full life-cycle factor. The location-based result is mandatory; a market-based result is added where contracts are used."),
 ("steam", "Steam &amp; heat", "Steam made on site is counted through its fuel; purchased steam gets the supplier's factor or a documented default."),
 ("drop", "Water &amp; industrial gases", "Only what crosses the site fence carries a factor; on-site utilities are counted through their own energy."),
 ("truck", "Transport", "Inbound and waste transport legs not already included in a material's footprint."),
 ("trash", "Waste &amp; wastewater", "Each waste stream follows its real treatment route — incineration, landfill or wastewater treatment."),
 ("capture", "Carbon capture", "Deducted only for CO₂ permanently stored or verifiably used, with full evidence. The result before capture is always shown."),
]) + '''</div></section>

<section class="section"><div class="container">
<div class="section-head fade">
<div class="eyebrow">Key rules</div>
<h2>The rules that make results comparable</h2>
</div>
''' + ruletabs("rule", "Key rules", [
 ("Co-products", "<ol><li>First avoid allocation: split the process until each part has one product.</li><li>Otherwise share emissions by mass.</li><li>Use economic value only when there is no physical basis — or when co-product values differ by more than 5:1.</li></ol>", "Only co-products that are actually sold share emissions; everything else is classified as waste or emission first."),
 ("Cut-off", "<ul><li>A flow below 1% of the footprint may be left out — judged by its emissions, not its mass.</li><li>Included materials and energy must still cover at least 97% of the total.</li><li>Catalysts and precious metals are never cut off.</li></ul>", "Every exclusion is listed with its justification, never silently dropped."),
 ("Electricity", "<ul><li>Location-based result: mandatory, using the delivered grid factor including losses.</li><li>Market-based result: reported separately when renewable contracts or certificates are used.</li></ul>", "So buyers can compare plants on the same basis, and still see the effect of clean-power purchases."),
 ("Biogenic carbon", "<ul><li>Bio-based inputs are tracked stream by stream, with certificates.</li><li>Biogenic CO₂ and the biogenic carbon stored in the product are reported separately.</li></ul>", "The headline footprint is fossil; biogenic carbon is disclosed, never netted as a credit."),
 ("Carbon capture", "<ul><li>Captured CO₂ is deducted only when permanently stored or verifiably used.</li><li>Energy used to capture, compress and transport it stays in the footprint.</li></ul>", "The footprint before capture is always reported alongside, so the deduction is visible."),
]) + '''</div></section>

<section class="section band"><div class="container">
<div class="section-head fade">
<div class="eyebrow">Data quality rating</div>
<h2>How good is the data behind a result?</h2>
<p>Each input gets a score from 1 (best) to 5. The overall rating is weighted by each input's share of emissions and sets the uncertainty class. Select a score.</p>
</div>
<div class="fade">
<div class="dqr-scale" role="tablist" aria-label="Data quality scores">''' + dqr_btns + '''</div>
<div class="dqr-bands" aria-hidden="true"><span>Low uncertainty · up to 1.5</span><span>Medium · up to 3.0</span><span>High · above 3.0</span></div>
''' + dqr_panels + '''</div>
</div></section>

<section class="section"><div class="container">
<div class="section-head fade">
<div class="eyebrow">Documents</div>
<h2>Method documents</h2>
</div>
<div class="doc-list fade">
<div class="doc"><span class="ico">''' + ICON["doc"] + '''</span><div><h3>BEST Ethylene method</h3><p>July 2026 · For further review</p><a class="btn btn-secondary" href="{root}contact/?topic=document">Request a copy</a></div></div>
<div class="doc"><span class="ico">''' + ICON["doc"] + '''</span><div><h3>BEST Polyethylene method</h3><p>Draft for comments</p><a class="btn btn-secondary" href="{root}contact/?topic=review">Request a copy or comment</a></div></div>
</div>
</div></section>

<section class="section" style="padding-top:0"><div class="container">
<div class="cta-band fade">
<div><h2>Help shape the methods</h2><p>Drafts are open for review by producers, researchers, verifiers and other stakeholders.</p></div>
<div class="hero-actions"><a class="btn btn-light" href="{root}contact/?topic=review">Comment on a draft</a><a class="btn btn-ghost" href="{root}chemicals/pcf-calculator/">Try the calculator</a></div>
</div>
</div></section>
'''
