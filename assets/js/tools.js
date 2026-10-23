/* Interactive tools: container-load calculator and the private-label box designer. */
(function () {
  'use strict';

  var App = window.App;
  var SITE = App.SITE, $ = App.$, $$ = App.$$, t = App.t, esc = App.esc, fmtNum = App.fmtNum;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------- calculator -- */
  function initCalculator() {
    var form = $('#calcForm');
    if (!form) return;
    var F = function (id) { return document.getElementById(id); };
    var radio = function (name) { var r = form.querySelector('input[name="' + name + '"]:checked'); return r ? r.value : ''; };
    var state = null, vizWidth = 0, vizRaf = 0;

    function fillProducts() {
      var ps = F('calcProduct'), cur = ps.value || App.featured().id;
      ps.innerHTML = SITE.products.map(function (p) { return '<option value="' + p.id + '">' + esc(App.productName(p)) + '</option>'; }).join('');
      ps.value = cur;
      fillOptions();
    }
    function fillOptions() {
      var p = App.findProduct(F('calcProduct').value);
      var vCur = F('calcVariant').value, kCur = F('calcPack').value;
      F('calcVariant').innerHTML = p.variants.map(function (v) { return '<option value="' + v.id + '">' + esc(App.variantLabel(v)) + '</option>'; }).join('');
      F('calcVariant').value = p.variants.some(function (v) { return v.id === vCur; }) ? vCur : App.defaultVariant(p).id;
      F('calcPack').innerHTML = p.packaging.map(function (k) { return '<option value="' + k + '">' + esc(App.packLabel(k)) + '</option>'; }).join('');
      F('calcPack').value = p.packaging.indexOf(kCur) > -1 ? kCur : p.packaging[0];
    }
    function animateFill(target) {
      cancelAnimationFrame(vizRaf);
      var rect = F('vizFill'), from = vizWidth, t0 = performance.now();
      if (reduce) { vizWidth = target; rect.setAttribute('width', target.toFixed(1)); return; }
      (function step(now) {
        var k = Math.max(0, Math.min(1, (now - t0) / 700)), e = 1 - Math.pow(1 - k, 3);
        vizWidth = from + (target - from) * e;
        rect.setAttribute('width', vizWidth.toFixed(1));
        if (k < 1) vizRaf = requestAnimationFrame(step);
      })(t0);
    }

    function compute() {
      var p = App.findProduct(F('calcProduct').value), v = App.findVariant(p, F('calcVariant').value), pack = F('calcPack').value;
      var mode = radio('calcMode') || 'container', type = radio('calcType') || '20ft';
      var typeLabel = type === '40hc' ? '40ft HC' : '20ft';
      var cap = p.loadKg[type] || 18000;
      var net, containersText, fill = 100, partial = false, qty = 1, mt = 0;
      F('calcContainerRow').hidden = false;
      F('calcWeightRow').hidden = mode !== 'weight';
      $('#calcQtyLabel').closest('.field').hidden = mode === 'weight';
      if (mode === 'container') {
        qty = Math.min(50, Math.max(1, parseInt(F('calcQty').value, 10) || 1));
        net = cap * qty;
        containersText = t('calc.containersOf', { n: fmtNum(qty), type: typeLabel });
      } else {
        mt = Math.max(0.1, parseFloat(F('calcWeight').value) || 0.1);
        net = mt * 1000;
        var n = net / cap;
        if (n < 1) {
          partial = true;
          fill = n * 100;
          containersText = t('calc.partial', { pct: Math.max(1, Math.round(n * 100)), type: typeLabel });
        } else {
          var full = Math.ceil(n - 1e-9);
          fill = n / full * 100;
          containersText = t('calc.containersOf', { n: fmtNum(full), type: typeLabel });
        }
      }
      var k = SITE.packaging[pack];
      var units = Math.ceil(net / App.packKg(pack));
      var inner = k && k.type === 'inner' ? units * k.count : null;
      var pieces = v.pcsPerKg ? Math.round(net * v.pcsPerKg) : null;
      var int = { maximumFractionDigits: 0 };

      F('calcNet').textContent = fmtNum(net, int) + ' kg';
      F('calcNetSub').textContent = '≈ ' + fmtNum(net / 1000, { maximumFractionDigits: 1 }) + ' MT · ' + fmtNum(net * 2.20462, int) + ' lb';
      F('calcContainers').textContent = containersText;
      F('calcUnitsLabel').textContent = t(App.packUnitKey(pack));
      F('calcUnits').textContent = fmtNum(units, int);
      F('calcInnerWrap').hidden = inner == null;
      if (inner != null) F('calcInner').textContent = fmtNum(inner, int);
      F('calcPiecesWrap').hidden = pieces == null;
      if (pieces != null) F('calcPieces').textContent = fmtNum(pieces, int);
      F('vizLabel').textContent = typeLabel + ' · ≈ ' + fmtNum(cap / 1000) + ' MT';
      F('vizPct').textContent = Math.round(fill) + '%';
      animateFill(364 * Math.min(100, fill) / 100);
      F('calcHint').hidden = !partial;
      F('calcHint').textContent = t('calc.hintPartial');
      state = { product: p.id, variant: v.id, pack: pack, mode: mode, type: type, qty: qty, mt: mt };
    }

    form.addEventListener('change', function (e) {
      if (e.target.id === 'calcProduct') fillOptions();
      compute();
    });
    form.addEventListener('input', function (e) { if (e.target.type === 'number') compute(); });
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    $$('.stepper__btn', form).forEach(function (b) {
      b.addEventListener('click', function () {
        var q = F('calcQty');
        q.value = Math.min(50, Math.max(1, (parseInt(q.value, 10) || 1) + +b.getAttribute('data-step')));
        compute();
      });
    });
    F('calcAdd').addEventListener('click', function () {
      if (!state || !App.addItem) return;
      App.addItem(state.mode === 'container'
        ? { product: state.product, variant: state.variant, pack: state.pack, qty: state.qty, unit: state.type, message: t('calc.added') }
        : { product: state.product, variant: state.variant, pack: state.pack, qty: state.mt, unit: 'mt', message: t('calc.added') });
    });

    fillProducts();
    compute();
    App.onLang(function () { fillProducts(); compute(); });
  }

  /* --------------------------------------------------- private label box -- */
  var COLORS = [
    { id: 'midnight', bg: '#0f0f11', bg2: '#2a2a2f', ink: '#f5efe6', accent: '#d9a35b' },
    { id: 'ember', bg: '#8f2606', bg2: '#f05a12', ink: '#fff4e6', accent: '#ffe2b8' },
    { id: 'ivory', bg: '#e6ddcf', bg2: '#fcf8f1', ink: '#1d1915', accent: '#b4400c' },
    { id: 'emerald', bg: '#08281e', bg2: '#16573f', ink: '#eef7f1', accent: '#dcb86e' },
    { id: 'royal', bg: '#0c1648', bg2: '#25398f', ink: '#f2f4ff', accent: '#ecc66a' },
    { id: 'gold', bg: '#7d5a1f', bg2: '#dcaa52', ink: '#1b1206', accent: '#1b1206' }
  ];

  function initPrivateLabel() {
    var box = $('#box3d'), scene = $('#boxScene');
    if (!box || !scene) return;
    var shisha = App.featured();
    var sizes = shisha.variants.filter(function (v) { return v.kind === 'cube'; });
    var sel = { color: 'midnight', size: (App.defaultVariant(shisha) || sizes[0]).id };

    function renderControls() {
      $('#plSwatches').innerHTML = COLORS.map(function (c) {
        return '<label class="swatch" title="' + esc(t('pl.c.' + c.id)) + '"><input type="radio" name="plColor" value="' + c.id + '"' + (c.id === sel.color ? ' checked' : '') +
          ' aria-label="' + esc(t('pl.c.' + c.id)) + '"><span style="--sw:linear-gradient(135deg,' + c.bg2 + ',' + c.bg + ')"></span></label>';
      }).join('');
      $('#plSizes').innerHTML = sizes.map(function (v) {
        return '<label><input type="radio" name="plSize" value="' + v.id + '"' + (v.id === sel.size ? ' checked' : '') + '><span dir="ltr">' + esc(v.size) + '</span></label>';
      }).join('');
    }
    function brandText() { return ($('#plBrand').value.trim() || $('#plBrand').getAttribute('placeholder') || 'YOUR BRAND'); }
    function update() {
      var c = COLORS.filter(function (x) { return x.id === sel.color; })[0] || COLORS[0];
      var v = App.findVariant(shisha, sel.size);
      box.style.setProperty('--box-bg', c.bg);
      box.style.setProperty('--box-bg2', c.bg2);
      box.style.setProperty('--box-ink', c.ink);
      box.style.setProperty('--box-accent', c.accent);
      var brand = brandText();
      var px = Math.max(16, Math.min(34, 34 - Math.max(0, brand.length - 8) * 1.7)) * Math.min(1, (box.offsetWidth || 250) / 250);
      $('#boxBrand').textContent = brand;
      $('#boxBrand').style.setProperty('--brand-size', px + 'px');
      $$('.js-box-brand', box).forEach(function (el) { el.textContent = brand; });
      $('#boxTag').textContent = $('#plTagline').value.trim() || $('#plTagline').getAttribute('placeholder') || '';
      $('#boxMeta').textContent = v.size.toUpperCase() + (v.pcsPerKg ? ' · ' + v.pcsPerKg + ' PCS' : '') + ' · 1 KG';
      var specs = $('.box-art__specs', box);
      if (specs) {
        specs.innerHTML = ['ash', 'burnTime', 'smell'].filter(function (k) { return shisha.specs[k]; }).map(function (k) {
          return '<span>' + esc(t('spec.' + k)) + ': <bdi>' + esc(App.specVal(shisha.specs[k])) + '</bdi></span>';
        }).join('');
      }
    }

    $('#plForm').addEventListener('input', update);
    $('#plForm').addEventListener('change', function (e) {
      if (e.target.name === 'plColor') sel.color = e.target.value;
      if (e.target.name === 'plSize') sel.size = e.target.value;
      update();
    });
    $('#plUse').addEventListener('click', function () {
      var v = App.findVariant(shisha, sel.size), brand = $('#plBrand').value.trim() || 'Brand TBD';
      var note = 'Private label: "' + brand + '", ' + App.tEn('pl.c.' + sel.color) + ' box' + ($('#plTagline').value.trim() ? ', tagline "' + $('#plTagline').value.trim() + '"' : '');
      if (App.prefill) App.prefill({ type: 'private', brand: brand + ' — ' + App.tEn('pl.c.' + sel.color) + ' box, ' + v.size + ' cubes' });
      if (App.addItem) App.addItem({ product: shisha.id, variant: v.id, pack: shisha.packaging[0], note: note, message: t('rfq.plSet') });
    });

    // drag to rotate + gentle idle sway
    var rot = { x: -16, y: -32 }, base = { x: -16, y: -32 }, drag = null, lastInteract = -1e9, visible = false, running = false;
    function apply() {
      box.style.setProperty('--brx', rot.x.toFixed(2) + 'deg');
      box.style.setProperty('--bry', rot.y.toFixed(2) + 'deg');
    }
    scene.addEventListener('pointerdown', function (e) {
      drag = { x: e.clientX, y: e.clientY, id: e.pointerId };
      try { scene.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    });
    scene.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      rot.y += (e.clientX - drag.x) * 0.5 * (document.dir === 'rtl' ? 1 : 1);
      rot.x = Math.max(-40, Math.min(25, rot.x - (e.clientY - drag.y) * 0.3));
      drag.x = e.clientX;
      drag.y = e.clientY;
      lastInteract = performance.now();
      apply();
    });
    function end() { if (drag) { drag = null; base.x = rot.x; base.y = rot.y; lastInteract = performance.now(); } }
    scene.addEventListener('pointerup', end);
    scene.addEventListener('pointercancel', end);
    function tick(now) {
      if (!visible) { running = false; return; }
      if (!drag && now - lastInteract > 2500) {
        var k = (now - lastInteract - 2500) / 1000, ease = Math.min(1, k);
        rot.y = base.y + Math.sin(now / 1800) * 14 * ease;
        rot.x = base.x + Math.sin(now / 2600) * 4 * ease;
        apply();
      }
      requestAnimationFrame(tick);
    }
    if (!reduce && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        visible = en[0].isIntersecting;
        if (visible && !running) { running = true; requestAnimationFrame(tick); }
      }, { threshold: 0.1 }).observe(scene);
    }

    renderControls();
    update();
    apply();
    App.onLang(function () { renderControls(); update(); });
    var rt = 0;
    addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(update, 150); });
  }

  App.ready(function () {
    initCalculator();
    initPrivateLabel();
  });
})();
