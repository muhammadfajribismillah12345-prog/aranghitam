/* Arang Batok Kelapa Lampung — main page UI.
   Header & navigation, language menus, products & spec dialog, quality meters,
   FAQ, quote basket & RFQ form, office clock, video-call scheduler, SEO data. */
(function () {
  'use strict';

  var App = window.App;
  var SITE = App.SITE, $ = App.$, $$ = App.$$, t = App.t, tEn = App.tEn, esc = App.esc, fmtNum = App.fmtNum;
  var reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SPEC_ORDER = ['moisture', 'ash', 'ashColor', 'fixedCarbon', 'volatile', 'calorific', 'burnTime', 'smell', 'binder'];
  var SHAPE_ICON = { cube: 'i-cube', hex: 'i-hex', lump: 'i-layers' };

  function scrollToId(id) {
    var el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }
  function scrollToQuote() { scrollToId('quote'); }

  /* ---------------------------------------------------------- quote basket -- */
  var basketListeners = [];
  var basket = {
    items: (App.store.get('abkl.quote', []) || []).filter(function (it) { return it && it.product && SITE.products.some(function (p) { return p.id === it.product; }); }),
    add: function (item) {
      item.id = 'q' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      this.items.push(item);
      this.changed();
    },
    remove: function (id) { this.items = this.items.filter(function (i) { return i.id !== id; }); this.changed(); },
    clear: function () { this.items = []; this.changed(); },
    changed: function () {
      App.store.set('abkl.quote', this.items);
      basketListeners.forEach(function (fn) { fn(); });
    }
  };

  function itemText(it, code) {
    var p = App.findProduct(it.product), v = App.findVariant(p, it.variant);
    var qty = it.unit === 'mt'
      ? fmtNum(it.qty, { maximumFractionDigits: 1 }, code) + ' MT'
      : fmtNum(it.qty, { maximumFractionDigits: 0 }, code) + ' × ' + (it.unit === '40hc' ? '40ft HC' : '20ft');
    return {
      title: App.productName(p, code) + ' — ' + App.variantLabel(v, code),
      sub: qty + ' · ' + App.packLabel(it.pack, code),
      icon: SHAPE_ICON[p.shape] || 'i-cube'
    };
  }

  function addItem(opts) {
    var p = App.findProduct(opts.product);
    var item = {
      product: p.id,
      variant: opts.variant || App.defaultVariant(p).id,
      pack: opts.pack && p.packaging.indexOf(opts.pack) > -1 ? opts.pack : p.packaging[0],
      qty: opts.qty || SITE.trade.moqContainers || 1,
      unit: opts.unit || (SITE.trade.moqType === '40hc' ? '40hc' : '20ft')
    };
    if (opts.note) item.note = opts.note;
    basket.add(item);
    App.toast(opts.message || t('prod.added', { item: itemText(item).title }), { label: t('prod.view'), onClick: scrollToQuote });
    $$('.quote-count').forEach(function (el) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); });
    App.track('add_to_quote', { product: item.product, variant: item.variant });
    return item;
  }

  /* ---------------------------------------------------------------- header -- */
  function initHeader() {
    var header = $('#siteHeader'), bar = $('#mobileBar'), wa = $('.wa-float');
    var lastY = window.scrollY;
    function onScroll() {
      var y = window.scrollY;
      header.classList.toggle('is-scrolled', y > 24);
      if (!header.classList.contains('menu-open')) {
        if (y > 700 && y > lastY + 6) header.classList.add('is-hidden');
        else if (y < lastY - 6 || y < 700) header.classList.remove('is-hidden');
      }
      if (bar) bar.classList.toggle('is-visible', y > 480);
      if (wa) {
        var q = $('#quote').getBoundingClientRect();
        wa.classList.toggle('is-hidden', q.top < innerHeight * 0.6 && q.bottom > 0);
      }
      lastY = y;
    }
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    var toggle = $('.menu-toggle'), menu = $('#mobileMenu');
    function setMenu(open) {
      toggle.setAttribute('aria-expanded', String(open));
      menu.hidden = !open;
      header.classList.toggle('menu-open', open);
      header.classList.remove('is-hidden');
      document.body.style.overflow = open ? 'hidden' : '';
    }
    toggle.addEventListener('click', function () { setMenu(menu.hidden); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });
    addEventListener('resize', function () { if (innerWidth > 1180 && !menu.hidden) setMenu(false); });

    // scrollspy
    var links = $$('.nav__list a');
    if ('IntersectionObserver' in window) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          links.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id); });
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      links.forEach(function (a) { var s = $(a.getAttribute('href')); if (s) spy.observe(s); });
    }
  }

  /* ---------------------------------------------------------------- reveal -- */
  var revealIO = null;
  function initReveal() {
    if ('IntersectionObserver' in window) {
      revealIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('is-in'); revealIO.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    }
    observeReveal(document);
  }
  function observeReveal(root) {
    $$('.reveal:not(.is-in)', root).forEach(function (el) {
      if (!revealIO) { el.classList.add('is-in'); return; }
      var sibs = Array.prototype.filter.call(el.parentElement.children, function (c) { return c.classList.contains('reveal'); });
      var i = sibs.indexOf(el);
      if (i > 0) el.style.setProperty('--d', (Math.min(i, 6) * 0.07) + 's');
      revealIO.observe(el);
    });
  }

  /* ------------------------------------------------------------- languages -- */
  function initLanguages() {
    var wrap = $('#langSwitcher'), btn = $('.lang__btn', wrap), menu = $('.lang__menu', wrap);
    menu.innerHTML = SITE.languages.map(function (l) {
      return '<li role="none"><button type="button" role="menuitem" data-lang="' + l.code + '" lang="' + l.code + '"><span>' + esc(l.name) + '</span><small>' + l.code.toUpperCase() + '</small></button></li>';
    }).join('');
    var pills = SITE.languages.map(function (l) {
      return '<button type="button" data-lang="' + l.code + '" lang="' + l.code + '">' + esc(l.name) + '</button>';
    }).join('');
    $('#mobileLangs').innerHTML = pills;
    $('#footerLangs').innerHTML = pills;

    function setOpen(open) { wrap.classList.toggle('is-open', open); btn.setAttribute('aria-expanded', String(open)); }
    btn.addEventListener('click', function (e) { e.stopPropagation(); setOpen(!wrap.classList.contains('is-open')); });
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-lang]');
      if (b) { setOpen(false); if (b.getAttribute('data-lang') !== App.lang) App.setLang(b.getAttribute('data-lang')); return; }
      if (!e.target.closest('#langSwitcher')) setOpen(false);
    });
    addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
    function mark() {
      $('.lang__code', wrap).textContent = App.lang.toUpperCase();
      $$('[data-lang]').forEach(function (b) { b.setAttribute('aria-current', String(b.getAttribute('data-lang') === App.lang)); });
    }
    mark();
    App.onLang(mark);
  }

  /* --------------------------------------------------------------- contact -- */
  function greeting() {
    return 'Hello ' + SITE.company.name + ', I am interested in your coconut shell charcoal. Could you share your price list and specifications? (Sent from your website)';
  }
  function initContacts() {
    var c = SITE.company;
    $$('.js-email').forEach(function (el) { el.textContent = c.email; });
    $$('[data-contact="email"]').forEach(function (a) { a.href = 'mailto:' + c.email; });
    $$('.js-address').forEach(function (el) { el.textContent = c.address; });
    $$('.js-hs').forEach(function (el) { el.textContent = SITE.trade.hsCode; });
    if (c.phone) {
      $$('.js-phone').forEach(function (el) { el.textContent = c.phone; });
      $$('.js-phone-row').forEach(function (el) { el.hidden = false; });
      $$('[data-contact="phone"]').forEach(function (a) { a.href = 'tel:' + c.phone.replace(/[^\d+]/g, ''); });
    }
    if (App.waNumber()) {
      $$('.js-wa-display').forEach(function (el) { el.removeAttribute('data-i18n'); el.textContent = c.phone || '+' + App.waNumber(); });
    }
    $$('[data-contact="whatsapp"]').forEach(function (a) {
      a.href = App.waLink();
      a.target = '_blank';
      a.rel = 'noopener';
      a.addEventListener('click', function (e) {
        e.preventDefault();
        if (!App.waNumber()) App.toast(t('rfq.demoWa'));
        App.openWhatsApp(greeting());
        App.track('whatsapp_click', { place: a.className.split(' ')[0] });
      });
    });

    var ribbon = $('#demoRibbon');
    if (SITE.demoMode && ribbon) {
      var dismissed = false;
      try { dismissed = sessionStorage.getItem('abkl.demo') === '1'; } catch (e) { /* ignore */ }
      if (!dismissed) {
        ribbon.hidden = false;
        $('.demo-ribbon__close', ribbon).addEventListener('click', function () {
          ribbon.hidden = true;
          try { sessionStorage.setItem('abkl.demo', '1'); } catch (e) { /* ignore */ }
        });
      }
    }

    var mapBtn = $('#mapLoad');
    if (mapBtn) mapBtn.addEventListener('click', function () {
      var q = encodeURIComponent(c.mapsQuery || c.address);
      $('#mapCard').innerHTML =
        '<iframe title="Google Maps — ' + esc(c.address) + '" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://maps.google.com/maps?q=' + q + '&z=10&output=embed"></iframe>' +
        '<a class="map-card__btn" href="https://www.google.com/maps/search/?api=1&query=' + q + '" target="_blank" rel="noopener"><svg class="icon"><use href="#i-external"/></svg><span>' + esc(t('map.open')) + '</span></a>';
    });
  }

  /* ------------------------------------------------------- hero & strip -- */
  function renderHero() {
    var p = App.featured(), v = App.defaultVariant(p);
    $$('[data-spec]').forEach(function (el) { var k = el.getAttribute('data-spec'); if (p.specs[k]) el.textContent = App.specVal(p.specs[k]); });
    var chip = $('#heroSpecChip');
    if (chip) {
      chip.innerHTML = '<strong>' + esc(App.variantLabel(v)) + '</strong><span>' +
        (v.pcsPerKg ? '<bdi>' + esc(t('prod.pcsKg', { n: v.pcsPerKg })) + '</bdi> · ' : '') +
        esc(t('spec.ash')) + ' <bdi>' + esc(p.specs.ash) + '</bdi></span>';
    }
  }
  function renderPorts() {
    var names = SITE.ports.map(function (p) { return p.name; });
    var one = names.map(function (n) { return '<span class="marquee__item">' + esc(n) + '</span>'; }).join('');
    $('#portsMarquee').innerHTML = one + one;
    $('#portList').innerHTML = SITE.ports.map(function (p) {
      return '<option value="' + esc(p.name + ', ' + App.countryName(p.cc)) + '"></option>';
    }).join('');
  }

  /* -------------------------------------------------------------- products -- */
  var cardSel = {};
  function media(p) {
    return p.image
      ? '<img src="' + esc(p.image) + '" alt="' + esc(App.productName(p)) + '" loading="lazy">'
      : App.illustration(p.shape);
  }
  function vchip(name, value, label, checked) {
    return '<label class="vchip"><input type="radio" name="' + name + '" value="' + esc(value) + '"' + (checked ? ' checked' : '') + '><span>' + esc(label) + '</span></label>';
  }
  function pcsLine(v) { return v.dims + (v.pcsPerKg ? ' · ' + t('prod.pcsKg', { n: v.pcsPerKg }) : ''); }
  function keySpecs(p) {
    return ['ash', 'burnTime', 'fixedCarbon', 'moisture'].filter(function (k) { return p.specs[k]; }).slice(0, 3);
  }

  function renderProducts(rerender) {
    var grid = $('#productGrid');
    grid.innerHTML = SITE.products.map(function (p) {
      var sel = cardSel[p.id] || App.defaultVariant(p).id;
      var v = App.findVariant(p, sel);
      return '<article class="product reveal" data-product="' + p.id + '">' +
        '<div class="product__media"><span class="product__shape"><svg class="icon"><use href="#' + (SHAPE_ICON[p.shape] || 'i-cube') + '"/></svg>' +
        esc(t('prod.options', { n: p.variants.length })) + '</span>' + media(p) + '</div>' +
        '<div class="product__body">' +
        '<p class="product__tag">' + esc(t('prod.' + p.id + '.tag')) + '</p>' +
        '<h3 class="product__name">' + esc(App.productName(p)) + '</h3>' +
        '<p class="product__desc">' + esc(t('prod.' + p.id + '.desc')) + '</p>' +
        '<dl class="product__keys">' + keySpecs(p).map(function (k) {
          return '<div><dt>' + esc(t('spec.' + k)) + '</dt><dd dir="ltr">' + esc(App.specVal(p.specs[k])) + '</dd></div>';
        }).join('') + '</dl>' +
        '<div class="vchips" role="radiogroup" aria-label="' + esc(t('prod.variant')) + '">' +
        p.variants.map(function (x) { return vchip('v-' + p.id, x.id, App.variantLabel(x), x.id === v.id); }).join('') + '</div>' +
        '<p class="product__pcs" dir="auto">' + esc(pcsLine(v)) + '</p>' +
        '<div class="product__actions">' +
        '<button type="button" class="btn btn--ghost btn--sm" data-act="details"><svg class="icon"><use href="#i-doc"/></svg><span>' + esc(t('prod.details')) + '</span></button>' +
        '<button type="button" class="btn btn--primary btn--sm" data-act="add"><svg class="icon"><use href="#i-plus"/></svg><span>' + esc(t('prod.add')) + '</span></button>' +
        '</div></div></article>';
    }).join('');
    if (rerender) $$('.product', grid).forEach(function (c) { c.classList.add('is-in'); });
    else observeReveal(grid);
  }

  function initProducts() {
    var grid = $('#productGrid');
    grid.addEventListener('change', function (e) {
      var card = e.target.closest('.product');
      if (!card || e.target.type !== 'radio') return;
      var p = App.findProduct(card.getAttribute('data-product'));
      cardSel[p.id] = e.target.value;
      $('.product__pcs', card).textContent = pcsLine(App.findVariant(p, e.target.value));
    });
    grid.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]');
      if (!b) return;
      var card = b.closest('.product'), id = card.getAttribute('data-product');
      var vid = cardSel[id] || App.defaultVariant(App.findProduct(id)).id;
      if (b.getAttribute('data-act') === 'details') openProduct(id, vid);
      else addItem({ product: id, variant: vid });
    });
    renderProducts(false);
    App.onLang(function () { renderProducts(true); });
  }

  /* product dialog */
  var dlg = null, dlgState = null;
  function openProduct(id, variantId) {
    var p = App.findProduct(id);
    dlgState = { id: p.id, variant: variantId || App.defaultVariant(p).id, pack: p.packaging[0] };
    renderDialog();
    if (!dlg.open) {
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    }
    App.track('view_product', { product: p.id });
  }
  function renderDialog() {
    var p = App.findProduct(dlgState.id), v = App.findVariant(p, dlgState.variant);
    var rows = [[t('spec.size'), v.dims]];
    if (v.pcsPerKg) rows.push([t('spec.pcsPerKg'), '≈ ' + v.pcsPerKg]);
    SPEC_ORDER.forEach(function (k) { if (p.specs[k]) rows.push([t('spec.' + k), App.specVal(p.specs[k])]); });
    var uses = t('prod.' + p.id + '.uses').split(' · ');
    var sheetUrl = 'spec-sheet.html?p=' + p.id + '&v=' + v.id + '&lang=' + App.lang;
    $('#productDialogBody').innerHTML =
      '<button type="button" class="pd-close" data-close aria-label="' + esc(t('common.close')) + '"><svg class="icon"><use href="#i-x"/></svg></button>' +
      '<div class="pd-media">' + media(p) + '</div>' +
      '<div class="pd-content">' +
      '<div><p class="product__tag">' + esc(t('prod.' + p.id + '.tag')) + '</p><h2 class="pd-title" id="pdTitle">' + esc(App.productName(p)) + '</h2></div>' +
      '<p class="pd-desc">' + esc(t('prod.' + p.id + '.desc')) + '</p>' +
      '<div class="pd-block"><h4>' + esc(t('prod.variant')) + '</h4><div class="vchips">' +
      p.variants.map(function (x) { return vchip('pdv', x.id, App.variantLabel(x), x.id === v.id); }).join('') + '</div></div>' +
      '<div class="pd-block"><h4>' + esc(t('prod.specs')) + '</h4><table class="spec-table"><tbody>' +
      rows.map(function (r) { return '<tr><th scope="row">' + esc(r[0]) + '</th><td><bdi>' + esc(r[1]) + '</bdi></td></tr>'; }).join('') +
      '</tbody></table><p class="note"><svg class="icon"><use href="#i-info"/></svg><span>' + esc(t('prod.typical')) + '</span></p></div>' +
      '<div class="pd-block"><h4>' + esc(t('prod.packaging')) + '</h4><div class="vchips">' +
      p.packaging.map(function (k) { return vchip('pdk', k, App.packLabel(k), k === dlgState.pack); }).join('') + '</div></div>' +
      '<div class="pd-block"><h4>' + esc(t('prod.loading')) + '</h4><div class="pd-load">' +
      '<div><span>20ft</span><strong><bdi>≈ ' + fmtNum(p.loadKg['20ft'] / 1000) + ' MT</bdi></strong></div>' +
      '<div><span>40ft HC</span><strong><bdi>≈ ' + fmtNum(p.loadKg['40hc'] / 1000) + ' MT</bdi></strong></div></div></div>' +
      '<div class="pd-block"><h4>' + esc(t('prod.uses')) + '</h4><ul class="pd-list">' +
      uses.map(function (u) { return '<li>' + esc(u) + '</li>'; }).join('') + '</ul></div>' +
      '<div class="pd-actions">' +
      '<button type="button" class="btn btn--primary" data-act="add"><svg class="icon"><use href="#i-plus"/></svg><span>' + esc(t('prod.add')) + '</span></button>' +
      '<a class="btn btn--ghost" href="' + sheetUrl + '" target="_blank" rel="noopener"><svg class="icon"><use href="#i-download"/></svg><span>' + esc(t('prod.sheet')) + '</span></a>' +
      '<button type="button" class="btn btn--wa" data-act="wa"><svg class="icon"><use href="#i-whatsapp"/></svg><span>' + esc(t('prod.ask')) + '</span></button>' +
      '</div></div>';
  }
  function initDialog() {
    dlg = $('#productDialog');
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg || e.target.closest('[data-close]')) { dlg.close(); return; }
      var act = e.target.closest('[data-act]');
      if (!act) return;
      var p = App.findProduct(dlgState.id), v = App.findVariant(p, dlgState.variant);
      if (act.getAttribute('data-act') === 'add') {
        addItem({ product: p.id, variant: v.id, pack: dlgState.pack });
        dlg.close();
      } else if (act.getAttribute('data-act') === 'wa') {
        if (!App.waNumber()) App.toast(t('rfq.demoWa'));
        App.openWhatsApp('Hello ' + SITE.company.name + ', please send me the price and full specifications for ' +
          App.productName(p, 'en') + ' — ' + App.variantLabel(v, 'en') + ' (' + App.packLabel(dlgState.pack, 'en') + '). (Sent from your website)');
      }
    });
    dlg.addEventListener('change', function (e) {
      if (e.target.name === 'pdv') {
        dlgState.variant = e.target.value;
        renderDialog();
        var r = $('input[name="pdv"]:checked', dlg);
        if (r) r.focus();
      } else if (e.target.name === 'pdk') {
        dlgState.pack = e.target.value;
      }
    });
    App.onLang(function () { if (dlg.open) renderDialog(); });
    document.addEventListener('click', function (e) {
      var a = e.target.closest('[data-open-product]');
      if (!a) return;
      e.preventDefault();
      openProduct(a.getAttribute('data-open-product'));
    });
  }

  /* --------------------------------------------------------------- quality -- */
  var METERS = [
    { key: 'ash', min: 0, max: 6, better: 'low', unit: '%', icon: 'i-ash' },
    { key: 'moisture', min: 0, max: 15, better: 'low', unit: '%', icon: 'i-drop' },
    { key: 'fixedCarbon', min: 50, max: 90, better: 'high', unit: '%', icon: 'i-flame' },
    { key: 'calorific', min: 5000, max: 8000, better: 'high', unit: '', icon: 'i-thermo' },
    { key: 'burnTime', min: 0, max: 4, better: 'high', unit: ' h', icon: 'i-clock' }
  ];
  function specNumber(str, better) {
    var nums = (String(str).match(/\d[\d,]*\.?\d*/g) || []).map(function (s) { return parseFloat(s.replace(/,/g, '')); });
    if (!nums.length) return null;
    return better === 'low' ? Math.max.apply(null, nums) : Math.min.apply(null, nums);
  }
  // "≥ 7,000 kcal/kg" → number in display type, unit set smaller so long values fit
  function valueHtml(str) {
    var m = /^(.*?\d)\s+([A-Za-z/]+)$/.exec(String(str));
    return m ? esc(m[1]) + ' <small>' + esc(m[2]) + '</small>' : esc(str);
  }
  var meterIO = null;
  function renderMeters() {
    var p = App.featured(), box = $('#qualityMeters');
    box.innerHTML = METERS.filter(function (m) { return p.specs[m.key]; }).map(function (m) {
      var val = specNumber(p.specs[m.key], m.better);
      var pct = val == null ? 0 : Math.max(2, Math.min(100, (val - m.min) / (m.max - m.min) * 100));
      return '<div class="meter meter--' + m.better + ' reveal" data-pct="' + pct.toFixed(1) + '">' +
        '<div class="meter__head"><p class="meter__name"><svg class="icon"><use href="#' + m.icon + '"/></svg>' + esc(t('meter.' + m.key + '.t')) + '</p>' +
        '<p class="meter__value" dir="ltr">' + valueHtml(p.specs[m.key]) + '</p></div>' +
        '<div class="meter__body"><div class="meter__track"><span class="meter__fill"></span><span class="meter__knob"></span></div>' +
        '<div class="meter__scale"><span dir="ltr">' + fmtNum(m.min) + m.unit + '</span><span class="meter__better">' +
        esc(t(m.better === 'low' ? 'meter.lower' : 'meter.higher')) + '</span><span dir="ltr">' + fmtNum(m.max) + m.unit + '</span></div>' +
        '<p class="meter__desc">' + esc(t('meter.' + m.key + '.d')) + '</p></div></div>';
    }).join('');
    observeReveal(box);
    $$('.meter', box).forEach(function (el) {
      if (meterIO) meterIO.observe(el); else fillMeter(el);
    });
  }
  function fillMeter(el) {
    var pct = el.getAttribute('data-pct') + '%';
    $('.meter__fill', el).style.width = pct;
    $('.meter__knob', el).style.insetInlineStart = pct;
  }
  function initQuality() {
    if ('IntersectionObserver' in window) {
      meterIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { setTimeout(function () { fillMeter(en.target); }, 250); meterIO.unobserve(en.target); }
        });
      }, { threshold: 0.4 });
    }
    renderMeters();
    App.onLang(function () { renderMeters(); $$('#qualityMeters .meter').forEach(function (el) { el.classList.add('is-in'); fillMeter(el); }); });
  }

  /* ------------------------------------------------------------------- FAQ -- */
  var FAQ_COUNT = 13;
  function highlight(text, q) {
    var safe = esc(text);
    if (!q) return safe;
    var re = new RegExp('(' + esc(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    return safe.replace(re, '<mark>$1</mark>');
  }
  function renderFaq() {
    var q = $('#faqSearch').value.trim();
    var ql = q.toLowerCase(), shown = 0;
    var open = $('.faq-item[open]');
    var openN = open ? open.getAttribute('data-n') : null;
    $('#faqList').innerHTML = Array.apply(null, { length: FAQ_COUNT }).map(function (_, i) {
      var n = i + 1, qq = t('faq.' + n + '.q'), aa = t('faq.' + n + '.a');
      var hit = !ql || (qq + ' ' + aa).toLowerCase().indexOf(ql) > -1;
      if (hit) shown++;
      return '<details class="faq-item" name="faq" data-n="' + n + '"' + (hit ? '' : ' hidden') + (String(n) === openN || (ql && hit && shown === 1) ? ' open' : '') + '>' +
        '<summary><span>' + highlight(qq, q) + '</span><span class="faq-item__icon" aria-hidden="true"><svg class="icon icon--sm"><use href="#i-plus"/></svg></span></summary>' +
        '<div class="faq-item__a"><p>' + highlight(aa, q) + '</p></div></details>';
    }).join('');
    $('#faqEmpty').hidden = shown > 0;
  }
  function initFaq() {
    var input = $('#faqSearch'), timer = null;
    input.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(renderFaq, 120); });
    renderFaq();
    App.onLang(renderFaq);
  }

  /* ----------------------------------------------------------------- RFQ -- */
  var COUNTRIES = ('AD AE AF AG AI AL AM AO AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BW BY BZ ' +
    'CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR ' +
    'GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP ' +
    'KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ ' +
    'NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW ' +
    'SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TG TH TJ TK TL TM TN TO TR TT TV TW TZ ' +
    'UA UG US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW').split(' ');
  var INTRO = {
    quote: 'I would like to request a price quotation.',
    samples: 'I would like to request free samples.',
    private: 'I am interested in private-label (OEM) production.',
    call: 'I would like to schedule a video call / factory tour.',
    other: 'I have a question about your products.'
  };
  var lastMessage = '';

  function guessCountry() {
    var langs = (navigator.languages || [navigator.language || '']);
    for (var i = 0; i < langs.length; i++) {
      var m = /-([A-Z]{2})\b/i.exec(langs[i] || '');
      if (m && COUNTRIES.indexOf(m[1].toUpperCase()) > -1) return m[1].toUpperCase();
    }
    return '';
  }

  function initRfq() {
    var form = $('#rfqForm');
    var F = function (id) { return document.getElementById(id); };
    var val = function (name) { var r = form.querySelector('input[name="' + name + '"]:checked'); return r ? r.value : ''; };
    var FIELDS = ['rfqPort', 'rfqPay', 'rfqBrand', 'rfqName', 'rfqCompany', 'rfqEmail', 'rfqPhone', 'rfqMessage'];
    var draft = App.store.get('abkl.rfq', {}) || {};

    function saveDraft() {
      var d = {};
      FIELDS.forEach(function (id) { d[id] = F(id).value; });
      d.rfqMonth = F('rfqMonth').value;
      d.rfqCountry = F('rfqCountry').value;
      d.type = val('type');
      d.incoterm = val('incoterm');
      d.samples = F('rfqSamples').checked;
      d.pl = F('rfqPl').checked;
      draft = d;
      App.store.set('abkl.rfq', d);
    }

    function renderInco() {
      var cur = val('incoterm') || draft.incoterm || (SITE.trade.incoterms.indexOf('CIF') > -1 ? 'CIF' : SITE.trade.incoterms[0]);
      F('rfqInco').innerHTML = SITE.trade.incoterms.map(function (c) {
        return '<label class="chip"><input type="radio" name="incoterm" value="' + c + '"' + (c === cur ? ' checked' : '') + '><span>' + c + '</span></label>';
      }).join('');
    }
    function renderMonths() {
      var sel = F('rfqMonth'), cur = sel.value || draft.rfqMonth || '';
      var now = new Date(), opts = ['<option value="">' + esc(t('rfq.asap')) + '</option>'];
      var fmt = new Intl.DateTimeFormat(App.numLocale(), { month: 'long', year: 'numeric' });
      for (var i = 1; i <= 12; i++) {
        var d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        var v = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
        opts.push('<option value="' + v + '">' + esc(fmt.format(d)) + '</option>');
      }
      sel.innerHTML = opts.join('');
      sel.value = cur;
      if (sel.value !== cur) sel.value = '';
    }
    function renderCountries() {
      var sel = F('rfqCountry'), cur = sel.value || draft.rfqCountry || guessCountry();
      var list = COUNTRIES.map(function (cc) { return [cc, App.countryName(cc)]; });
      try { list.sort(function (a, b) { return a[1].localeCompare(b[1], App.lang); }); } catch (e) { /* ignore */ }
      sel.innerHTML = '<option value="">' + esc(t('rfq.countryPh')) + '</option>' +
        list.map(function (c) { return '<option value="' + c[0] + '">' + esc(c[1]) + '</option>'; }).join('');
      sel.value = cur;
    }
    function fillVariants() {
      var p = App.findProduct(F('addProduct').value);
      var vCur = F('addVariant').value, kCur = F('addPack').value;
      F('addVariant').innerHTML = p.variants.map(function (v) { return '<option value="' + v.id + '">' + esc(App.variantLabel(v)) + '</option>'; }).join('');
      F('addVariant').value = p.variants.some(function (v) { return v.id === vCur; }) ? vCur : App.defaultVariant(p).id;
      F('addPack').innerHTML = p.packaging.map(function (k) { return '<option value="' + k + '">' + esc(App.packLabel(k)) + '</option>'; }).join('');
      F('addPack').value = p.packaging.indexOf(kCur) > -1 ? kCur : p.packaging[0];
    }
    function renderAddRow() {
      var ps = F('addProduct'), cur = ps.value || SITE.products[0].id;
      ps.innerHTML = SITE.products.map(function (p) { return '<option value="' + p.id + '">' + esc(App.productName(p)) + '</option>'; }).join('');
      ps.value = cur;
      fillVariants();
    }
    function renderBasket() {
      var ul = F('basket');
      if (!basket.items.length) {
        ul.innerHTML = '<li class="basket__empty">' + esc(t('rfq.empty')) + '</li>';
      } else {
        ul.innerHTML = basket.items.map(function (it) {
          var x = itemText(it);
          return '<li class="basket__item" data-id="' + it.id + '"><svg class="icon"><use href="#' + x.icon + '"/></svg>' +
            '<div class="basket__text"><strong>' + esc(x.title) + '</strong><small>' + esc(x.sub) + (it.note ? ' · ' + esc(it.note) : '') + '</small></div>' +
            '<button type="button" class="basket__remove" aria-label="' + esc(t('common.remove')) + '"><svg class="icon"><use href="#i-x"/></svg></button></li>';
        }).join('');
      }
      $$('.quote-count').forEach(function (el) { el.hidden = !basket.items.length; el.textContent = basket.items.length; });
      updatePreview();
    }

    function monthEn(v) {
      var parts = v.split('-');
      return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date(+parts[0], +parts[1] - 1, 1));
    }
    function subject() {
      var type = val('type') || 'quote';
      var map = { quote: 'Price quotation request', samples: 'Sample request', private: 'Private label inquiry', call: 'Video call request', other: 'Inquiry' };
      var company = F('rfqCompany').value.trim();
      return map[type] + ' — coconut shell charcoal' + (company ? ' — ' + company : '');
    }
    function compose() {
      var L = ['Hello ' + SITE.company.name + ' team,', '', INTRO[val('type')] || INTRO.quote, ''];
      if (basket.items.length) {
        L.push('PRODUCTS');
        basket.items.forEach(function (it, i) {
          var x = itemText(it, 'en');
          L.push((i + 1) + '. ' + x.title, '   ' + x.sub);
          if (it.note) L.push('   ' + it.note);
        });
        L.push('');
      }
      L.push('DELIVERY');
      L.push('Incoterm: ' + (val('incoterm') || '-'));
      var port = F('rfqPort').value.trim();
      if (port) L.push('Destination port: ' + port);
      var m = F('rfqMonth').value;
      L.push('Target shipment: ' + (m ? monthEn(m) : 'As soon as possible'));
      L.push('Payment: ' + F('rfqPay').value);
      if (F('rfqSamples').checked) L.push('Samples: please send samples first');
      if (F('rfqPl').checked) L.push('Private label: yes' + (F('rfqBrand').value.trim() ? ' — ' + F('rfqBrand').value.trim() : ''));
      var msg = F('rfqMessage').value.trim();
      if (msg) L.push('', 'MESSAGE', msg);
      L.push('', 'CONTACT');
      L.push('Name: ' + F('rfqName').value.trim());
      L.push('Company: ' + F('rfqCompany').value.trim());
      var cc = F('rfqCountry').value;
      L.push('Country: ' + (cc ? App.countryName(cc, 'en') : '-'));
      L.push('Email: ' + F('rfqEmail').value.trim());
      var ph = F('rfqPhone').value.trim();
      if (ph) L.push('WhatsApp / phone: ' + ph);
      L.push('', '— Sent from ' + (location.host || 'the website') + ' (' + App.lang.toUpperCase() + ')');
      return L.join('\n');
    }
    function updatePreview() { F('rfqPreview').textContent = compose(); }

    function validate() {
      var errs = [], bad = [];
      ['rfqName', 'rfqCompany', 'rfqCountry', 'rfqEmail'].forEach(function (id) {
        var el = F(id), ok = !!el.value.trim();
        el.classList.toggle('is-invalid', !ok);
        if (!ok) bad.push(el);
      });
      if (bad.length) errs.push(t('rfq.err.required'));
      var em = F('rfqEmail'), ev = em.value.trim();
      if (ev && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(ev)) { em.classList.add('is-invalid'); bad.push(em); errs.push(t('rfq.err.email')); }
      var type = val('type');
      if (['quote', 'samples', 'private'].indexOf(type) > -1 && !basket.items.length && F('rfqMessage').value.trim().length < 8) {
        errs.push(t('rfq.err.items'));
        bad.push(F('addProduct'));
      }
      var box = F('rfqError');
      box.hidden = !errs.length;
      box.textContent = errs.join(' ');
      if (bad.length) bad[0].focus();
      return !errs.length;
    }
    function done(channel) {
      F('rfqDone').hidden = false;
      F('rfqDone').focus({ preventScroll: true });
      F('rfqDone').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      App.track('inquiry', { channel: channel, items: basket.items.length, type: val('type') });
    }
    function copy(text) {
      var ok = function () { App.toast(t('rfq.copied')); };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(ok, function () { legacyCopy(text); ok(); });
      } else { legacyCopy(text); ok(); }
    }
    function legacyCopy(text) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e) { /* ignore */ }
      ta.remove();
    }
    function onType(v) {
      if (v === 'samples') F('rfqSamples').checked = true;
      if (v === 'private') { F('rfqPl').checked = true; F('rfqBrandRow').hidden = false; }
      if (v === 'call') flashScheduler();
    }

    // events
    form.addEventListener('change', function (e) {
      if (e.target.name === 'type') onType(e.target.value);
      if (e.target.id === 'rfqPl') F('rfqBrandRow').hidden = !e.target.checked;
      if (e.target.id === 'addProduct') fillVariants();
      saveDraft();
      updatePreview();
    });
    form.addEventListener('input', function (e) {
      if (e.target.classList.contains('is-invalid') && e.target.value.trim()) e.target.classList.remove('is-invalid');
      saveDraft();
      updatePreview();
    });
    F('basket').addEventListener('click', function (e) {
      var b = e.target.closest('.basket__remove');
      if (!b) return;
      basket.remove(b.closest('.basket__item').getAttribute('data-id'));
      App.toast(t('rfq.removed'));
    });
    F('addBtn').addEventListener('click', function () {
      var qty = parseFloat(F('addQty').value);
      addItem({ product: F('addProduct').value, variant: F('addVariant').value, pack: F('addPack').value, qty: qty > 0 ? qty : 1, unit: F('addUnit').value });
      F('rfqError').hidden = true;
    });
    form.addEventListener('click', function (e) {
      var b = e.target.closest('[data-send]');
      if (!b) return;
      if (F('rfqHp').value) return;
      if (!validate()) return;
      var text = compose(), channel = b.getAttribute('data-send');
      lastMessage = text;
      if (channel === 'whatsapp') {
        App.toast(App.waNumber() ? t('rfq.waOpened') : t('rfq.demoWa'));
        App.openWhatsApp(text);
        done('whatsapp');
      } else if (channel === 'email') {
        App.openMail(subject(), text);
        App.toast(t('rfq.mailOpened'));
        done('email');
      } else if (channel === 'form' && SITE.formEndpoint) {
        b.disabled = true;
        var payload = {
          name: F('rfqName').value.trim(), email: F('rfqEmail').value.trim(), company: F('rfqCompany').value.trim(),
          country: App.countryName(F('rfqCountry').value, 'en'), phone: F('rfqPhone').value.trim(),
          subject: subject(), _subject: subject(), message: text
        };
        if (SITE.formAccessKey) payload.access_key = SITE.formAccessKey;
        fetch(SITE.formEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload)
        }).then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          App.toast(t('rfq.sent'));
          done('form');
        }).catch(function () { App.toast(t('rfq.failed')); })
          .then(function () { b.disabled = false; });
      }
    });
    F('rfqCopy').addEventListener('click', function () { copy(compose()); });
    F('rfqCopy2').addEventListener('click', function () { copy(lastMessage || compose()); });
    F('rfqNew').addEventListener('click', function () {
      F('rfqDone').hidden = true;
      basket.clear();
      F('rfqMessage').value = '';
      saveDraft();
      updatePreview();
    });

    // restore draft
    FIELDS.forEach(function (id) { if (draft[id] != null) F(id).value = draft[id]; });
    if (draft.type) { var r = form.querySelector('input[name="type"][value="' + draft.type + '"]'); if (r) r.checked = true; }
    F('rfqSamples').checked = !!draft.samples;
    F('rfqPl').checked = !!draft.pl;
    F('rfqBrandRow').hidden = !draft.pl;
    var sendForm = $('[data-send="form"]', form);
    sendForm.hidden = !SITE.formEndpoint;

    function renderAll() { renderInco(); renderMonths(); renderCountries(); renderAddRow(); renderBasket(); }
    renderAll();
    App.onLang(renderAll);
    basketListeners.push(renderBasket);

    App.prefill = function (o) {
      if (o.type) {
        var tr = form.querySelector('input[name="type"][value="' + o.type + '"]');
        if (tr) { tr.checked = true; onType(o.type); }
      }
      if (o.incoterm) { var ir = form.querySelector('input[name="incoterm"][value="' + o.incoterm + '"]'); if (ir) ir.checked = true; }
      if (o.port != null) F('rfqPort').value = o.port;
      if (o.samples) F('rfqSamples').checked = true;
      if (o.brand != null) { F('rfqPl').checked = true; F('rfqBrandRow').hidden = false; F('rfqBrand').value = o.brand; }
      saveDraft();
      updatePreview();
    };
    App.formValue = function (id) { return F(id) ? F(id).value.trim() : ''; };
  }

  function flashScheduler() {
    var s = $('#scheduler');
    if (!s) return;
    s.classList.remove('is-flash');
    void s.offsetWidth;
    s.classList.add('is-flash');
  }

  function initIntents() {
    document.addEventListener('click', function (e) {
      var el = e.target.closest('[data-intent]');
      if (!el || !App.prefill) return;
      var intent = el.getAttribute('data-intent');
      if (intent === 'samples') App.prefill({ type: 'samples', samples: true });
      else if (intent === 'call') { App.prefill({ type: 'call' }); setTimeout(flashScheduler, 700); }
    });
  }

  /* ------------------------------------------------------- office & clock -- */
  function toMin(s) { var p = s.split(':'); return +p[0] * 60 + +p[1]; }
  function officeNow() {
    var o = SITE.office;
    var parts = new Intl.DateTimeFormat('en-US', { timeZone: o.timeZone, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    var get = function (ty) { return (parts.filter(function (p) { return p.type === ty; })[0] || {}).value; };
    return { day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday')), mins: (+get('hour') % 24) * 60 + +get('minute') };
  }
  function officeState() {
    var o = SITE.office, now = officeNow(), open = toMin(o.open), close = toMin(o.close);
    var isOpen = o.days.indexOf(now.day) > -1 && now.mins >= open && now.mins < close;
    var until = 0;
    if (!isOpen) {
      for (var d = 0; d < 8; d++) {
        var di = (now.day + d) % 7;
        if (o.days.indexOf(di) < 0 || (d === 0 && now.mins >= open)) continue;
        until = d * 1440 + open - now.mins;
        break;
      }
    }
    return { isOpen: isOpen, until: until };
  }
  function duration(mins) {
    var h = Math.floor(mins / 60), m = mins % 60, out = [];
    try {
      if (h) out.push(new Intl.NumberFormat(App.numLocale(), { style: 'unit', unit: 'hour', unitDisplay: 'short' }).format(h));
      if (m || !h) out.push(new Intl.NumberFormat(App.numLocale(), { style: 'unit', unit: 'minute', unitDisplay: 'short' }).format(m));
    } catch (e) { out = [h + 'h', m + 'm']; }
    return out.join(' ');
  }
  function hoursLine() {
    var o = SITE.office, days = o.days.slice().sort();
    var dn = function (d) { return new Intl.DateTimeFormat(App.lang, { weekday: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2023, 0, 1 + d))); };
    var contiguous = days.every(function (d, i) { return i === 0 || d === days[i - 1] + 1; });
    var dayStr = contiguous && days.length > 2 ? dn(days[0]) + ' – ' + dn(days[days.length - 1]) : days.map(dn).join(', ');
    return dayStr + ' · ' + o.open + ' – ' + o.close + ' (UTC+' + o.utcOffset + ')';
  }
  function initClock() {
    var o = SITE.office;
    var youTz = '';
    try { youTz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { /* ignore */ }
    function render() {
      var now = new Date();
      var fmt = function (tz) {
        try { return new Intl.DateTimeFormat(App.numLocale(), { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: tz }).format(now); } catch (e) { return '--:--'; }
      };
      var st = officeState(), local = fmt(o.timeZone);
      var msg = st.isOpen ? t('status.open') : t('status.closed', { time: duration(st.until) });
      var top = $('#officeStatus');
      top.classList.toggle('is-open', st.isOpen);
      $('.office-status__text', top).textContent = msg + ' · ' + t('status.local', { time: local });
      var cs = $('#clockStatus');
      if (cs) {
        cs.classList.toggle('is-open', st.isOpen);
        cs.lastElementChild.textContent = msg;
        $('#clockLampung').textContent = local;
        $('#clockYou').textContent = fmt(undefined);
        $('#clockYouTz').textContent = youTz.replace(/_/g, ' ');
        $('#clockHours').textContent = hoursLine();
      }
    }
    render();
    setInterval(render, 20000);
    App.onLang(render);
  }

  /* ------------------------------------------------------------ scheduler -- */
  function initScheduler() {
    var o = SITE.office, sel = { day: null, slot: null };
    var youTz = '';
    try { youTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch (e) { youTz = 'UTC'; }
    var brk = o.breakTime ? [toMin(o.breakTime[0]), toMin(o.breakTime[1])] : null;

    function collect() {
      var nowMs = Date.now(), groups = {}, order = [];
      var localNow = new Date(nowMs + o.utcOffset * 3600e3);
      var keyFmt = new Intl.DateTimeFormat('en-CA', { timeZone: youTz, year: 'numeric', month: '2-digit', day: '2-digit' });
      for (var i = 0; i < 16 && order.length < 10; i++) {
        var d = new Date(Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate() + i));
        if (o.days.indexOf(d.getUTCDay()) < 0) continue;
        for (var mm = toMin(o.open); mm + 60 <= toMin(o.close); mm += 60) {
          if (brk && mm < brk[1] && mm + 60 > brk[0]) continue;
          var utc = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, mm) - o.utcOffset * 3600e3;
          if (utc < nowMs + 3 * 3600e3) continue;
          var key = keyFmt.format(new Date(utc));
          if (!groups[key]) { groups[key] = []; order.push(key); }
          groups[key].push({ utc: utc, office: mm });
        }
      }
      return order.slice(0, 10).map(function (k) { return { key: k, slots: groups[k] }; });
    }
    function render() {
      var days = collect();
      var dayBox = $('#schedDays'), slotBox = $('#schedSlots');
      $('#schedTz').textContent = youTz.replace(/_/g, ' ');
      if (!days.length) {
        dayBox.innerHTML = '';
        slotBox.innerHTML = '<p class="sched__empty">' + esc(t('sched.none')) + '</p>';
        return;
      }
      if (!sel.day || !days.some(function (d) { return d.key === sel.day; })) { sel.day = days[0].key; sel.slot = null; }
      var wd = new Intl.DateTimeFormat(App.numLocale(), { weekday: 'short', timeZone: youTz });
      var dd = new Intl.DateTimeFormat(App.numLocale(), { day: 'numeric', timeZone: youTz });
      var mo = new Intl.DateTimeFormat(App.numLocale(), { month: 'short', timeZone: youTz });
      dayBox.innerHTML = days.map(function (d) {
        var ref = new Date(d.slots[0].utc);
        return '<button type="button" class="day-btn" role="radio" aria-checked="' + (d.key === sel.day) + '" data-day="' + d.key + '">' +
          '<span>' + esc(wd.format(ref)) + '</span><strong>' + esc(dd.format(ref)) + '</strong><span>' + esc(mo.format(ref)) + '</span></button>';
      }).join('');
      var cur = days.filter(function (d) { return d.key === sel.day; })[0];
      var tf = new Intl.DateTimeFormat(App.numLocale(), { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: youTz });
      var hf = new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: youTz });
      slotBox.innerHTML = cur.slots.map(function (s) {
        var hr = +hf.format(new Date(s.utc)) % 24, good = hr >= 8 && hr < 20;
        var off = String(Math.floor(s.office / 60)).padStart(2, '0') + ':' + String(s.office % 60).padStart(2, '0');
        return '<button type="button" class="slot-btn' + (good ? ' is-good' : '') + '" role="radio" aria-checked="' + (sel.slot === s.utc) + '" data-slot="' + s.utc + '"' +
          (good ? ' title="' + esc(t('sched.good')) + '"' : '') + '>' + esc(tf.format(new Date(s.utc))) + '<small dir="ltr">' + off + ' WIB</small></button>';
      }).join('');
      $('#schedRequest').disabled = !sel.slot;
    }
    $('#schedDays').addEventListener('click', function (e) {
      var b = e.target.closest('[data-day]');
      if (!b) return;
      sel.day = b.getAttribute('data-day');
      sel.slot = null;
      render();
    });
    $('#schedSlots').addEventListener('click', function (e) {
      var b = e.target.closest('[data-slot]');
      if (!b) return;
      sel.slot = +b.getAttribute('data-slot');
      render();
    });
    $('#schedRequest').addEventListener('click', function () {
      if (!sel.slot) return;
      var at = new Date(sel.slot);
      var you = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: youTz }).format(at);
      var wib = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: o.timeZone }).format(at);
      var who = [App.formValue && App.formValue('rfqName'), App.formValue && App.formValue('rfqCompany')].filter(Boolean).join(', ');
      var text = 'Hello ' + SITE.company.name + ', I would like to book a video call / live factory tour.\n\n' +
        'Requested time: ' + you + ' (' + youTz + ')\n' + '= ' + wib + ' WIB (Lampung)\n' +
        'Platform: ' + $('#schedPlatform').value + (who ? '\nName: ' + who : '') + '\n\n(Sent from your website)';
      App.toast(t('sched.sent'));
      if (App.waNumber() || SITE.demoMode) App.openWhatsApp(text);
      else App.openMail('Video call request', text);
      App.track('schedule_call', { platform: $('#schedPlatform').value });
    });
    render();
    setInterval(render, 5 * 60 * 1000);
    App.onLang(render);
  }

  /* ---------------------------------------------------- about & footer -- */
  function initAbout() {
    var any = false;
    $$('#aboutStats [data-stat]').forEach(function (el) {
      var v = SITE.stats[el.getAttribute('data-stat')];
      el.hidden = !v;
      if (v) { any = true; $('dd', el).textContent = v; }
    });
    $('#aboutStats').hidden = !any;
  }
  function initFooter() {
    var c = SITE.company;
    $('#year').textContent = new Date().getFullYear();
    $('#footerLegal').textContent = [c.legalName, c.nib ? 'NIB ' + c.nib : '', c.established ? 'Est. ' + c.established : ''].filter(Boolean).join(' · ');
    var labels = { instagram: 'IG', linkedin: 'in', youtube: 'YT', facebook: 'f', tiktok: 'TT' };
    $('#footerSocial').innerHTML = Object.keys(c.social || {}).filter(function (k) { return c.social[k]; }).map(function (k) {
      return '<a href="' + esc(c.social[k]) + '" target="_blank" rel="noopener" aria-label="' + k + '">' + labels[k] + '</a>';
    }).join('');
    function products() {
      $('#footerProducts').innerHTML = SITE.products.map(function (p) {
        return '<li><a href="#products" data-open-product="' + p.id + '">' + esc(App.productName(p)) + '</a></li>';
      }).join('') + '<li><a href="#calculator">' + esc(t('nav.calculator')) + '</a></li>';
    }
    products();
    App.onLang(products);
  }

  /* ------------------------------------------------------------------ SEO -- */
  function updateSeo() {
    var site = String(SITE.company.website || '').replace(/\/+$/, '');
    if (!site) return;
    var urlFor = function (code) { return site + '/' + (code === 'en' ? '' : '?lang=' + code); };
    var canon = $('link[rel="canonical"]');
    if (canon) canon.href = urlFor(App.lang);
    var og = $('meta[property="og:url"]');
    if (og) og.content = urlFor(App.lang);
    $$('link[rel="alternate"][hreflang]').forEach(function (l) { l.remove(); });
    SITE.languages.concat([{ code: 'x-default' }]).forEach(function (l) {
      var link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = l.code;
      link.href = l.code === 'x-default' ? urlFor('en') : urlFor(l.code);
      document.head.appendChild(link);
    });
    var c = SITE.company;
    var org = {
      '@type': 'Organization', '@id': site + '/#org', name: c.name, url: site + '/', logo: site + '/assets/img/icon-512.png',
      email: c.email, description: t('footer.about'),
      address: { '@type': 'PostalAddress', streetAddress: c.address, addressRegion: 'Lampung', addressCountry: 'ID' },
      contactPoint: [{ '@type': 'ContactPoint', contactType: 'sales', email: c.email, availableLanguage: ['English', 'Arabic', 'Chinese', 'Russian', 'Indonesian'] }]
    };
    if (c.legalName) org.legalName = c.legalName;
    if (c.phone) { org.telephone = c.phone; org.contactPoint[0].telephone = c.phone; }
    var same = Object.keys(c.social || {}).map(function (k) { return c.social[k]; }).filter(Boolean);
    if (same.length) org.sameAs = same;
    var faq = {
      '@type': 'FAQPage',
      mainEntity: Array.apply(null, { length: FAQ_COUNT }).map(function (_, i) {
        return { '@type': 'Question', name: t('faq.' + (i + 1) + '.q'), acceptedAnswer: { '@type': 'Answer', text: t('faq.' + (i + 1) + '.a') } };
      })
    };
    var data = { '@context': 'https://schema.org', '@graph': [org, { '@type': 'WebSite', url: site + '/', name: c.name, inLanguage: App.lang, publisher: { '@id': site + '/#org' } }, faq] };
    var s = $('#ldJson');
    if (!s) { s = document.createElement('script'); s.type = 'application/ld+json'; s.id = 'ldJson'; document.head.appendChild(s); }
    s.textContent = JSON.stringify(data);
  }
  // A demo/preview build must not be indexed with placeholder contacts.
  function previewNoindex() {
    if (!SITE.demoMode || $('meta[name="robots"]')) return;
    var m = document.createElement('meta');
    m.name = 'robots';
    m.content = 'noindex, nofollow';
    document.head.appendChild(m);
  }
  function initAnalytics() {
    var a = SITE.analytics || {};
    if (a.plausibleDomain) {
      var s = document.createElement('script');
      s.defer = true;
      s.setAttribute('data-domain', a.plausibleDomain);
      s.src = 'https://plausible.io/js/script.js';
      document.head.appendChild(s);
    }
    if (a.gaMeasurementId) {
      var g = document.createElement('script');
      g.async = true;
      g.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(a.gaMeasurementId);
      document.head.appendChild(g);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', a.gaMeasurementId);
    }
  }

  /* ------------------------------------------------------------------ boot -- */
  App.basket = basket;
  App.addItem = addItem;
  App.itemText = itemText;
  App.scrollToQuote = scrollToQuote;
  App.observeReveal = observeReveal;
  App.onBasket = function (fn) { basketListeners.push(fn); };

  App.ready(function () {
    initHeader();
    initReveal();
    initLanguages();
    initContacts();
    renderHero();
    renderPorts();
    App.onLang(function () { renderHero(); renderPorts(); updateSeo(); });
    initDialog();
    initProducts();
    initQuality();
    initFaq();
    initRfq();
    initIntents();
    initClock();
    initScheduler();
    initAbout();
    initFooter();
    updateSeo();
    previewNoindex();
    initAnalytics();
  });
})();
