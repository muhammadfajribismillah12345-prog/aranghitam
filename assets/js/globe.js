/* Shipping section: dotted 3D globe on canvas with sea-lane routes from Lampung,
   plus the port picker and transit estimator. Land data: assets/js/landmask.js. */
(function () {
  'use strict';

  var App = window.App;
  var SITE = App.SITE, $ = App.$, $$ = App.$$, t = App.t, esc = App.esc;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var RAD = Math.PI / 180;

  /* Sea-lane waypoints [lat, lon] so routes follow real shipping corridors
     (Sunda Strait, Hormuz, Bab-el-Mandeb, Suez, Gibraltar, Malacca, Torres ...). */
  var W = {
    west: [[-5.95, 105.6], [-7.0, 104.8], [-5.0, 100.5], [0.5, 93.5], [5.6, 80.6]],
    north: [[-5.9, 105.9], [-4.6, 107.6], [-1.6, 108.6], [5.5, 110.0], [14.0, 115.5]],
    gulf: [[13.5, 61.5], [22.6, 60.2], [26.4, 56.7]],
    redSea: [[12.2, 52.5], [12.6, 43.4], [16.0, 41.5]],
    suez: [[22.5, 37.9], [27.3, 33.9], [29.8, 32.55], [31.35, 32.35]],
    medWest: [[33.6, 25.0], [36.0, 15.2], [37.6, 10.0], [36.7, 2.0], [35.95, -5.6]],
    biscay: [[37.0, -9.6], [43.3, -9.9], [48.6, -5.6], [50.2, -1.0], [51.0, 1.6]],
    aegean: [[34.5, 28.0], [36.6, 26.1], [39.4, 25.9], [40.15, 26.4], [40.8, 27.9]]
  };
  function via() { return Array.prototype.concat.apply([], arguments); }
  var LANES = {
    jebelali: via(W.west, W.gulf),
    dammam: via(W.west, W.gulf, [[26.7, 53.0]]),
    ummqasr: via(W.west, W.gulf, [[27.6, 51.4], [29.4, 48.9]]),
    jeddah: via(W.west, W.redSea),
    aqaba: via(W.west, W.redSea, [[22.0, 38.1], [27.9, 34.5]]),
    alexandria: via(W.west, W.redSea, W.suez),
    beirut: via(W.west, W.redSea, W.suez, [[32.6, 34.1]]),
    mersin: via(W.west, W.redSea, W.suez, [[34.2, 33.6]]),
    istanbul: via(W.west, W.redSea, W.suez, W.aegean),
    novorossiysk: via(W.west, W.redSea, W.suez, W.aegean, [[41.2, 29.1], [43.0, 33.0]]),
    rotterdam: via(W.west, W.redSea, W.suez, W.medWest, W.biscay),
    hamburg: via(W.west, W.redSea, W.suez, W.medWest, W.biscay, [[52.8, 3.2], [53.95, 7.2]]),
    stpetersburg: via(W.west, W.redSea, W.suez, W.medWest, W.biscay, [[54.5, 5.0], [57.3, 8.0], [57.9, 10.8], [55.6, 12.8], [55.4, 15.0], [56.8, 18.8], [58.9, 21.2], [59.8, 24.5]]),
    newyork: via(W.west, W.redSea, W.suez, W.medWest, [[36.4, -20.0], [39.0, -45.0], [40.3, -68.0]]),
    santos: [[-5.95, 105.6], [-7.0, 104.8], [-20.0, 80.0], [-31.0, 48.0], [-35.6, 22.0], [-34.6, 17.6], [-30.0, 0.0], [-26.0, -32.0]],
    nhavasheva: via(W.west, [[8.6, 76.4], [15.0, 72.5]]),
    portklang: [[-5.9, 105.9], [-4.8, 106.4], [-3.2, 106.2], [-2.3, 105.6], [-0.5, 104.9], [1.15, 104.2], [1.6, 103.0], [2.5, 101.8]],
    shanghai: via(W.north, [[22.0, 118.0], [24.6, 119.9], [28.5, 122.3]]),
    busan: via(W.north, [[22.0, 118.0], [24.6, 119.9], [30.0, 124.5], [33.6, 128.0]]),
    tokyo: via(W.north, [[20.8, 121.4], [27.0, 131.0], [33.2, 137.8]]),
    losangeles: via(W.north, [[20.8, 121.4], [29.0, 140.0], [37.5, 168.0], [37.0, -150.0], [34.5, -125.0]]),
    sydney: [[-5.9, 105.9], [-5.3, 110.0], [-6.6, 116.0], [-7.6, 121.0], [-8.6, 128.0], [-9.9, 136.0], [-10.6, 142.2], [-12.0, 145.5], [-17.0, 152.0], [-24.0, 154.5], [-30.0, 153.8]]
  };

  function vec(lat, lon) {
    var p = lat * RAD, l = lon * RAD;
    return [Math.cos(p) * Math.sin(l), Math.sin(p), Math.cos(p) * Math.cos(l)];
  }
  function toLatLon(v) {
    var n = Math.hypot(v[0], v[1], v[2]) || 1;
    return [Math.asin(v[1] / n) / RAD, Math.atan2(v[0], v[2]) / RAD];
  }
  function slerp(a, b, s) {
    var d = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
    var w = Math.acos(d);
    if (w < 1e-6) return a.slice();
    var sw = Math.sin(w), k1 = Math.sin((1 - s) * w) / sw, k2 = Math.sin(s * w) / sw;
    return [a[0] * k1 + b[0] * k2, a[1] * k1 + b[1] * k2, a[2] * k1 + b[2] * k2];
  }
  function buildRoute(port) {
    var home = SITE.company.coords;
    var pts = [[home.lat, home.lon]].concat(LANES[port.id] || [], [[port.lat, port.lon]]);
    var out = [], len = [0];
    for (var i = 0; i < pts.length - 1; i++) {
      var a = vec(pts[i][0], pts[i][1]), b = vec(pts[i + 1][0], pts[i + 1][1]);
      var ang = Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])));
      var steps = Math.max(2, Math.ceil(ang / RAD / 1.2));
      for (var s = i === 0 ? 0 : 1; s <= steps; s++) {
        var v = slerp(a, b, s / steps);
        if (out.length) {
          var q = out[out.length - 1];
          len.push(len[len.length - 1] + Math.hypot(v[0] - q[0], v[1] - q[1], v[2] - q[2]));
        }
        out.push(v);
      }
    }
    var c = [0, 0, 0];
    out.forEach(function (v) { c[0] += v[0]; c[1] += v[1]; c[2] += v[2]; });
    return { pts: out, len: len, total: len[len.length - 1], center: toLatLon(c) };
  }

  function decodeMask() {
    if (!window.LAND_MASK) return null;
    var bin = atob(window.LAND_MASK), arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return arr;
  }
  function buildDots(mask, N) {
    var land = [], home = [], g = Math.PI * (3 - Math.sqrt(5));
    for (var i = 0; i < N; i++) {
      var y = 1 - (i + 0.5) * 2 / N, rr = Math.sqrt(1 - y * y), th = i * g;
      var x = Math.cos(th) * rr, z = Math.sin(th) * rr;
      var lat = Math.asin(y) / RAD, lon = Math.atan2(x, z) / RAD;
      var row = Math.min(179, Math.max(0, Math.floor(90 - lat)));
      var col = Math.floor((((lon + 180) % 360) + 360) % 360);
      var b = row * 360 + col;
      if (!(mask[b >> 3] & (128 >> (b & 7)))) continue;
      // Indonesia glows ember
      if (lat > -11.5 && lat < 6.5 && lon > 94.5 && lon < 141.5) home.push(x, y, z); else land.push(x, y, z);
    }
    return { land: new Float32Array(land), home: new Float32Array(home) };
  }

  function Globe(canvas, onPick) {
    var ctx = canvas.getContext('2d');
    var mask = decodeMask();
    var dots = mask ? buildDots(mask, 16000) : { land: new Float32Array(0), home: new Float32Array(0) };
    var view = { lat: 18, lon: 70 }, sway = 0;
    var size = 0, dpr = 1, R = 0, cx = 0, cy = 0;
    var routes = {}, active = null, anim = null, drag = null, visible = false, running = false, last = 0, head = 0, idle = 0;
    var markers = [];
    var homeVec = vec(SITE.company.coords.lat, SITE.company.coords.lon);

    SITE.ports.forEach(function (p) { routes[p.id] = buildRoute(p); });

    function resize() {
      var w = canvas.clientWidth || 500;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = w;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(w * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      R = w * 0.43;
      cx = w / 2;
      cy = w / 2;
      draw();
    }

    function rotator() {
      var lon = (view.lon + sway) * RAD, lat = view.lat * RAD;
      var cl = Math.cos(lon), sl = Math.sin(lon), cp = Math.cos(lat), sp = Math.sin(lat);
      return function (x, y, z, out) {
        var x1 = x * cl - z * sl, z1 = x * sl + z * cl;
        out[0] = x1;
        out[1] = y * cp - z1 * sp;
        out[2] = y * sp + z1 * cp;
        return out;
      };
    }

    function dotLayer(arr, rot, colors, radius) {
      var paths = [new Path2D(), new Path2D(), new Path2D()], o = [0, 0, 0];
      for (var i = 0; i < arr.length; i += 3) {
        rot(arr[i], arr[i + 1], arr[i + 2], o);
        if (o[2] <= 0.02) continue;
        var sx = cx + R * o[0], sy = cy - R * o[1];
        var bucket = o[2] > 0.62 ? 2 : o[2] > 0.3 ? 1 : 0;
        var r = radius * (0.55 + 0.45 * o[2]);
        paths[bucket].moveTo(sx + r, sy);
        paths[bucket].arc(sx, sy, r, 0, 6.2832);
      }
      for (var b = 0; b < 3; b++) { ctx.fillStyle = colors[b]; ctx.fill(paths[b]); }
    }

    function draw() {
      if (!size) return;
      var rot = rotator(), o = [0, 0, 0];
      ctx.clearRect(0, 0, size, size);

      var glow = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.22);
      glow.addColorStop(0, 'rgba(255,120,40,0.16)');
      glow.addColorStop(1, 'rgba(255,120,40,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, size, size);

      var body = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
      body.addColorStop(0, '#221b17');
      body.addColorStop(1, '#0c0a09');
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, 6.2832);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,179,107,0.22)';
      ctx.lineWidth = 1;
      ctx.stroke();

      var dr = Math.max(0.9, R / 190);
      dotLayer(dots.land, rot, ['rgba(214,198,180,0.22)', 'rgba(232,218,200,0.48)', 'rgba(243,232,216,0.78)'], dr);
      dotLayer(dots.home, rot, ['rgba(255,138,61,0.4)', 'rgba(255,138,61,0.7)', 'rgba(255,160,90,0.95)'], dr * 1.1);

      // routes
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      Object.keys(routes).forEach(function (id) {
        if (id === active) return;
        strokeRoute(routes[id], rot, 'rgba(255,138,61,0.16)', 1, 1);
      });
      markers = [];
      SITE.ports.forEach(function (p) {
        var pt = routes[p.id].pts[routes[p.id].pts.length - 1];
        rot(pt[0], pt[1], pt[2], o);
        if (o[2] <= 0.05) return;
        var sx = cx + R * o[0], sy = cy - R * o[1];
        markers.push({ id: p.id, x: sx, y: sy });
        ctx.beginPath();
        ctx.arc(sx, sy, p.id === active ? 4.2 : 2.6, 0, 6.2832);
        ctx.fillStyle = p.id === active ? '#ffd6a8' : 'rgba(255,214,168,0.75)';
        ctx.fill();
      });
      if (active && routes[active]) {
        var rt = routes[active];
        strokeRoute(rt, rot, 'rgba(255,138,61,0.35)', 5, 1);
        strokeRoute(rt, rot, '#ff8a3d', 2, 1);
        // travelling comet
        var at = head * rt.total, i = 1;
        while (i < rt.len.length && rt.len[i] < at) i++;
        var start = Math.max(0, i - 18);
        for (var k = start; k < i && k < rt.pts.length - 1; k++) {
          var a = rot(rt.pts[k][0], rt.pts[k][1], rt.pts[k][2], [0, 0, 0]);
          var b = rot(rt.pts[k + 1][0], rt.pts[k + 1][1], rt.pts[k + 1][2], [0, 0, 0]);
          if (a[2] <= 0 || b[2] <= 0) continue;
          ctx.strokeStyle = 'rgba(255,240,214,' + ((k - start + 1) / (i - start)).toFixed(2) + ')';
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          ctx.moveTo(cx + R * a[0], cy - R * a[1]);
          ctx.lineTo(cx + R * b[0], cy - R * b[1]);
          ctx.stroke();
        }
        var end = rt.pts[rt.pts.length - 1];
        rot(end[0], end[1], end[2], o);
        if (o[2] > 0.05) {
          var ex = cx + R * o[0], ey = cy - R * o[1];
          ctx.strokeStyle = 'rgba(255,214,168,0.9)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(ex, ey, 8 + 3 * Math.sin(last / 300), 0, 6.2832);
          ctx.stroke();
          label(portName(active), ex, ey);
        }
      }
      // Lampung
      rot(homeVec[0], homeVec[1], homeVec[2], o);
      if (o[2] > 0.02) {
        var hx = cx + R * o[0], hy = cy - R * o[1], pulse = (last / 1400) % 1;
        ctx.strokeStyle = 'rgba(255,106,26,' + (1 - pulse).toFixed(2) + ')';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(hx, hy, 5 + pulse * 18, 0, 6.2832);
        ctx.stroke();
        ctx.fillStyle = '#ff6a1a';
        ctx.beginPath();
        ctx.arc(hx, hy, 5, 0, 6.2832);
        ctx.fill();
        ctx.fillStyle = '#fff1dc';
        ctx.beginPath();
        ctx.arc(hx, hy, 2, 0, 6.2832);
        ctx.fill();
        label('Lampung', hx, hy, true);
      }
    }

    function strokeRoute(rt, rot, color, width, alpha) {
      var o = [0, 0, 0], drawing = false;
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      for (var i = 0; i < rt.pts.length; i++) {
        var p = rt.pts[i];
        rot(p[0], p[1], p[2], o);
        if (o[2] > 0) {
          var sx = cx + R * o[0], sy = cy - R * o[1];
          if (drawing) ctx.lineTo(sx, sy); else { ctx.moveTo(sx, sy); drawing = true; }
        } else drawing = false;
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    function label(text, x, y, home) {
      ctx.font = '700 ' + (home ? 12 : 13) + 'px Manrope, "Segoe UI", sans-serif';
      var w = ctx.measureText(text).width + 16, h = 24;
      var lx = Math.min(size - w - 4, Math.max(4, x + 10)), ly = y - h - 8;
      if (ly < 4) ly = y + 10;
      ctx.fillStyle = home ? 'rgba(255,106,26,0.92)' : 'rgba(20,16,14,0.88)';
      ctx.strokeStyle = home ? 'rgba(255,214,168,0.5)' : 'rgba(255,179,107,0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(lx, ly, w, h, 8); else ctx.rect(lx, ly, w, h);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = home ? '#1c0d04' : '#f3ece2';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillText(text, lx + 8, ly + h / 2 + 0.5);
    }

    function portName(id) {
      var p = SITE.ports.filter(function (x) { return x.id === id; })[0];
      return p ? p.name : '';
    }

    function frame(ts) {
      if (!running) return;
      var dt = last ? Math.min(3, (ts - last) / 16.67) : 1;
      last = ts;
      if (anim) {
        var k = Math.max(0, Math.min(1, (ts - anim.t0) / anim.dur)), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        view.lat = anim.from.lat + (anim.to.lat - anim.from.lat) * e;
        view.lon = anim.from.lon + anim.dLon * e;
        if (k >= 1) anim = null;
      } else if (!drag) {
        if (dragVel) {
          view.lon -= dragVel.x * dt;
          view.lat = clampLat(view.lat + dragVel.y * dt);
          dragVel.x *= 0.92;
          dragVel.y *= 0.92;
          if (Math.abs(dragVel.x) < 0.01 && Math.abs(dragVel.y) < 0.01) dragVel = null;
        } else {
          idle += dt;
          sway = Math.sin(idle / 160) * 6;
        }
      }
      head = (head + 0.0028 * dt) % 1;
      draw();
      requestAnimationFrame(frame);
    }
    var dragVel = null;
    function clampLat(v) { return Math.max(-55, Math.min(60, v)); }

    function focus(id, instant) {
      active = id;
      var c = routes[id] ? routes[id].center : [view.lat, view.lon];
      var to = { lat: clampLat(c[0] * 0.85), lon: c[1] };
      var curLon = view.lon + sway;
      sway = 0;
      idle = 0;
      var d = ((to.lon - curLon) % 360 + 540) % 360 - 180;
      if (instant || reduce) {
        view.lat = to.lat;
        view.lon = curLon + d;
        anim = null;
        draw();
        return;
      }
      view.lon = curLon;
      anim = { from: { lat: view.lat, lon: view.lon }, to: to, dLon: d, t0: performance.now(), dur: 1300 };
    }

    // interaction
    canvas.addEventListener('pointerdown', function (e) {
      drag = { x: e.clientX, y: e.clientY, moved: 0, id: e.pointerId };
      anim = null;
      view.lon += sway;
      sway = 0;
      dragVel = null;
    });
    addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) {
        if (!drag && e.target === canvas) {
          var r = canvas.getBoundingClientRect(), hit = hitTest(e.clientX - r.left, e.clientY - r.top);
          canvas.style.cursor = hit ? 'pointer' : '';
        }
        return;
      }
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      drag.moved += Math.abs(dx) + Math.abs(dy);
      if (drag.moved > 4 && canvas.setPointerCapture && !drag.captured) {
        try { canvas.setPointerCapture(e.pointerId); drag.captured = true; } catch (err) { /* ignore */ }
      }
      var k = 180 / (Math.PI * R);
      view.lon -= dx * k;
      view.lat = clampLat(view.lat + dy * k);
      dragVel = { x: dx * k, y: dy * k };
      drag.x = e.clientX;
      drag.y = e.clientY;
      if (!running) draw();
    });
    function endDrag(e) {
      if (!drag || (e && e.pointerId !== drag.id)) return;
      if (drag.moved < 6 && e && e.type === 'pointerup') {
        var r = canvas.getBoundingClientRect(), hit = hitTest(e.clientX - r.left, e.clientY - r.top);
        if (hit) { focus(hit); onPick(hit); }
        dragVel = null;
      }
      drag = null;
    }
    addEventListener('pointerup', endDrag);
    addEventListener('pointercancel', function (e) { if (drag && e.pointerId === drag.id) { drag = null; dragVel = null; } });

    function hitTest(x, y) {
      var best = null, bd = 16;
      markers.forEach(function (m) { var d = Math.hypot(m.x - x, m.y - y); if (d < bd) { bd = d; best = m.id; } });
      return best;
    }

    function setVisible(v) {
      visible = v;
      if (v && !running && !reduce) { running = true; last = 0; requestAnimationFrame(frame); }
      if (!v) running = false;
    }

    return { resize: resize, focus: focus, draw: draw, setVisible: setVisible };
  }

  /* --------------------------------------------------------- port picker -- */
  App.ready(function () {
    var canvas = $('#globe');
    if (!canvas) return;
    var REGIONS = ['me', 'eu', 'am', 'ap'];
    var current = SITE.ports[0].id, region = SITE.ports[0].region;

    function totalWeeks(p) {
      var lead = SITE.trade.leadWeeks;
      return [Math.ceil((lead[0] * 7 + p.days[0]) / 7), Math.ceil((lead[1] * 7 + p.days[1]) / 7)];
    }
    function port(id) { return SITE.ports.filter(function (p) { return p.id === id; })[0]; }

    function renderTabs() {
      $('#regionTabs').innerHTML = REGIONS.filter(function (r) { return SITE.ports.some(function (p) { return p.region === r; }); }).map(function (r) {
        return '<button type="button" class="region-tab" role="tab" aria-selected="' + (r === region) + '" data-region="' + r + '">' + esc(t('region.' + r)) + '</button>';
      }).join('');
      $('#portButtons').innerHTML = SITE.ports.filter(function (p) { return p.region === region; }).map(function (p) {
        return '<button type="button" class="port-btn' + (p.id === current ? ' is-active' : '') + '" aria-pressed="' + (p.id === current) + '" data-port="' + p.id + '">' +
          esc(p.name) + '<small>' + esc(App.countryName(p.cc)) + '</small></button>';
      }).join('');
    }
    function renderCard(customName) {
      var p = customName ? null : port(current);
      if (!p) {
        $('#routeTo').textContent = customName;
        $('#routeTransit').textContent = '—';
        $('#routeTotal').textContent = '—';
        $('#routeCtaText').textContent = t('ship.cta', { port: customName });
        $('#routeCta').dataset.port = customName;
        App.toast(t('ship.noMatch'));
        return;
      }
      var wk = totalWeeks(p);
      $('#routeTo').textContent = p.name + ', ' + App.countryName(p.cc);
      $('#routeTransit').textContent = t('ship.days', { min: p.days[0], max: p.days[1] });
      $('#routeTotal').textContent = t('ship.weeks', { min: wk[0], max: wk[1] });
      $('#routeCtaText').textContent = t('ship.cta', { port: p.name });
      $('#routeCta').dataset.port = p.name + ', ' + App.countryName(p.cc, 'en');
    }
    function select(id, fromGlobe) {
      var p = port(id);
      if (!p) return;
      current = id;
      region = p.region;
      renderTabs();
      renderCard();
      if (!fromGlobe) globe.focus(id);
    }

    var globe = Globe(canvas, function (id) { select(id, true); });
    globe.resize();
    globe.focus(current, true);
    renderTabs();
    renderCard();

    $('#regionTabs').addEventListener('click', function (e) {
      var b = e.target.closest('[data-region]');
      if (!b) return;
      region = b.getAttribute('data-region');
      var first = SITE.ports.filter(function (p) { return p.region === region; })[0];
      if (first) select(first.id); else renderTabs();
    });
    $('#portButtons').addEventListener('click', function (e) {
      var b = e.target.closest('[data-port]');
      if (b) select(b.getAttribute('data-port'));
    });
    var search = $('#portSearch');
    search.addEventListener('change', function () {
      var q = search.value.trim().toLowerCase();
      if (!q) return;
      var hit = SITE.ports.filter(function (p) {
        var hay = (p.name + ', ' + App.countryName(p.cc) + ' ' + App.countryName(p.cc, 'en')).toLowerCase();
        return hay.indexOf(q) > -1 || q.indexOf(p.name.toLowerCase()) > -1;
      })[0];
      if (hit) select(hit.id); else renderCard(search.value.trim());
    });
    $('#routeCta').addEventListener('click', function () {
      if (App.prefill) App.prefill({ type: 'quote', incoterm: 'CIF', port: $('#routeCta').dataset.port || '' });
    });

    var timer = 0;
    addEventListener('resize', function () { clearTimeout(timer); timer = setTimeout(globe.resize, 150); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { globe.setVisible(en[0].isIntersecting && !document.hidden); }, { threshold: 0.05 }).observe(canvas);
    } else globe.setVisible(true);
    document.addEventListener('visibilitychange', function () {
      var r = canvas.getBoundingClientRect();
      globe.setVisible(!document.hidden && r.bottom > 0 && r.top < innerHeight);
    });
    App.onLang(function () { renderTabs(); renderCard(); globe.draw(); });
  });
})();
