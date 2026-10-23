/* Arang Batok Kelapa Lampung — shared core (main page + spec sheet):
   i18n engine, number/country formatting, product helpers, WhatsApp/mail links,
   toasts and the SVG product illustrations. Exposes window.App. */
(function () {
  'use strict';

  var SITE = window.SITE;
  var I18N = window.I18N || (window.I18N = {});
  var html = document.documentElement;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var store = {
    get: function (key, fallback) {
      try { var v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
    },
    set: function (key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage blocked: keep working without it */ }
    }
  };

  var ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ESC[c]; }); }

  /* ---------------------------------------------------------------- i18n -- */
  var CODES = SITE.languages.map(function (l) { return l.code; });
  var lang = CODES.indexOf(html.lang) > -1 ? html.lang : 'en';
  var domDefaults = {};
  var listeners = [];
  var readyQueue = [];
  var isReady = false;
  var tokenCache = {};

  function norm(s) { return s.replace(/\s+/g, ' ').trim(); }
  function attrPairs(el) {
    return el.getAttribute('data-i18n-attr').split(';')
      .map(function (p) { return p.split(':').map(function (x) { return x.trim(); }); })
      .filter(function (p) { return p.length === 2 && p[0] && p[1]; });
  }

  // English for static text lives in the HTML; remember it before translating.
  function collectDefaults(root) {
    $$('[data-i18n]', root).forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      if (!(k in domDefaults)) domDefaults[k] = norm(el.textContent);
    });
    $$('[data-i18n-html]', root).forEach(function (el) {
      var k = el.getAttribute('data-i18n-html');
      if (!(k in domDefaults)) domDefaults[k] = norm(el.innerHTML);
    });
    $$('[data-i18n-attr]', root).forEach(function (el) {
      attrPairs(el).forEach(function (p) { if (!(p[1] in domDefaults)) domDefaults[p[1]] = el.getAttribute(p[0]) || ''; });
    });
  }

  function lookup(key, code) {
    var d = I18N[code];
    return d && Object.prototype.hasOwnProperty.call(d, key) ? d[key] : undefined;
  }
  function raw(key, code) {
    var v = lookup(key, code || lang);
    if (v === undefined) v = lookup(key, 'en');
    if (v === undefined) v = domDefaults[key];
    return v === undefined ? key : v;
  }
  function fill(str, vars) {
    return String(str).replace(/\{(\w+)\}/g, function (m, k) { return vars && vars[k] != null ? vars[k] : m; });
  }

  function numLocale(code) { code = code || lang; return code === 'ar' ? 'ar-u-nu-latn' : code; }
  function fmtNum(n, opts, code) {
    try { return new Intl.NumberFormat(numLocale(code), opts || { maximumFractionDigits: 1 }).format(n); } catch (e) { return String(n); }
  }
  function range(a) { return a[0] === a[1] ? String(a[0]) : a[0] + '–' + a[1]; }

  function tokens(code) {
    code = code || lang;
    if (tokenCache[code]) return tokenCache[code];
    var tr = SITE.trade, p = featured();
    tokenCache[code] = {
      deposit: tr.depositPct,
      trial: tr.trialMt,
      lead: range(tr.leadWeeks),
      plWeeks: range(tr.privateLabelWeeks),
      sampleKg: range(tr.sampleKg),
      sampleDays: range(tr.sampleDays),
      hs: tr.hsCode,
      load20: fmtNum(p.loadKg['20ft'] / 1000, null, code),
      load40: fmtNum(p.loadKg['40hc'] / 1000, null, code),
      moq: fill(raw('moq.text', code), { n: tr.moqContainers, type: tr.moqType, mt: fmtNum(tr.moqKg / 1000, null, code) }),
      h: SITE.office.replyHours,
      company: SITE.company.name,
      year: new Date().getFullYear()
    };
    return tokenCache[code];
  }
  function t(key, vars) { return fill(raw(key), Object.assign({}, tokens(), vars)); }
  function tEn(key, vars) { return fill(raw(key, 'en'), Object.assign({}, tokens('en'), vars)); }

  function applyStatic(root) {
    var tok = tokens();
    $$('[data-i18n]', root).forEach(function (el) { el.textContent = fill(raw(el.getAttribute('data-i18n')), tok); });
    $$('[data-i18n-html]', root).forEach(function (el) { el.innerHTML = fill(raw(el.getAttribute('data-i18n-html')), tok); });
    $$('[data-i18n-attr]', root).forEach(function (el) {
      attrPairs(el).forEach(function (p) { el.setAttribute(p[0], fill(raw(p[1]), tok)); });
    });
  }

  var FONTS = {
    ru: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500..800;1,400..700&display=swap',
    ar: 'https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap',
    zh: 'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@500;600;700&display=swap'
  };
  function ensureFont(code) {
    if (!FONTS[code] || $('link[data-font="' + code + '"]')) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = FONTS[code];
    l.setAttribute('data-font', code);
    document.head.appendChild(l);
  }

  var pending = {};
  function loadLang(code) {
    if (code === 'en' || I18N[code]) return Promise.resolve();
    if (!pending[code]) {
      pending[code] = new Promise(function (resolve) {
        var s = document.createElement('script');
        s.src = (window.I18N_BASE || 'assets/js/i18n/') + code + '.js';
        s.onload = s.onerror = function () { resolve(); };
        document.head.appendChild(s);
      });
    }
    return pending[code];
  }

  function setLang(code, opts) {
    opts = opts || {};
    if (CODES.indexOf(code) < 0) code = 'en';
    ensureFont(code);
    return loadLang(code).then(function () {
      if (code !== 'en' && !I18N[code]) code = 'en';
      lang = code;
      tokenCache = {};
      var meta = SITE.languages.filter(function (l) { return l.code === code; })[0];
      html.lang = code;
      html.dir = meta ? meta.dir : 'ltr';
      applyStatic();
      listeners.slice().forEach(function (fn) { try { fn(code); } catch (e) { console.error(e); } });
      try { localStorage.setItem('abkl.lang', code); } catch (e) { /* ignore */ }
      if (!opts.keepUrl) {
        try {
          var u = new URL(location.href);
          if (code === 'en') u.searchParams.delete('lang'); else u.searchParams.set('lang', code);
          history.replaceState(history.state, '', u.toString());
        } catch (e) { /* file:// or sandboxed */ }
      }
      html.classList.remove('i18n-pending');
    });
  }
  function onLang(fn) { listeners.push(fn); }
  function ready(fn) { if (isReady) fn(lang); else readyQueue.push(fn); }

  /* ------------------------------------------------------------ products -- */
  function featured() { return SITE.products.filter(function (p) { return p.featured; })[0] || SITE.products[0]; }
  function findProduct(id) { return SITE.products.filter(function (p) { return p.id === id; })[0] || SITE.products[0]; }
  function defaultVariant(p) { return p.variants.filter(function (v) { return v.default; })[0] || p.variants[0]; }
  function findVariant(p, id) { return p.variants.filter(function (v) { return v.id === id; })[0] || defaultVariant(p); }
  function tr(code) { return code === 'en' ? tEn : t; }
  function specVal(v, code) { return typeof v === 'string' && v.charAt(0) === '@' ? tr(code)(v.slice(1)) : v; }
  function productName(p, code) { return tr(code)('prod.' + p.id + '.name'); }
  function variantLabel(v, code) { return tr(code)('kind.' + v.kind) + ' ' + v.size; }
  function packKg(id) {
    var k = SITE.packaging[id];
    if (!k) return 10;
    return k.type === 'inner' ? k.innerKg * k.count : k.kg;
  }
  function packLabel(id, code) {
    var k = SITE.packaging[id], f = tr(code);
    if (!k) return id;
    switch (k.type) {
      case 'inner': return f('pack.inner', { inner: k.innerKg, count: k.count, master: k.innerKg * k.count });
      case 'bulk': return f('pack.bulk', { kg: k.kg });
      case 'carton': return f('pack.carton', { kg: k.kg });
      case 'bag': return f('pack.bag', { kg: k.kg });
      case 'jumbo': return f('pack.jumbo', { kg: fmtNum(k.kg, null, code) });
      default: return id;
    }
  }
  function packUnitKey(id) {
    var k = SITE.packaging[id];
    if (k && k.type === 'bag') return 'unit.bags';
    if (k && k.type === 'jumbo') return 'unit.jumbo';
    return 'unit.cartons';
  }

  var dnCache = {};
  function countryName(cc, code) {
    code = code || lang;
    try {
      if (!dnCache[code]) dnCache[code] = new Intl.DisplayNames([code], { type: 'region' });
      return dnCache[code].of(cc) || cc;
    } catch (e) { return cc; }
  }

  /* ------------------------------------------------------- contact links -- */
  function waNumber() { return String(SITE.company.whatsapp || '').replace(/\D/g, ''); }
  function waLink(text) { return 'https://wa.me/' + waNumber() + (text ? '?text=' + encodeURIComponent(text) : ''); }
  function openWhatsApp(text) { window.open(waLink(text), '_blank', 'noopener'); }
  function mailLink(subject, body) {
    return 'mailto:' + SITE.company.email + '?subject=' + encodeURIComponent(subject || '') + '&body=' + encodeURIComponent(body || '');
  }
  function openMail(subject, body) {
    var a = document.createElement('a');
    a.href = mailLink(subject, body);
    a.click();
  }
  function track(name, props) {
    try {
      if (window.plausible) window.plausible(name, { props: props });
      if (window.gtag) window.gtag('event', name, props);
    } catch (e) { /* analytics is optional */ }
  }

  /* -------------------------------------------------------------- toasts -- */
  function toast(msg, action) {
    var box = $('#toasts');
    if (!box) {
      box = document.createElement('div');
      box.id = 'toasts';
      box.className = 'toasts';
      box.setAttribute('aria-live', 'polite');
      document.body.appendChild(box);
    }
    var el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    el.innerHTML = '<svg class="icon"><use href="#i-check"/></svg><span></span>';
    el.querySelector('span').textContent = msg;
    var dismiss = function () {
      if (el.classList.contains('is-leaving')) return;
      el.classList.add('is-leaving');
      setTimeout(function () { el.remove(); }, 300);
    };
    if (action) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'toast__action';
      b.textContent = action.label;
      b.addEventListener('click', function () { action.onClick(); dismiss(); });
      el.appendChild(b);
    }
    box.appendChild(el);
    while (box.children.length > 3) box.firstChild.remove();
    setTimeout(dismiss, action ? 5200 : 3400);
  }

  /* ------------------------------------------------------- illustrations -- */
  function P(pts) { return pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '); }

  function grainDefs(uid) {
    return '<pattern id="' + uid + '-g" width="7" height="7" patternUnits="userSpaceOnUse">' +
      '<circle cx="1.5" cy="1.5" r=".7" fill="rgba(255,255,255,.07)"/><circle cx="5" cy="4.6" r=".7" fill="rgba(0,0,0,.28)"/></pattern>' +
      '<radialGradient id="' + uid + '-glow"><stop offset="0" stop-color="#ff7a1a" stop-opacity=".5"/><stop offset="1" stop-color="#ff7a1a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="' + uid + '-sh"><stop offset="0" stop-color="#000" stop-opacity=".6"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>';
  }

  function cubeArt(uid) {
    var s = 50, w = s * 0.866, h = s * 0.5;
    var pieces = [
      { i: 0, j: 0, k: 0 }, { i: 0, j: 0, k: 1 }, { i: 1, j: 0, k: 0 }, { i: 0, j: 1, k: 0 },
      { i: 1, j: 1, k: 0, hot: true }, { i: 1, j: 2, k: 0, height: 0.66 }
    ];
    var body = '';
    pieces.forEach(function (c) {
      var H = s * (c.height || 1);
      var cx = 160 + (c.i - c.j) * w;
      var cy = 84 + (c.i + c.j) * h - c.k * s + (s - H);
      var T = [[cx, cy - h], [cx + w, cy], [cx, cy + h], [cx - w, cy]];
      var L = [[cx - w, cy], [cx, cy + h], [cx, cy + h + H], [cx - w, cy + H]];
      var R = [[cx, cy + h], [cx + w, cy], [cx + w, cy + H], [cx, cy + h + H]];
      var f = c.hot ? ['ht', 'hl', 'hr'] : ['t', 'l', 'r'];
      body += '<polygon points="' + P(L) + '" fill="url(#' + uid + '-' + f[1] + ')"/>' +
        '<polygon points="' + P(R) + '" fill="url(#' + uid + '-' + f[2] + ')"/>' +
        '<polygon points="' + P(T) + '" fill="url(#' + uid + '-' + f[0] + ')"/>' +
        '<polygon points="' + P(L) + ' ' + P(R) + '" fill="url(#' + uid + '-g)"/>' +
        '<polygon points="' + P(T) + '" fill="url(#' + uid + '-g)"/>' +
        '<path d="M' + P([T[3]]) + ' L' + P([T[0]]) + ' L' + P([T[1]]) + '" fill="none" stroke="rgba(255,240,220,' + (c.hot ? 0.55 : 0.18) + ')"/>' +
        '<path d="M' + P([T[2]]) + ' L' + P([[cx, cy + h + H]]) + '" stroke="rgba(255,240,220,' + (c.hot ? 0.4 : 0.1) + ')"/>';
      if (c.hot) {
        body += '<circle cx="' + (cx - 8) + '" cy="' + (cy - 3) + '" r="1.3" fill="#fff" opacity=".7"/>' +
          '<circle cx="' + (cx + 7) + '" cy="' + (cy + 3) + '" r="1" fill="#fff" opacity=".6"/>' +
          '<circle cx="' + cx + '" cy="' + (cy - 8) + '" r=".9" fill="#fff" opacity=".55"/>';
      }
    });
    return '<svg viewBox="0 0 320 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>' +
      '<linearGradient id="' + uid + '-t" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4d453f"/><stop offset="1" stop-color="#2c2723"/></linearGradient>' +
      '<linearGradient id="' + uid + '-l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#28231f"/><stop offset="1" stop-color="#151210"/></linearGradient>' +
      '<linearGradient id="' + uid + '-r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c1815"/><stop offset="1" stop-color="#0d0b0a"/></linearGradient>' +
      '<radialGradient id="' + uid + '-ht" cx=".5" cy=".5" r=".62"><stop offset="0" stop-color="#fff4da"/><stop offset=".32" stop-color="#ffc47c"/><stop offset=".72" stop-color="#e5621c"/><stop offset="1" stop-color="#8f2e0c"/></radialGradient>' +
      '<linearGradient id="' + uid + '-hl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9d40"/><stop offset=".55" stop-color="#d4450c"/><stop offset="1" stop-color="#4c1506"/></linearGradient>' +
      '<linearGradient id="' + uid + '-hr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ea6c20"/><stop offset=".6" stop-color="#a5330a"/><stop offset="1" stop-color="#360f05"/></linearGradient>' +
      grainDefs(uid) + '</defs>' +
      '<ellipse cx="160" cy="216" rx="128" ry="18" fill="url(#' + uid + '-sh)"/>' +
      '<ellipse cx="160" cy="176" rx="96" ry="54" fill="url(#' + uid + '-glow)"/>' + body +
      '<circle cx="148" cy="104" r="1.6" fill="#ffb36b" opacity=".85"/><circle cx="176" cy="92" r="1.1" fill="#ffd6a8" opacity=".7"/><circle cx="162" cy="70" r="1.3" fill="#ff8a3d" opacity=".55"/>' +
      '</svg>';
  }

  function hexArt(uid) {
    var r = 36, D = [70, -40];
    var pieces = [{ cx: 87, cy: 170 }, { cx: 164.4, cy: 170 }, { cx: 125.7, cy: 111.7, hot: true }];
    var shade = { 0: 's0', 4: 's4', 5: 's5' };
    var body = '';
    pieces.forEach(function (pc) {
      var pts = [0, 1, 2, 3, 4, 5].map(function (k) { return [pc.cx + r * Math.cos(k * Math.PI / 3), pc.cy + r * Math.sin(k * Math.PI / 3)]; });
      [4, 5, 0].forEach(function (k) {
        var a = pts[k], b = pts[(k + 1) % 6];
        var q = [a, b, [b[0] + D[0], b[1] + D[1]], [a[0] + D[0], a[1] + D[1]]];
        body += '<polygon points="' + P(q) + '" fill="url(#' + uid + '-' + shade[k] + ')"/><polygon points="' + P(q) + '" fill="url(#' + uid + '-g)"/>';
      });
      if (pc.hot) body += '<ellipse cx="' + pc.cx + '" cy="' + pc.cy + '" rx="70" ry="52" fill="url(#' + uid + '-glow)"/>';
      body += '<polygon points="' + P(pts) + '" fill="url(#' + uid + '-f)" stroke="rgba(255,240,220,.16)"/>' +
        '<polygon points="' + P(pts) + '" fill="url(#' + uid + '-g)"/>' +
        '<circle cx="' + pc.cx.toFixed(1) + '" cy="' + pc.cy.toFixed(1) + '" r="' + (r * 0.3).toFixed(1) + '" fill="url(#' + uid + '-' + (pc.hot ? 'hh' : 'h') + ')"/>';
    });
    return '<svg viewBox="0 0 320 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>' +
      '<linearGradient id="' + uid + '-s4" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#4a423c"/><stop offset="1" stop-color="#2a2420"/></linearGradient>' +
      '<linearGradient id="' + uid + '-s5" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#2c2622"/><stop offset="1" stop-color="#181412"/></linearGradient>' +
      '<linearGradient id="' + uid + '-s0" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#1d1916"/><stop offset="1" stop-color="#0d0b0a"/></linearGradient>' +
      '<radialGradient id="' + uid + '-f" cx=".42" cy=".38" r=".75"><stop offset="0" stop-color="#3a342f"/><stop offset="1" stop-color="#141110"/></radialGradient>' +
      '<radialGradient id="' + uid + '-h"><stop offset="0" stop-color="#030202"/><stop offset=".7" stop-color="#0c0a09"/><stop offset="1" stop-color="#2a2420"/></radialGradient>' +
      '<radialGradient id="' + uid + '-hh"><stop offset="0" stop-color="#fff2cc"/><stop offset=".4" stop-color="#ff8f2e"/><stop offset=".8" stop-color="#a5330a"/><stop offset="1" stop-color="#2c0e05"/></radialGradient>' +
      grainDefs(uid) + '</defs>' +
      '<ellipse cx="160" cy="214" rx="130" ry="16" fill="url(#' + uid + '-sh)"/>' + body + '</svg>';
  }

  function lumpArt(uid) {
    var shardPath = 'M-30 4C-22-14 18-18 32-2 30 12 12 20-4 19-20 18-32 14-30 4Z';
    var shards = [
      [252, 132, -28, 0.8, 0], [214, 124, 12, 0.78, 1], [190, 142, 6, 0.86, 1], [226, 148, -18, 1.05, 0],
      [172, 164, 20, 0.92, 1], [244, 168, 14, 1.0, 1], [204, 176, -8, 1.25, 0], [168, 192, -20, 0.72, 0], [246, 194, 25, 0.68, 1]
    ];
    var body = '';
    shards.forEach(function (s) {
      body += '<g transform="translate(' + s[0] + ' ' + s[1] + ') rotate(' + s[2] + ') scale(' + s[3] + ')">' +
        '<path d="' + shardPath + '" fill="url(#' + uid + '-p' + (s[4] ? 'l' : 'd') + ')"/>' +
        '<path d="' + shardPath + '" fill="url(#' + uid + '-g)"/>' +
        '<path d="M-30 4C-22-14 18-18 32-2" fill="none" stroke="rgba(255,240,220,.24)" stroke-width="1.2"/></g>';
    });
    var granules = [[138, 206, 3], [150, 213, 2.4], [264, 210, 3], [278, 201, 2], [126, 214, 2], [286, 214, 2.6], [112, 206, 1.8]];
    granules.forEach(function (g) { body += '<circle cx="' + g[0] + '" cy="' + g[1] + '" r="' + g[2] + '" fill="#26211d"/>'; });
    return '<svg viewBox="0 0 320 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>' +
      '<radialGradient id="' + uid + '-pl" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#57504a"/><stop offset=".55" stop-color="#2a2521"/><stop offset="1" stop-color="#121010"/></radialGradient>' +
      '<radialGradient id="' + uid + '-pd" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#3d3732"/><stop offset=".6" stop-color="#1c1815"/><stop offset="1" stop-color="#0b0a09"/></radialGradient>' +
      '<linearGradient id="' + uid + '-shell" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a4f2c"/><stop offset=".55" stop-color="#4a2e19"/><stop offset="1" stop-color="#1f130b"/></linearGradient>' +
      '<radialGradient id="' + uid + '-in" cx=".5" cy=".3" r=".8"><stop offset="0" stop-color="#2a1a10"/><stop offset="1" stop-color="#0d0805"/></radialGradient>' +
      grainDefs(uid) + '</defs>' +
      '<ellipse cx="170" cy="214" rx="140" ry="16" fill="url(#' + uid + '-sh)"/>' +
      '<ellipse cx="214" cy="168" rx="92" ry="56" fill="url(#' + uid + '-glow)" opacity=".55"/>' +
      '<path d="M36 142C38 196 68 212 90 212 114 212 140 196 142 142Z" fill="url(#' + uid + '-shell)"/>' +
      '<path d="M36 142C38 196 68 212 90 212 114 212 140 196 142 142Z" fill="url(#' + uid + '-g)"/>' +
      '<path d="M44 162C60 178 86 184 122 172M46 180C64 196 98 198 128 184M58 198C76 208 102 208 120 198" fill="none" stroke="rgba(255,220,180,.13)" stroke-width="1.3"/>' +
      '<ellipse cx="89" cy="142" rx="53" ry="15" fill="#140d08" stroke="#9a6534" stroke-width="3"/>' +
      '<ellipse cx="89" cy="144" rx="44" ry="10" fill="url(#' + uid + '-in)"/>' +
      body + '</svg>';
  }

  var counter = 0;
  function illustration(shape) {
    var uid = 'il' + (++counter);
    if (shape === 'hex') return hexArt(uid);
    if (shape === 'lump') return lumpArt(uid);
    return cubeArt(uid);
  }

  /* --------------------------------------------------------------- boot -- */
  function boot() {
    collectDefaults(document);
    var fromUrl = new URLSearchParams(location.search).get('lang');
    setLang(lang, { keepUrl: !fromUrl }).then(function () {
      isReady = true;
      readyQueue.splice(0).forEach(function (fn) { try { fn(lang); } catch (e) { console.error(e); } });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  window.App = {
    SITE: SITE, $: $, $$: $$, esc: esc, store: store,
    t: t, tEn: tEn, fill: fill, setLang: setLang, onLang: onLang, ready: ready, applyStatic: applyStatic,
    fmtNum: fmtNum, numLocale: numLocale, range: range,
    featured: featured, findProduct: findProduct, defaultVariant: defaultVariant, findVariant: findVariant,
    specVal: specVal, productName: productName, variantLabel: variantLabel, packLabel: packLabel, packKg: packKg, packUnitKey: packUnitKey,
    countryName: countryName, waNumber: waNumber, waLink: waLink, openWhatsApp: openWhatsApp, mailLink: mailLink, openMail: openMail,
    track: track, toast: toast, illustration: illustration
  };
  Object.defineProperty(window.App, 'lang', { get: function () { return lang; } });
})();
