# BEST Chemicals -> Label & Verification. Uses ICON, tiles, stepper from earlier scripts.
ICON.update({
 "eye": I('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
 "scale2": I('<path d="M4 7h16M7 7l-3 7h6zM17 7l-3 7h6zM12 4v16M8 20h8"/>'),
 "list": I('<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>'),
 "cert": I('<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M7 9h10M7 13h6"/><circle cx="17" cy="17" r="3"/><path d="m15.5 19.5-.5 2.5 2-1 2 1-.5-2.5"/>'),
})

LABEL = '''<section class="section"><div class="container">
<div class="section-head fade">
<div class="eyebrow">The BEST carbon label</div>
<h2>One label, read in seconds</h2>
<p>The label shows a product's verified footprint and where it stands against comparable plants. Pick a tier to see how it changes.</p>
</div>
<div class="label-demo fade" data-label-demo>
<div>
<div class="carbon-label" aria-live="polite">
<div class="cl-head"><img src="{root}assets/img/best-mark-reversed.svg" alt="" width="28" height="28">BEST <span>Chemicals</span><span class="ex">Example</span></div>
<div class="cl-body">
<div class="cl-row">Product <b>Example resin · 1 t at factory gate</b></div>
<div class="cl-value"><span class="v">1.10</span><span class="u">t CO₂e per t · cradle-to-gate</span></div>
<div class="cl-map"><div class="cl-marker">Your product</div><div class="cl-bar" aria-hidden="true"><span></span><span></span><span></span><span></span></div><div class="cl-ticks" aria-hidden="true"><span>BEST</span><span>BETTER</span><span>GOOD</span><span>ABOVE</span></div></div>
<div class="cl-tier"><span class="tier tier-best cl-chip">BEST</span><span class="cl-desc" style="font-size:14px;color:var(--ink-muted);text-align:right">Top band among comparable plants</span></div>
<div class="cl-row">Data quality <b>Medium uncertainty</b></div>
<div class="cl-row">Verification <b>Independent third party</b></div>
</div>
<div class="cl-foot">Illustrative values. Method version, boundary and GWP basis are printed on every label.</div>
</div>
<div class="tier-picker" role="group" aria-label="Show the label for a tier">
<button type="button" data-tier="best" aria-pressed="true">BEST</button><button type="button" data-tier="better" aria-pressed="false">BETTER</button><button type="button" data-tier="good" aria-pressed="false">GOOD</button><button type="button" data-tier="above" aria-pressed="false">ABOVE RANGE</button>
</div>
</div>
<div>
<h3 style="margin-bottom:16px">What the label shows</h3>
<ol class="label-parts">
<li><span><b>The product</b> and its declared unit — always 1 tonne at the factory gate.</span></li>
<li><span><b>The footprint</b> in t CO₂e per tonne, fossil and location-based. Biogenic carbon and carbon capture are disclosed separately.</span></li>
<li><span><b>The tier map</b> — where the product sits against BEST, BETTER and GOOD thresholds for the same product.</span></li>
<li><span><b>Data quality</b> — the uncertainty class from the data quality rating.</span></li>
<li><span><b>Verification</b> — the label is issued only after independent third-party verification.</span></li>
</ol>
</div>
</div>
</div></section>

<section class="section band"><div class="container">
<div class="section-head fade">
<div class="eyebrow">Performance tiers</div>
<h2>What each tier means</h2>
<p>Thresholds are set per product from comparable industry evidence and published with their approval status. Values still in draft are labelled as such.</p>
</div>
<div class="tier-cards fade">
<div class="tier-card"><span class="tier tier-best">BEST</span><p>At or below the BEST threshold — the top band among comparable plants.</p></div>
<div class="tier-card"><span class="tier tier-better">BETTER</span><p>Above BEST, at or below the BETTER threshold — better than the typical plant.</p></div>
<div class="tier-card"><span class="tier tier-good">GOOD</span><p>Above BETTER, at or below the GOOD threshold — within the range of comparable plants.</p></div>
<div class="tier-card"><span class="tier tier-above">ABOVE RANGE</span><p>Above the GOOD threshold — the improvement gap shows where to act first.</p></div>
</div>
<p class="fade" style="margin-top:24px"><a class="card-link" href="{root}chemicals/benchmarks/">See the benchmarks for each product&nbsp;→</a></p>
</div></section>

<section class="section"><div class="container">
<div class="section-head fade">
<div class="eyebrow">From result to label</div>
<h2>How a result becomes a verified label</h2>
</div>
''' + stepper("lv", "From result to verified label", [
 ("Calculate", "The producer calculates the footprint with the BEST calculator for one year of plant data."),
 ("Resolve checks", "No blocking issue or provisional factor may remain, every warning is explained and the data quality assessment is complete."),
 ("Verify", "An independent third party checks the data, boundary, allocation, balances, factors and data quality."),
 ("Issue the label", "With the verification statement in hand, the BEST label and tier can be used in public claims and procurement."),
]) + '''<div class="note-box fade" style="margin-top:24px"><b>Self-assessment is not assurance.</b> A producer can use its own result to find improvements, but public claims, procurement, tier disclosure and the BEST label always require independent third-party verification.</div>
</div></section>

<section class="section band"><div class="container">
<div class="section-head fade">
<div class="eyebrow">For verifiers</div>
<h2>What verifiers check</h2>
<p>The minimum scope of a BEST verification. Select an item for detail.</p>
</div>
''' + tiles("ver", [
 ("list", "Activity data", "Primary data are complete, accurate and representative of the reporting year."),
 ("boundary", "System boundary", "The cradle-to-gate boundary matches the reported result and the BEST method."),
 ("scale2", "Allocation", "The co-product rule was applied and justified; factors sum to 1; wastes and co-products are classified correctly."),
 ("check", "Balances", "Carbon and energy close — feedstock, products, co-products, recycle and captured carbon, fossil and biogenic separately."),
 ("eye", "Emission factors", "The data hierarchy was followed; database name, version, geography and technology are disclosed."),
 ("bolt", "Electricity contracts", "Market-based claims rest on owned, tracked and retired instruments that match in time and place."),
 ("quality", "Data quality", "The data quality rating, primary data share and uncertainty class are calculated correctly."),
 ("trash", "Cut-offs", "Exclusions respect the thresholds and no known high-impact flow is left out."),
 ("capture", "Carbon capture", "Only the permanently stored or verifiably used CO₂ is deducted, with monitoring and claim ownership documented."),
]) + '''</div></section>

<section class="section"><div class="container split">
<div class="fade">
<div class="eyebrow">Calculator checks</div>
<h2>Four result statuses</h2>
<p class="muted" style="font-size:17px">The BEST calculator flags issues as you go, so results arrive at verification clean.</p>
</div>
<div class="status-row fade">
<div class="status-card st-block"><code>BLOCK</code><p>Must be fixed — no result is produced.</p></div>
<div class="status-card st-prov"><code>PROVISIONAL</code><p>A factor is still provisional — replace it before reporting.</p></div>
<div class="status-card st-warn"><code>WARN</code><p>Allowed, but must be explained in the report.</p></div>
<div class="status-card st-info"><code>INFO</code><p>A disclosure for transparency — no action needed.</p></div>
</div>
</div></section>

<section class="section band"><div class="container split">
<div class="fade">
<div class="eyebrow">Verification statement</div>
<h2>Every statement names</h2>
</div>
<ul class="fade" style="margin:0;padding-left:20px;display:grid;gap:10px;font-size:17px">
<li>The verifier</li>
<li>The assurance level — limited or reasonable</li>
<li>The standard applied</li>
<li>The scope covered</li>
<li>The completion date</li>
</ul>
</div></section>

<section class="section"><div class="container">
<div class="cta-band fade">
<div><h2>Verifiers and certification bodies</h2><p>Interested in verifying BEST results or contributing to the verification checklist? Get in touch.</p></div>
<div class="hero-actions"><a class="btn btn-light" href="{root}contact/">Contact us</a><a class="btn btn-ghost" href="{root}chemicals/methodology/">Read the methodology</a></div>
</div>
</div></section>
'''
