/* BEST site shell: shared header (with dropdowns), section sub-navigation and footer.
   Each page sets on <body>:
     data-root    path back to the site root ("" on the home page, "../" one folder down, "../../" two down)
     data-section top-level section id (about, chemicals, datacenters, tools, resources, contact)
     data-page    page id inside the section (e.g. chem-benchmarks)
     data-theme   optional sector theme: "chemicals" or "datacenters" (see tokens.css) */
(function () {
  var NAV = [
    { id: 'about', label: 'About', href: 'about/' },
    { id: 'chemicals', label: 'BEST Chemicals', href: 'chemicals/', theme: 'chem', mark: 'best-mark.svg', sector: 'Chemicals', children: [
      { id: 'chem-overview', label: 'Overview', href: 'chemicals/' },
      { id: 'chem-products', label: 'Products', href: 'chemicals/products/' },
      { id: 'chem-methodology', label: 'Methodology', href: 'chemicals/methodology/' },
      { id: 'chem-benchmarks', label: 'Benchmarks', href: 'chemicals/benchmarks/' },
      { id: 'chem-label', label: 'Label & Verification', href: 'chemicals/label-verification/' },
      { id: 'chem-calculator', label: 'PCF Calculator', href: 'chemicals/pcf-calculator/' }
    ] },
    { id: 'datacenters', label: 'BEST Data Centers', href: 'data-centers/', theme: 'dc', mark: 'best-mark-datacenters.svg', sector: 'Data Centers' },
    { id: 'tools', label: 'Tools', href: 'tools/', children: [
      { id: 'tools-overview', label: 'All tools', href: 'tools/' },
      { id: 'tools-ethylene', label: 'Ethylene PCF calculator', href: 'tools/ethylene-calculator/' },
      { id: 'tools-pe', label: 'Polyethylene PCF calculator', href: 'tools/polyethylene-calculator/' }
    ] },
    { id: 'resources', label: 'Resources', href: 'resources/' },
    { id: 'contact', label: 'Contact', href: 'contact/' }
  ];

  var body = document.body;
  var root = body.getAttribute('data-root') || '';
  var section = body.getAttribute('data-section') || '';
  var page = body.getAttribute('data-page') || '';
  var current = NAV.filter(function (n) { return n.id === section; })[0];

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function cur(id) { return id === page ? ' aria-current="page"' : ''; }

  /* ---------- Header ---------- */
  var items = NAV.map(function (n, i) {
    var cls = n.id === section ? ' class="is-current"' : '';
    if (!n.children) {
      return '<li' + cls + '><a href="' + root + n.href + '"' + (n.id === page || (n.id === section && !page) ? ' aria-current="page"' : '') + '>' + esc(n.label) + '</a></li>';
    }
    var subs = n.children.map(function (c) {
      return '<li><a href="' + root + c.href + '"' + cur(c.id) + '>' + esc(c.label) + '</a></li>';
    }).join('');
    return '<li' + cls + '><button class="nav-parent" type="button" aria-expanded="false" aria-controls="sub-' + i + '">' + esc(n.label) + '</button>' +
      '<ul class="sub' + (n.theme ? ' sub-' + n.theme : '') + '" id="sub-' + i + '">' + subs + '</ul></li>';
  }).join('');

  var brandMark = current && current.mark ? current.mark : 'best-mark.svg';
  var brandSector = current && current.sector ? '<span class="brand-sector">' + esc(current.sector) + '</span>' : '';

  var header = document.getElementById('site-header');
  if (header) {
    header.outerHTML =
      '<header class="site-header"><div class="container">' +
      '<a class="brand" href="' + root + '" aria-label="BEST home">' +
      '<img src="' + root + 'assets/img/' + brandMark + '" alt="" width="36" height="36">' +
      '<span class="brand-word">BEST</span>' + brandSector + '</a>' +
      '<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>' +
      '<nav class="site-nav" id="site-nav" aria-label="Main"><ul>' + items + '</ul></nav>' +
      '</div></header>';

    var toggle = document.querySelector('.nav-toggle');
    var nav = document.getElementById('site-nav');
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    var parents = Array.prototype.slice.call(document.querySelectorAll('.nav-parent'));
    function closeAll(except) {
      parents.forEach(function (p) {
        if (p === except) return;
        p.setAttribute('aria-expanded', 'false');
        document.getElementById(p.getAttribute('aria-controls')).classList.remove('open');
      });
    }
    parents.forEach(function (p) {
      p.addEventListener('click', function (e) {
        e.stopPropagation();
        var menu = document.getElementById(p.getAttribute('aria-controls'));
        var open = !menu.classList.contains('open');
        closeAll(p);
        menu.classList.toggle('open', open);
        p.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });
    document.addEventListener('click', function (e) { if (!nav.contains(e.target)) closeAll(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        var openParent = parents.filter(function (p) { return p.getAttribute('aria-expanded') === 'true'; })[0];
        closeAll();
        if (openParent) openParent.focus();
      }
    });
  }

  /* ---------- Section sub-navigation ---------- */
  var sectionNav = document.getElementById('section-nav');
  if (sectionNav && current && current.children) {
    var tabs = current.children.map(function (c) {
      return '<li><a href="' + root + c.href + '"' + cur(c.id) + '>' + esc(c.label) + '</a></li>';
    }).join('');
    var title = current.mark
      ? '<a class="section-nav-title" href="' + root + current.href + '"><img src="' + root + 'assets/img/' + current.mark + '" alt="" width="22" height="22">' + esc(current.label) + '</a>'
      : '<a class="section-nav-title" href="' + root + current.href + '">' + esc(current.label) + '</a>';
    sectionNav.outerHTML = '<nav class="section-nav" aria-label="' + esc(current.label) + '"><div class="container">' + title + '<ul>' + tabs + '</ul></div></nav>';
  }

  /* ---------- Reveal tiles: click to open / close ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('.reveal-btn'), function (btn) {
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.closest('.reveal-tile').classList.toggle('is-open', open);
    });
  });

  /* ---------- Footer ---------- */
  var footer = document.getElementById('site-footer');
  if (footer) {
    var year = new Date().getFullYear();
    function link(href, label) { return '<li><a href="' + root + href + '">' + label + '</a></li>'; }
    footer.outerHTML =
      '<footer class="site-footer"><div class="container">' +
      '<div class="footer-grid">' +
      '<div><div class="footer-brand"><img src="' + root + 'assets/img/best-mark-reversed.svg" alt="" width="40" height="40">' +
      '<span class="brand-word" style="color:#fff">BEST</span></div>' +
      '<p>Benchmarking &amp; Evaluation for Sustainability and Transparency — product carbon performance you can measure, compare and trust.</p></div>' +
      '<div><h2>Sectors</h2><ul>' + link('chemicals/', 'BEST Chemicals') + link('data-centers/', 'BEST Data Centers') + '</ul></div>' +
      '<div><h2>BEST Chemicals</h2><ul>' + link('chemicals/products/', 'Products') + link('chemicals/methodology/', 'Methodology') + link('chemicals/benchmarks/', 'Benchmarks') + link('chemicals/label-verification/', 'Label &amp; Verification') + link('chemicals/pcf-calculator/', 'PCF Calculator') + '</ul></div>' +
      '<div><h2>Initiative</h2><ul>' + link('about/', 'About') + link('tools/', 'Tools') + link('resources/', 'Resources') + link('contact/', 'Contact') + '</ul></div>' +
      '</div>' +
      '<div class="footer-legal">© ' + year + ' BEST Initiative. Methods and benchmarks shown as draft are subject to review.</div>' +
      '</div></footer>';
  }
})();
