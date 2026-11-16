import re
def I(path):
    return f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{path}</svg>'
ICON = {
 "boundary": I('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12h8M12 8v8"/>'),
 "bolt": I('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'),
 "capture": I('<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/>'),
 "quality": I('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
 "leaf": I('<path d="M5 19c8 0 14-6 14-15C10 4 5 9 5 15v4z"/><path d="M5 19 13 11"/>'),
 "tiers": I('<path d="M3 20h18M5 20v-5h4v5M10 20V10h4v10M15 20V5h4v15"/>'),
 "scale": I('<path d="M12 3v18M5 21h14M6 7h12"/><path d="m6 7-3 7a3 3 0 0 0 6 0zM18 7l-3 7a3 3 0 0 0 6 0z"/>'),
 "check": I('<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>'),
 "coins": I('<ellipse cx="9" cy="7" rx="6" ry="3"/><path d="M3 7v5c0 1.7 2.7 3 6 3s6-1.3 6-3V7"/><path d="M15 11.5c3.3 0 6 1.3 6 3V17c0 1.7-2.7 3-6 3-1.7 0-3.2-.3-4.3-.9"/>'),
 "trend": I('<path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/>'),
 "bank": I('<path d="M3 10h18L12 4z"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/>'),
 "megaphone": I('<path d="M3 11v2a1 1 0 0 0 1 1h3l6 4V6L7 10H4a1 1 0 0 0-1 1z"/><path d="M17 9a4 4 0 0 1 0 6"/>'),
 "flag": I('<path d="M5 21V4M5 4h12l-2 4 2 4H5"/>'),
 "method": I('<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/><path d="m10 14 2 2 4-4"/>'),
 "calc": I('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8v3H8z"/><path d="M8.5 14h1M11.5 14h1M14.5 14h1M8.5 17.5h1M11.5 17.5h1M14.5 17.5h1"/>'),
 "label": I('<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/>'),
}

def tiles(prefix, items, cols=None):
    style = f' style="grid-template-columns:repeat(auto-fill,minmax({cols}px,1fr))"' if cols else ''
    out = f'<div class="reveal-grid fade"{style}>\n'
    for i, (k, t, d) in enumerate(items, 1):
        out += f'''<div class="reveal-tile">
<button class="reveal-btn" type="button" aria-expanded="false" aria-controls="{prefix}-{i}"><span class="reveal-icon">{ICON[k]}</span><span class="reveal-title">{t}</span><span class="reveal-toggle" aria-hidden="true"></span></button>
<div class="reveal-panel" id="{prefix}-{i}"><div><p>{d}</p></div></div>
</div>
'''
    return out + '</div>\n'

def drawn(k):
    # same icon, with each stroke measured so it can be drawn in when the step opens
    return re.sub(r'<(path|rect|circle|ellipse)', r'<\1 pathLength="100"', ICON[k])

def stepper(prefix, label, items, autoplay=False):
    icons = len(items[0]) == 3
    if not icons: items = [(None, t, d) for t, d in items]
    dot = lambda i, k: ICON[k] if k else f'{i:02d}'
    tabs = "".join(f'<button class="step-tab" type="button" role="tab" id="{prefix}-t{i}" aria-controls="{prefix}-p{i}" aria-selected="{"true" if i==1 else "false"}"><span class="dot">{dot(i, k)}</span><span>{t}</span></button>' for i, (k, t, d) in enumerate(items, 1))
    head = lambda i, k: f'<div class="step-ico">{drawn(k)}</div>' if k else ''
    num = lambda i, k: f'<div class="step-num">Step {i} of {len(items)}</div>' if k else ''
    panels = "".join(f'''<div class="step-panel{" has-ico" if k else ""}" role="tabpanel" id="{prefix}-p{i}" aria-labelledby="{prefix}-t{i}" tabindex="0">
{head(i, k)}<div>{num(i, k)}<h3>{t}</h3><p>{d}</p></div>
<div class="step-ctrl"><button type="button" data-step="prev" aria-label="Previous step">←</button><button type="button" data-step="next" aria-label="Next step">→</button></div>
</div>
''' for i, (k, t, d) in enumerate(items, 1))
    cls = "stepper fade" + (" with-icons" if icons else "")
    auto = ' data-autoplay="4000"' if autoplay else ''
    return f'<div class="{cls}"{auto}>\n<div class="stepper-nav" role="tablist" aria-label="{label}" style="--steps:{len(items)}">{tabs}</div>\n{panels}</div>\n'

def tabset(prefix, label, groups):
    tabs = "".join(f'<button class="tab" type="button" role="tab" id="{prefix}-t{i}" aria-controls="{prefix}-p{i}" aria-selected="{"true" if i==1 else "false"}">{name}</button>' for i, (name, _) in enumerate(groups, 1))
    panels = "".join(f'<div class="tab-panel" role="tabpanel" id="{prefix}-p{i}" aria-labelledby="{prefix}-t{i}" tabindex="0"><ul>' + "".join(f'<li>{x}</li>' for x in items) + '</ul></div>\n' for i, (_, items) in enumerate(groups, 1))
    return f'<div class="tabs fade">\n<div class="tab-list" role="tablist" aria-label="{label}">{tabs}</div>\n{panels}</div>\n'

ABOUT = '''<section class="page-hero"><div class="container">
<div class="eyebrow">About</div>
<h1>About BEST</h1>
<p class="lead">BEST — Benchmarking &amp; Evaluation for Sustainability and Transparency — makes product carbon performance credible, comparable and economically meaningful.</p>
</div></section>

<section class="section" style="padding-top:0"><div class="container split">
<div class="prose fade">
<h2>What BEST is</h2>
<p>An integrated system to evaluate and benchmark the carbon performance of products — built on international standards, with the product-specific rules, benchmarks and verification they leave open.</p>
<div class="reveal-panel more-panel" id="more-what"><div>
<p>Producers see where they stand and where to improve. Buyers and investors get results they can compare. Governments get a credible basis for linking verified performance to incentives.</p>
</div></div>
<button class="more-btn" type="button" aria-expanded="false" aria-controls="more-what">Read more</button>
</div>
<div class="card fade">
<div class="eyebrow">Who develops BEST</div>
<p style="font-size:17px;line-height:1.6">Researchers at the <strong>University of California, Berkeley</strong>, in collaboration with international stakeholders from industry and academia.</p>
<!-- Partner and stakeholder logos go here once confirmed (UC Berkeley logo pending permission). -->
<p class="muted" style="margin:0">Methods are reviewed by international experts before publication.</p>
</div>
</div></section>

<section class="section band"><div class="container">
<div class="section-head fade">
<div class="eyebrow">Why it matters</div>
<h2>Footprints are only useful if they can be compared</h2>
</div>
''' + tiles("why", [
 ("scale", "The challenge", "General standards leave key choices open — boundary, co-product allocation, electricity, carbon capture, data quality. Results can't be compared, and strong performers can't prove it."),
 ("check", "The BEST answer", "Product-specific methods fix those choices; a shared factor library and calculator apply them; benchmarks place every result in a BEST, BETTER or GOOD band."),
], cols=420) + '''</div></section>

<section class="section"><div class="container">
<div class="section-head fade">
<div class="eyebrow">How it works</div>
<h2>From measurement to value</h2>
</div>
''' + stepper("hw", "How BEST works", [
 ("method", "Align", "Each product gets its own BEST method, built on ISO 14067 and the TfS PCF Guideline, so boundaries, allocation and data rules are fixed in advance."),
 ("calc", "Calculate", "Producers calculate the cradle-to-gate footprint per tonne with the BEST calculator and a shared factor library, plus a data quality rating."),
 ("tiers", "Benchmark", "The result is placed against peers in a BEST, BETTER or GOOD band derived from industry evidence."),
 ("label", "Communicate", "Verified results can carry the BEST label — a clear, comparable signal to customers and supply chains."),
 ("trend", "Improve", "The gap to the next tier shows where energy, feedstock, utilities or process changes matter most."),
 ("coins", "Create value", "Better performance becomes visible to buyers, investors and governments — opening market advantages and performance-linked incentives."),
], autoplay=True) + '''</div></section>

<section class="section band"><div class="container">
<div class="section-head fade">
<div class="eyebrow">Principles</div>
<h2>Six rules every BEST method follows</h2>
<p>They apply to every product and sector, so results stay comparable as BEST grows.</p>
</div>
<p class="reveal-hint">Select a principle to read more.</p>
''' + tiles("pr", [
 ("boundary", "One boundary", "Cradle-to-gate for 1 tonne of specification-compliant product, reported by production route."),
 ("bolt", "Transparent electricity", "Location-based results are mandatory; market-based results are shown separately where contracts are used."),
 ("capture", "Conservative carbon capture", "Captured CO₂ is credited only with complete evidence of capture and permanent storage."),
 ("quality", "Visible data quality", "A clear data hierarchy and a Data Quality Rating with Low, Medium or High uncertainty."),
 ("leaf", "Fossil and biogenic apart", "Biogenic carbon is tracked and reported separately — never netted as a credit."),
 ("tiers", "Performance tiers", "Every result is placed in a BEST, BETTER or GOOD band for comparison across facilities."),
]) + '''<div class="standards fade" aria-label="Standards BEST builds on">
<span>ISO 14040 / 14044</span><span>ISO 14067</span><span>TfS PCF Guideline</span><span>IPCC AR6 GWP-100</span><span>No offsets in the footprint</span>
</div>
</div></section>

<section class="section"><div class="container">
<div class="section-head fade">
<div class="eyebrow">Method development</div>
<h2>Open, reviewed, versioned</h2>
</div>
''' + stepper("md", "How BEST methods are developed", [
 ("Draft", "The research team drafts the method with industry input and worked examples."),
 ("Expert review", "International experts from industry, academia, research and certification review the draft."),
 ("Revision", "Comments are consolidated and addressed, and the calculator is updated to match."),
 ("Approval", "The method and its benchmark thresholds are approved and published with a version number."),
]) + '''</div></section>

<section class="section band"><div class="container">
<div class="section-head fade">
<div class="eyebrow">Value</div>
<h2>Why companies take part</h2>
</div>
''' + tiles("val", [
 ("coins", "Cost and carbon savings", "See how products compare with peers and focus on energy, feedstocks, utilities and processes that also cut cost."),
 ("trend", "Green competitiveness", "Make stronger performance visible, meet product-carbon requirements and stand out in domestic and export markets."),
 ("bank", "Policy and market value", "Build evidence for buyer preference and performance-linked benefits: tax relief, rebates, grants, financing or procurement."),
]) + '''<h3 class="fade" style="margin:40px 0 16px">Two signals that create value</h3>
''' + tiles("sig", [
 ("megaphone", "Market signal", "Benchmarking and verified labels let procurement programmes, investors and supply chains reward better performers."),
 ("flag", "Policy signal", "Verified improvement gives governments a sound basis for incentives — as the UK's Climate Change Agreements already do for energy-intensive industry."),
], cols=420) + '''</div></section>

<section class="section"><div class="container">
<div class="section-head fade">
<div class="eyebrow">Partnership</div>
<h2>A shared effort</h2>
</div>
''' + tabset("pt", "Partners and their roles", [
 ("Companies", ["Measure product carbon footprints", "Benchmark against peers", "Communicate verified results", "Improve and show progress"]),
 ("BEST &amp; industry associations", ["Common methods and benchmarks", "Labelling and communication", "Implementation support", "Aggregated industry learning"]),
 ("Governments", ["Recognise verified performance", "Link improvement to locally appropriate incentives"]),
]) + '''</div></section>

<section class="section band"><div class="container split">
<div class="section-head fade" style="margin:0">
<div class="eyebrow">Roadmap</div>
<h2>Where BEST is today</h2>
<p>BEST starts with chemicals — ethylene and polyethylene — and extends sector by sector.</p>
</div>
<ol class="timeline fade">
<li class="done"><div class="when">2026</div><h3>Ethylene and polyethylene methods</h3><p>Ethylene method revised after international review; polyethylene method open for comments.</p></li>
<li class="done"><div class="when">October 2026</div><h3>Ethylene benchmark thresholds approved</h3><p>Polyethylene thresholds are in draft.</p></li>
<li><div class="when">In progress</div><h3>Online PCF calculators</h3><p>Ethylene and polyethylene, on this website.</p></li>
<li class="next"><div class="when">Next</div><h3>More chemicals and BEST Data Centers</h3><p>Built on the same principles.</p></li>
</ol>
</div></section>

<section class="section"><div class="container">
<div class="cta-band fade">
<div><h2>Get involved</h2><p>Use the methods, test the calculators, review a draft or explore how BEST can work in your market.</p></div>
<div class="hero-actions"><a class="btn btn-light" href="{root}contact/">Contact us</a><a class="btn btn-ghost" href="{root}chemicals/">Explore BEST Chemicals</a></div>
</div>
</div></section>
'''
