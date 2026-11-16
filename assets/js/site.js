/* BEST site shell: shared header (with dropdowns), section sub-navigation and footer.
   Each page sets on <body>:
     data-root    path back to the site root ("" on the home page, "../" one folder down, "../../" two down)
     data-section top-level section id (about, chemicals, datacenters, tools, resources, contact)
     data-page    page id inside the section (e.g. chem-benchmarks)
     data-theme   optional sector theme: "chemicals" or "datacenters" (see tokens.css) */
(function () {
  var NAV = [
    { id: 'about', label: 'About', href: 'about/' },
    { id: 'chemicals', label: 'BEST Chemicals', href: 'chemicals/', direct: true, theme: 'chem', mark: 'best-mark.svg', sector: 'Chemicals', children: [
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
    /* Sections marked "direct" open their overview page in one click;
       their sub-pages are reached from the section tab bar. */
    if (!n.children || n.direct) {
      var here = n.id === section && (!n.children || page === n.children[0].id || n.id === page);
      return '<li' + cls + '><a href="' + root + n.href + '"' + (here ? ' aria-current="page"' : '') + '>' + esc(n.label) + '</a></li>';
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

  /* ---------- Reveal tiles and "read more": click to open / close ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('.reveal-btn, .more-btn'), function (btn) {
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (panel) panel.classList.toggle('is-open', open);
      var tile = btn.closest('.reveal-tile');
      if (tile) tile.classList.toggle('is-open', open);
      if (btn.classList.contains('more-btn')) btn.firstChild.nodeValue = open ? 'Show less' : 'Read more';
    });
  });

  /* ---------- Steppers and tabs (role="tablist") ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('[role="tablist"]'), function (list) {
    var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
    function select(i, focus) {
      tabs.forEach(function (t, j) {
        var on = i === j;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        t.classList.toggle('done', j < i);
        panels[j].hidden = !on;
        if (on) { panels[j].classList.remove('fade-swap'); void panels[j].offsetWidth; panels[j].classList.add('fade-swap'); }
      });
      if (focus) tabs[i].focus();
      var root = list.parentNode;
      Array.prototype.forEach.call(root.querySelectorAll('[data-step]'), function (b) {
        var dir = b.getAttribute('data-step');
        b.disabled = dir === 'prev' ? i === 0 : i === tabs.length - 1;
      });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i); });
      t.addEventListener('keydown', function (e) {
        var k = e.key, n = tabs.length;
        if (k === 'ArrowRight' || k === 'ArrowDown') { e.preventDefault(); select((i + 1) % n, true); }
        if (k === 'ArrowLeft' || k === 'ArrowUp') { e.preventDefault(); select((i - 1 + n) % n, true); }
        if (k === 'Home') { e.preventDefault(); select(0, true); }
        if (k === 'End') { e.preventDefault(); select(n - 1, true); }
      });
    });
    Array.prototype.forEach.call(list.parentNode.querySelectorAll('[data-step]'), function (b) {
      b.addEventListener('click', function () {
        var cur = tabs.map(function (t) { return t.getAttribute('aria-selected') === 'true'; }).indexOf(true);
        select(b.getAttribute('data-step') === 'prev' ? Math.max(0, cur - 1) : Math.min(tabs.length - 1, cur + 1));
      });
    });
    select(0);
  });

  /* ---------- Carbon label demo: pick a tier ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-label-demo]'), function (demo) {
    var TIERS = {
      best: { pos: '12.5%', chip: 'tier-best', name: 'BEST', v: '1.10', text: 'Top band among comparable plants' },
      better: { pos: '37.5%', chip: 'tier-better', name: 'BETTER', v: '1.40', text: 'Better than the typical plant' },
      good: { pos: '62.5%', chip: 'tier-good', name: 'GOOD', v: '1.70', text: 'Within the range of comparable plants' },
      above: { pos: '87.5%', chip: 'tier-above', name: 'ABOVE RANGE', v: '2.30', text: 'Above the GOOD threshold' }
    };
    var marker = demo.querySelector('.cl-marker'), chip = demo.querySelector('.cl-chip'),
        value = demo.querySelector('.cl-value .v'), desc = demo.querySelector('.cl-desc');
    var buttons = demo.querySelectorAll('.tier-picker button');
    Array.prototype.forEach.call(buttons, function (b) {
      b.addEventListener('click', function () {
        var t = TIERS[b.getAttribute('data-tier')];
        Array.prototype.forEach.call(buttons, function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        marker.style.left = t.pos;
        chip.className = 'tier cl-chip ' + t.chip; chip.textContent = t.name;
        value.textContent = t.v; desc.textContent = t.text;
      });
    });
  });

  /* ---------- Benchmarks explorer ----------
     Thresholds come from the JSON block #bench-data on the page. */
  Array.prototype.forEach.call(document.querySelectorAll('[data-bench]'), function (box) {
    var data = JSON.parse(document.getElementById('bench-data').textContent);
    var tabs = box.querySelectorAll('[data-product]');
    var current = null;
    var $ = function (sel) { return box.querySelector(sel); };
    function pct(v) { return Math.max(0, Math.min(100, (v - current.axis[0]) / (current.axis[1] - current.axis[0]) * 100)); }
    function fmt(v) { return v.toFixed(3).replace(/0$/, ''); }
    function tierOf(v) {
      var t = current.thresholds;
      if (v <= t[0]) return ['best', 'BEST', 'At or below the BEST threshold.'];
      if (v <= t[1]) return ['better', 'BETTER', 'Above BEST, at or below the BETTER threshold.'];
      if (v <= t[2]) return ['good', 'GOOD', 'Above BETTER, at or below the GOOD threshold.'];
      return ['above', 'ABOVE RANGE', 'Above the GOOD threshold.'];
    }
    function show(key) {
      current = data[key];
      Array.prototype.forEach.call(tabs, function (t) { t.setAttribute('aria-selected', t.getAttribute('data-product') === key ? 'true' : 'false'); });
      $('.bench-name').textContent = current.name;
      $('.bench-scope').textContent = current.scope;
      var badge = $('.bench-badge');
      badge.className = 'bench-badge ' + (current.status === 'Approved' ? 'approved' : 'draft');
      badge.textContent = current.status === 'Approved' ? 'Approved · ' + current.date : 'Draft — not yet approved';
      var t = current.thresholds, p = [pct(t[0]), pct(t[1]), pct(t[2])];
      var z = box.querySelectorAll('.bench-bar span');
      z[0].style.width = p[0] + '%'; z[1].style.width = (p[1] - p[0]) + '%'; z[2].style.width = (p[2] - p[1]) + '%'; z[3].style.width = (100 - p[2]) + '%';
      var ticks = box.querySelectorAll('.bench-tick');
      ticks.forEach(function (tk, i) { tk.style.left = p[i] + '%'; tk.textContent = fmt(t[i]); });
      $('.ax-min').textContent = current.axis[0].toFixed(1); $('.ax-max').textContent = current.axis[1].toFixed(1) + ' t CO₂e/t';
      var leg = box.querySelectorAll('.bench-legend b');
      leg[0].textContent = '≤ ' + fmt(t[0]); leg[1].textContent = '≤ ' + fmt(t[1]); leg[2].textContent = '≤ ' + fmt(t[2]); leg[3].textContent = '> ' + fmt(t[2]);
      $('.bench-refs').innerHTML = current.refs;
      check();
    }
    var input = $('#bench-value'), out = $('.bench-result'), marker = $('.bench-marker');
    function check() {
      var raw = input.value.trim().replace(',', '.');
      var field = input.closest('.field');
      if (!raw) { marker.hidden = true; out.textContent = 'Enter a footprint to see where it falls.'; field.classList.remove('invalid'); return; }
      var v = parseFloat(raw);
      if (isNaN(v) || v < 0 || v > 50) { field.classList.add('invalid'); marker.hidden = true; out.textContent = ''; return; }
      field.classList.remove('invalid');
      var r = tierOf(v);
      marker.hidden = false; marker.style.left = pct(v) + '%';
      out.innerHTML = '<span class="tier tier-' + r[0] + '">' + r[1] + '</span>' + r[2] + (current.status === 'Approved' ? '' : ' Draft thresholds — indicative only.');
    }
    input.addEventListener('input', check);
    Array.prototype.forEach.call(tabs, function (t) { t.addEventListener('click', function () { show(t.getAttribute('data-product')); }); });
    show(tabs[0].getAttribute('data-product'));
  });

  /* ---------- Live filter (glossary) ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-filter]'), function (input) {
    var list = document.getElementById(input.getAttribute('data-filter'));
    var empty = document.getElementById(input.getAttribute('data-filter') + '-empty');
    input.addEventListener('input', function () {
      var q = input.value.trim().toLowerCase(), shown = 0;
      Array.prototype.forEach.call(list.children, function (item) {
        var hit = !q || item.textContent.toLowerCase().indexOf(q) !== -1;
        item.hidden = !hit; if (hit) shown++;
      });
      if (empty) empty.hidden = shown !== 0;
    });
  });

  /* ---------- Contact form ----------
     Set CONTACT_EMAIL to the initiative's address. Until then the form
     explains that sending is not configured yet. */
  var CONTACT_EMAIL = '';
  Array.prototype.forEach.call(document.querySelectorAll('form[data-contact]'), function (form) {
    var topic = form.querySelector('#f-topic');
    var params = new URLSearchParams(window.location.search);
    if (params.get('topic') && topic.querySelector('option[value="' + params.get('topic') + '"]')) topic.value = params.get('topic');
    var topicButtons = document.querySelectorAll('.topic-btn');
    function syncButtons() {
      Array.prototype.forEach.call(topicButtons, function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-topic') === topic.value ? 'true' : 'false'); });
    }
    Array.prototype.forEach.call(topicButtons, function (b) {
      b.addEventListener('click', function () { topic.value = b.getAttribute('data-topic'); syncButtons(); form.querySelector('#f-name').focus(); });
    });
    topic.addEventListener('change', syncButtons);
    syncButtons();
    Array.prototype.forEach.call(form.querySelectorAll('[required]'), function (el) {
      el.addEventListener('input', function () { el.closest('.field, .check').classList.remove('invalid'); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true, first = null;
      Array.prototype.forEach.call(form.querySelectorAll('[required]'), function (el) {
        var bad = el.type === 'checkbox' ? !el.checked : !el.value.trim() || (el.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(el.value.trim()));
        el.closest('.field, .check').classList.toggle('invalid', bad);
        if (bad) { ok = false; if (!first) first = el; }
      });
      if (!ok) { first.focus(); return; }
      var msg = form.querySelector('.form-msg');
      if (!CONTACT_EMAIL) {
        msg.textContent = 'Thank you. Online sending is being set up — please try again soon.';
        msg.classList.add('show'); return;
      }
      var f = function (id) { return form.querySelector(id).value.trim(); };
      var subject = '[BEST] ' + topic.options[topic.selectedIndex].text + ' — ' + f('#f-org');
      var bodyText = f('#f-message') + '\n\n' + f('#f-name') + '\n' + f('#f-org') + ' (' + form.querySelector('#f-role').value + ')\n' + f('#f-email');
      window.location.href = 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(bodyText);
      msg.textContent = 'Your email app should open with the message ready to send.';
      msg.classList.add('show');
    });
  });

  /* ---------- Gentle fade-in on scroll ---------- */
  var fades = document.querySelectorAll('.fade, .sub-card');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in-view'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    Array.prototype.forEach.call(fades, function (el) { io.observe(el); });
  } else {
    Array.prototype.forEach.call(fades, function (el) { el.classList.add('in-view'); });
  }

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
