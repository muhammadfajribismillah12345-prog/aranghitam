/* Technical data sheet: renders one product/size from config in the chosen
   language, with a QR code back to WhatsApp (or the website). Print = PDF. */
(function () {
  'use strict';

  var App = window.App;
  var SITE = App.SITE, $ = App.$, t = App.t, esc = App.esc, fmtNum = App.fmtNum;
  var SPEC_ORDER = ['moisture', 'ash', 'ashColor', 'fixedCarbon', 'volatile', 'calorific', 'burnTime', 'smell', 'binder'];
  var QR_SRC = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js';
  var params = new URLSearchParams(location.search);
  var state = { p: params.get('p') || App.featured().id, v: params.get('v') || '' };

  function option(value, label, selected) {
    return '<option value="' + esc(value) + '"' + (selected ? ' selected' : '') + '>' + esc(label) + '</option>';
  }
  // Values with right-to-left letters keep the page direction; purely technical
  // values (numbers, units, codes) are isolated so they never get reordered.
  var RTL_CHARS = /[֐-ࣿ]/;
  function value(v) {
    return RTL_CHARS.test(v) ? '<span>' + esc(v) + '</span>' : '<bdi>' + esc(v) + '</bdi>';
  }
  function row(label, v) {
    return '<tr><th scope="row">' + esc(label) + '</th><td>' + value(v) + '</td></tr>';
  }

  function qrTarget(p, v) {
    if (App.waNumber()) {
      return { url: App.waLink('Hello ' + SITE.company.name + ', please send your price for ' + App.productName(p, 'en') + ' — ' + App.variantLabel(v, 'en') + '. (Spec sheet TDS-' + p.id.toUpperCase() + '-' + v.id.toUpperCase() + ')'), label: t('sheet.scanWa') };
    }
    return { url: String(SITE.company.website || '').replace(/\/+$/, '') + '/' + (App.lang === 'en' ? '' : '?lang=' + App.lang), label: t('sheet.scanWeb') };
  }
  function renderQr(p, v) {
    var wrap = $('#shQrWrap');
    if (!window.qrcode) {
      if (!document.querySelector('script[data-qr]')) {
        var s = document.createElement('script');
        s.src = QR_SRC;
        s.async = true;
        s.setAttribute('data-qr', '');
        s.onload = function () { render(); };
        document.head.appendChild(s);
      }
      wrap.hidden = true;
      return;
    }
    try {
      var target = qrTarget(p, v), qr = window.qrcode(0, 'M');
      qr.addData(target.url);
      qr.make();
      $('#shQr').innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
      $('#shQrLabel').textContent = target.label;
      wrap.hidden = false;
    } catch (e) { wrap.hidden = true; }
  }

  function render() {
    var p = App.findProduct(state.p), v = App.findVariant(p, state.v), c = SITE.company, tr = SITE.trade;
    state.p = p.id;
    state.v = v.id;

    $('#selProduct').innerHTML = SITE.products.map(function (x) { return option(x.id, App.productName(x), x.id === p.id); }).join('');
    $('#selVariant').innerHTML = p.variants.map(function (x) { return option(x.id, App.variantLabel(x), x.id === v.id); }).join('');
    $('#selLang').innerHTML = SITE.languages.map(function (l) { return option(l.code, l.name, l.code === App.lang); }).join('');

    document.title = t('sheet.docTitle', { product: App.productName(p) + ' ' + v.size }) + ' | ' + c.name;
    $('#docNo').textContent = 'TDS-' + p.id.toUpperCase() + '-' + v.id.toUpperCase();
    $('#docDate').textContent = new Intl.DateTimeFormat(App.numLocale(), { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());
    document.querySelectorAll('.js-company').forEach(function (el) { el.textContent = c.name; });

    $('#shArt').innerHTML = p.image ? '<img src="' + esc(p.image) + '" alt="">' : App.illustration(p.shape);
    $('#shTag').textContent = t('prod.' + p.id + '.tag');
    $('#shName').textContent = App.productName(p);
    $('#shVariant').innerHTML = [App.variantLabel(v), v.dims].concat(v.pcsPerKg ? [t('prod.pcsKg', { n: v.pcsPerKg })] : [])
      .map(function (s) { return '<bdi>' + esc(s) + '</bdi>'; }).join(' · ');
    $('#shDesc').textContent = t('prod.' + p.id + '.desc');
    $('#shKeys').innerHTML = ['ash', 'burnTime', 'fixedCarbon', 'moisture'].filter(function (k) { return p.specs[k]; }).slice(0, 3).map(function (k) {
      return '<li><span>' + esc(t('spec.' + k)) + '</span><b dir="ltr">' + esc(App.specVal(p.specs[k])) + '</b></li>';
    }).join('');

    var specs = row(t('spec.size'), v.dims);
    if (v.pcsPerKg) specs += row(t('spec.pcsPerKg'), '≈ ' + v.pcsPerKg);
    SPEC_ORDER.forEach(function (k) { if (p.specs[k]) specs += row(t('spec.' + k), App.specVal(p.specs[k])); });
    $('#shSpecs').innerHTML = specs;

    $('#shPack').innerHTML = p.packaging.map(function (k) { return '<li>' + esc(App.packLabel(k)) + '</li>'; }).join('');
    $('#shLoad').innerHTML =
      '<div><span>20ft</span><b dir="ltr">≈ ' + fmtNum(p.loadKg['20ft'] / 1000) + ' MT</b></div>' +
      '<div><span>40ft HC</span><b dir="ltr">≈ ' + fmtNum(p.loadKg['40hc'] / 1000) + ' MT</b></div>';
    $('#shUses').innerHTML = t('prod.' + p.id + '.uses').split(' · ').map(function (u) { return '<li>' + esc(u) + '</li>'; }).join('');

    $('#shTerms').innerHTML =
      row(t('sheet.moq'), t('moq.text', { n: tr.moqContainers, type: tr.moqType, mt: fmtNum(tr.moqKg / 1000) })) +
      row(t('sheet.lead'), t('sheet.leadVal')) +
      row(t('sheet.incoterms'), tr.incoterms.join(' · ')) +
      row(t('sheet.ports'), tr.loadingPorts.map(function (lp) { return lp.name; }).join(' / ')) +
      row(t('sheet.payment'), t('sheet.paymentVal')) +
      row(t('sheet.samples'), t('sheet.samplesVal')) +
      row(t('sheet.hs'), tr.hsCode);

    var contact = [[t('rfq.email'), c.email]];
    if (c.phone || App.waNumber()) contact.push(['WhatsApp', c.phone || '+' + App.waNumber()]);
    if (c.website) contact.push(['Web', String(c.website).replace(/^https?:\/\//, '')]);
    contact.push([t('contact.address'), c.address]);
    if (c.legalName) contact.unshift([t('sheet.company'), c.legalName + (c.nib ? ' · NIB ' + c.nib : '')]);
    $('#shContact').innerHTML = contact.map(function (r) { return '<dt>' + esc(r[0]) + '</dt><dd>' + value(r[1]) + '</dd>'; }).join('');

    renderQr(p, v);
    fitPage();
  }

  // Keep everything on one A4 page: tighten spacing step by step if the content
  // would run into the footer (long languages such as Russian or Indonesian).
  function fitPage() {
    var sheet = $('#sheet'), foot = $('.sh-foot');
    var overflows = function () {
      var grids = document.querySelectorAll('.sh-grid');
      return foot.getBoundingClientRect().top - grids[grids.length - 1].getBoundingClientRect().bottom < 6;
    };
    sheet.classList.remove('is-compact', 'is-tight');
    if (overflows()) sheet.classList.add('is-compact');
    if (overflows()) sheet.classList.add('is-tight');
  }

  function updateUrl() {
    try {
      var u = new URL(location.href);
      u.searchParams.set('p', state.p);
      u.searchParams.set('v', state.v);
      history.replaceState(null, '', u.toString());
    } catch (e) { /* file:// */ }
  }
  function fit() {
    var sheet = $('#sheet'), w = sheet.offsetWidth || 794;
    sheet.style.zoom = innerWidth < w + 32 ? String(Math.max(0.35, (innerWidth - 16) / w)) : '';
  }

  App.ready(function () {
    render();
    App.onLang(render);
    $('#selProduct').addEventListener('change', function (e) { state.p = e.target.value; state.v = ''; render(); updateUrl(); });
    $('#selVariant').addEventListener('change', function (e) { state.v = e.target.value; render(); updateUrl(); });
    $('#selLang').addEventListener('change', function (e) { App.setLang(e.target.value); });
    $('#btnPrint').addEventListener('click', function () { window.print(); });
    fit();
    addEventListener('resize', fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitPage);
    if (params.get('print') === '1') setTimeout(function () { window.print(); }, 900);
  });
})();
