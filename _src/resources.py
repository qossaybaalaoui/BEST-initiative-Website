# Resources and Contact pages. Uses ICON, I, tiles from earlier scripts.
ICON.update({
 "book": I('<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5M8 7h7"/>'),
 "help": I('<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14"/><circle cx="12" cy="17" r=".6"/>'),
 "news": I('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h6M7 13h10M7 16h10"/>'),
 "search": I('<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>'),
 "users": I('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>'),
 "pen": I('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13 7 4 4"/>'),
 "calc": I('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h2M12 12h2M16 12h0M8 16h2M12 16h2M16 16h0"/>'),
 "server": I('<rect x="4" y="4" width="16" height="7" rx="1.5"/><rect x="4" y="13" width="16" height="7" rx="1.5"/><path d="M8 7.5h.01M8 16.5h.01"/>'),
 "mail": I('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
})

def doc(title, meta, status, href, button, icon="doc"):
    ico = ICON[icon] if icon != "doc" else ICON["doc"]
    return f'<div class="doc"><span class="ico">{ico}</span><div><span class="status">{status}</span><h3>{title}</h3><p>{meta}</p><a class="btn btn-secondary" href="{href}">{button}</a></div></div>'

GLOSSARY = [
 ("Product carbon footprint (PCF)", "Greenhouse-gas emissions of a product per declared unit, in t CO₂e per tonne, following ISO 14067."),
 ("Cradle-to-gate", "From raw-material extraction to the factory gate. Use, end-of-life and downstream processing are outside the boundary."),
 ("Declared unit", "The reference amount a footprint refers to — in BEST Chemicals, 1 tonne of specification-compliant product at the factory gate."),
 ("CO₂e and GWP-100", "Different greenhouse gases converted to the warming effect of CO₂ over 100 years, using IPCC AR6 values."),
 ("Co-product", "A second output of the same process that is sold, such as propylene from a steam cracker. It shares the process emissions."),
 ("Allocation", "The rule for sharing emissions between a product and its sold co-products: by mass by default, by economic value when values differ by more than 5:1."),
 ("Cut-off", "Leaving out a very small input — below 1% of the footprint — while still covering at least 97% of mass and energy. Never applied to catalysts."),
 ("Carbon residual", "Carbon that enters the process but is not found in any measured output. BEST counts it as emitted CO₂, to stay conservative."),
 ("Location-based electricity", "Electricity counted with the average delivered factor of the local grid. Mandatory in BEST."),
 ("Market-based electricity", "Electricity counted with contractual instruments (renewable contracts, certificates) and the residual mix. Reported separately."),
 ("Supplier-specific PCF", "A supplier's own verified footprint for the material it delivers — the preferred data for any purchased input."),
 ("Primary data", "Data measured at the site for the reporting period, as opposed to database or default values."),
 ("Primary data share (PDS)", "The share of emissions based on measured activity data and site- or supplier-specific factors."),
 ("Data quality rating (DQR)", "A score from 1 (best) to 5 for each input, weighted by its share of emissions into one overall rating."),
 ("Uncertainty class", "Low (rating up to 1.5), Medium (up to 3.0) or High (above 3.0), derived from the data quality rating."),
 ("Biogenic carbon", "Carbon from biomass, such as bio-ethylene. Tracked and reported separately from fossil carbon; never netted as a credit."),
 ("Carbon capture (CCUS)", "Capturing CO₂ for storage or use. Only permanently stored or verifiably used CO₂ may be deducted."),
 ("Offset", "A credit from an external project. Never deducted from a BEST footprint; reported separately if at all."),
 ("Benchmark tier", "BEST, BETTER, GOOD or Above range — where a footprint sits against thresholds for comparable plants."),
 ("Threshold", "The value that separates two tiers for a given product. Published with its approval status."),
 ("Third-party verification", "An independent check of a footprint, at limited or reasonable assurance, required for public claims and the BEST label."),
 ("BLOCK · PROVISIONAL · WARN · INFO", "Calculator statuses: must fix / provisional factor to replace / allowed with explanation / disclosure only."),
 ("Steam cracking", "Breaking down ethane, naphtha or other hydrocarbons with steam at high temperature to make ethylene and co-products."),
 ("Methanol-to-olefins (MTO)", "Making ethylene and propylene from methanol, which itself comes from coal or natural gas."),
 ("LDPE · LLDPE · HDPE", "Low-density, linear low-density and high-density polyethylene — three resin families made by different processes."),
 ("TfS PCF Guideline", "The chemical industry's guideline for product carbon footprints (Together for Sustainability), on which BEST builds."),
]
gloss = "".join(f'<div><dt>{t}</dt><dd>{d}</dd></div>' for t, d in GLOSSARY)

FAQ = [
 ("What is a product carbon footprint?", "The greenhouse-gas emissions caused by making a product, expressed per unit of product. BEST Chemicals footprints cover everything up to the factory gate, per tonne of product."),
 ("Why cradle-to-gate and not the full life cycle?", "Ethylene and polyethylene go into thousands of different products, each with its own use and end of life. Stopping at the factory gate keeps results comparable for every producer."),
 ("How is BEST different from ISO 14067 or the TfS guideline?", "BEST builds on them. It adds what they leave open for a specific product: fixed calculation rules, a shared factor library, benchmarks, a label and a verification checklist."),
 ("Who can use the BEST methods and calculators?", "Producers, their customers, verifiers, researchers and anyone interested. Public claims and the BEST label require independent verification."),
 ("Will my plant data leave my computer?", "No. The online calculators are designed to run in your browser, so your data stays on your computer unless you choose to export or share it."),
 ("Can we deduct carbon offsets?", "No. Offsets and credits from external projects are never deducted from a BEST footprint."),
 ("Can we deduct CO₂ that we capture?", "Only CO₂ that is permanently stored or verifiably used, with full evidence. The energy used for capture stays in the footprint, and the result before capture is always shown."),
 ("How is bio-based feedstock treated?", "It is declared with its certificate and tracked stream by stream. The headline footprint is fossil; biogenic carbon is reported separately."),
 ("When should we use supplier-specific data?", "Whenever a verified supplier footprint (no more than three years old) exists — above all for ethylene in polyethylene, which can be around three quarters of the result."),
 ("How are benchmark thresholds set?", "Per product, from comparable industry evidence. Thresholds are approved before they are used for labelling; draft values are clearly marked."),
]
faq = '<div class="faq">\n' + "".join(f'''<div class="reveal-tile">
<button class="reveal-btn" type="button" aria-expanded="false" aria-controls="faq-{i}"><span class="reveal-title">{q}</span><span class="reveal-toggle" aria-hidden="true"></span></button>
<div class="reveal-panel" id="faq-{i}"><div><p>{a}</p></div></div>
</div>
''' for i, (q, a) in enumerate(FAQ, 1)) + '</div>\n'

RESOURCES = '''<section class="page-hero"><div class="container">
<div class="eyebrow">Resources</div>
<h1>Resources</h1>
<p class="lead">Documents, a glossary of key terms, answers to common questions and the latest news.</p>
</div></section>

<section style="padding-bottom:40px"><div class="container">
<nav class="jump fade" aria-label="On this page">
<a href="#documents"><span class="reveal-icon">''' + ICON["book"] + '''</span>Documents</a>
<a href="#glossary"><span class="reveal-icon">''' + ICON["search"] + '''</span>Glossary</a>
<a href="#faq"><span class="reveal-icon">''' + ICON["help"] + '''</span>FAQ</a>
<a href="#news"><span class="reveal-icon">''' + ICON["news"] + '''</span>News</a>
</nav>
</div></section>

<section class="section band" id="documents"><div class="container">
<div class="section-head fade"><div class="eyebrow">Documents</div><h2>Methods and guides</h2></div>
<div class="doc-group fade"><p class="sub-h">BEST Chemicals methods</p><div class="doc-list">
''' + doc("BEST Ethylene method", "Cradle-to-gate PCF method for ethylene · July 2026", "For further review", "{root}contact/?topic=document", "Request a copy") + doc("BEST Polyethylene method", "Cradle-to-gate PCF method for LDPE, LLDPE and HDPE", "Draft for comments", "{root}contact/?topic=review", "Request a copy or comment") + '''
</div></div>
<div class="doc-group fade"><p class="sub-h">Calculator guides</p><div class="doc-list">
''' + doc("Calculator guide — short version", "Step-by-step guide to completing a BEST PCF calculation", "Guide", "{root}contact/?topic=document", "Request a copy") + doc("Calculator guide — full version", "Detailed guide with worked examples and troubleshooting", "Guide", "{root}contact/?topic=document", "Request a copy") + '''
</div></div>
<div class="doc-group fade"><p class="sub-h">Tools</p><div class="doc-list">
''' + doc("Online PCF calculators", "Ethylene and polyethylene, in your browser", "In development", "{root}chemicals/pcf-calculator/", "Go to the calculators", "calc") + '''
</div></div>
</div></section>

<section class="section" id="glossary"><div class="container">
<div class="section-head fade"><div class="eyebrow">Glossary</div><h2>Key terms in plain words</h2></div>
<div class="search fade">''' + ICON["search"] + '''<label class="visually-hidden" for="g-search">Search the glossary</label><input id="g-search" type="search" placeholder="Search a term, e.g. allocation" data-filter="glossary-list" autocomplete="off"></div>
<dl class="glossary fade" id="glossary-list">''' + gloss + '''</dl>
<p class="no-results" id="glossary-list-empty" hidden>No term matches your search.</p>
</div></section>

<section class="section band" id="faq"><div class="container">
<div class="section-head fade"><div class="eyebrow">FAQ</div><h2>Common questions</h2></div>
<div class="fade">''' + faq + '''</div>
</div></section>

<section class="section" id="news"><div class="container">
<div class="section-head fade"><div class="eyebrow">News</div><h2>Latest updates</h2></div>
<ul class="news fade">
<li><div class="when">In progress</div><div><h3>Online PCF calculators</h3><p>Ethylene and polyethylene calculators are being built for this website.</p></div></li>
<li><div class="when">October 2026</div><div><h3>Ethylene benchmark thresholds approved</h3><p>BEST, BETTER and GOOD thresholds for ethylene. Polyethylene thresholds remain in draft.</p></div></li>
<li><div class="when">July 2026</div><div><h3>Ethylene method revised</h3><p>The ethylene method was revised after international expert review and released for further review.</p></div></li>
<li><div class="when">2026</div><div><h3>Polyethylene method open for comments</h3><p>The draft polyethylene method is open for comments from stakeholders.</p></div></li>
</ul>
</div></section>
'''

TOPICS = [
 ("general", "help", "General question", "About BEST and how it works"),
 ("join", "users", "Join the initiative", "Producers, associations, partners"),
 ("review", "pen", "Review a method", "Comment on a draft"),
 ("document", "book", "Request a document", "Methods and guides"),
 ("verification", "check", "Verification", "Verifiers and certification bodies"),
 ("calculator", "calc", "Calculator support", "Questions on the PCF calculators"),
 ("datacenters", "server", "BEST Data Centers", "Interest in the next sector"),
]
topic_btns = "".join(f'<button class="topic-btn" type="button" data-topic="{v}" aria-pressed="false"><span class="reveal-icon">{ICON[ic]}</span><span><strong>{t}</strong><span>{d}</span></span></button>' for v, ic, t, d in TOPICS)
topic_opts = "".join(f'<option value="{v}">{t}</option>' for v, _, t, _ in TOPICS)
ROLES = ["Chemical producer", "Buyer or brand", "Researcher or academic", "Certification body or verifier", "Government or public agency", "Industry association", "Investor or financer", "Other"]
role_opts = '<option value="">Select…</option>' + "".join(f'<option>{r}</option>' for r in ROLES)

CONTACT = '''<section class="page-hero"><div class="container">
<div class="eyebrow">Contact</div>
<h1>Get in touch</h1>
<p class="lead">Questions, collaboration, a method review or a document request — choose a topic and send us a message.</p>
</div></section>
<section style="padding-bottom:40px"><div class="container contact-grid">
<div class="fade">
<p class="sub-h">What is it about?</p>
<div class="topics">''' + topic_btns + '''</div>
</div>
<form class="form fade" data-contact novalidate>
<div class="field"><label for="f-topic">Topic</label><select id="f-topic" name="topic">''' + topic_opts + '''</select></div>
<div class="two">
<div class="field"><label for="f-name">Name</label><input id="f-name" name="name" autocomplete="name" required><span class="err">Enter your name.</span></div>
<div class="field"><label for="f-org">Organisation</label><input id="f-org" name="organisation" autocomplete="organization" required><span class="err">Enter your organisation.</span></div>
</div>
<div class="two">
<div class="field"><label for="f-email">Email</label><input id="f-email" name="email" type="email" autocomplete="email" required><span class="err">Enter a valid email address.</span></div>
<div class="field"><label for="f-role">You are</label><select id="f-role" name="role" required>''' + role_opts + '''</select><span class="err">Select one option.</span></div>
</div>
<div class="field"><label for="f-message">Message</label><textarea id="f-message" name="message" required></textarea><span class="err">Write a short message.</span></div>
<label class="check"><input type="checkbox" required><span>I agree that BEST may use these details to reply to my message.</span><span class="err" style="display:none"></span></label>
<button class="btn btn-primary" type="submit">Send message</button>
<p class="form-msg" role="status"></p>
</form>
</div></section>
'''
