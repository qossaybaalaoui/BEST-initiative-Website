/* BEST site shell: shared header, navigation and footer.
   Each page sets <body data-root="../" data-page="benchmarks"> so links work
   both on GitHub Pages (project sub-path) and locally. */
(function () {
  var NAV = [
    { id: 'about', label: 'About', href: 'about/' },
    { id: 'chemicals', label: 'Chemicals', href: 'chemicals/' },
    { id: 'methods', label: 'Methods', href: 'methods/' },
    { id: 'benchmarks', label: 'Benchmarks', href: 'benchmarks/' },
    { id: 'tools', label: 'Tools', href: 'tools/' },
    { id: 'verification', label: 'Label & Verification', href: 'verification/' },
    { id: 'value', label: 'Value & Policy', href: 'value/' },
    { id: 'resources', label: 'Resources', href: 'resources/' },
    { id: 'contact', label: 'Contact', href: 'contact/' }
  ];

  var body = document.body;
  var root = body.getAttribute('data-root') || '';
  var page = body.getAttribute('data-page') || '';

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var links = NAV.map(function (n) {
    var cur = n.id === page ? ' aria-current="page"' : '';
    return '<li><a href="' + root + n.href + '"' + cur + '>' + esc(n.label) + '</a></li>';
  }).join('');

  var header = document.getElementById('site-header');
  if (header) {
    header.outerHTML =
      '<header class="site-header"><div class="container">' +
      '<a class="brand" href="' + root + '" aria-label="BEST home">' +
      '<img src="' + root + 'assets/img/best-mark.svg" alt="" width="36" height="36">' +
      '<span class="brand-word">BEST</span></a>' +
      '<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>' +
      '<nav class="site-nav" id="site-nav" aria-label="Main"><ul>' + links + '</ul></nav>' +
      '</div></header>';
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.getElementById('site-nav');
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  var footer = document.getElementById('site-footer');
  if (footer) {
    var year = new Date().getFullYear();
    footer.outerHTML =
      '<footer class="site-footer"><div class="container">' +
      '<div class="footer-grid">' +
      '<div><div class="footer-brand"><img src="' + root + 'assets/img/best-mark-reversed.svg" alt="" width="40" height="40">' +
      '<span class="brand-word" style="color:#fff">BEST</span></div>' +
      '<p>Benchmarking &amp; Evaluation for Sustainability and Transparency — product carbon performance you can measure, compare and trust.</p></div>' +
      '<div><h2>Sectors</h2><ul><li><a href="' + root + 'chemicals/">Chemicals</a></li><li><a href="' + root + 'data-centers/">Data Centers</a></li></ul></div>' +
      '<div><h2>Work with BEST</h2><ul><li><a href="' + root + 'methods/">Methods</a></li><li><a href="' + root + 'benchmarks/">Benchmarks</a></li><li><a href="' + root + 'tools/">Calculators</a></li><li><a href="' + root + 'verification/">Label &amp; Verification</a></li></ul></div>' +
      '<div><h2>Initiative</h2><ul><li><a href="' + root + 'about/">About</a></li><li><a href="' + root + 'value/">Value &amp; Policy</a></li><li><a href="' + root + 'resources/">Resources</a></li><li><a href="' + root + 'contact/">Contact</a></li></ul></div>' +
      '</div>' +
      '<div class="footer-legal">© ' + year + ' BEST Initiative. Methods and benchmarks shown as draft are subject to review.</div>' +
      '</div></footer>';
  }
})();
