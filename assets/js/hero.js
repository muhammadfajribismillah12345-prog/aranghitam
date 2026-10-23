/* Hero visual: floating CSS-3D charcoal cubes (one glowing ember) with pointer
   parallax, and rising ember particles on a canvas. Pauses when off-screen. */
(function () {
  'use strict';

  var App = window.App;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // size [w, h, d] px, position [x, y, z] px, rotation [x, y, z] deg — designed for a 600px stage
  var PIECES = [
    { s: [150, 150, 150], p: [10, 30, 40], r: [-18, 38, 4], hot: true, dur: 9 },
    { s: [112, 112, 112], p: [-178, -112, -90], r: [22, -28, 12], dur: 8, delay: -2, warm: true },
    { s: [96, 96, 96], p: [178, -150, -40], r: [-32, 52, -14], dur: 10, delay: -5 },
    { s: [84, 84, 84], p: [192, 128, 30], r: [16, 22, 32], dur: 7.5, delay: -1, warm: true },
    { s: [74, 74, 74], p: [-186, 152, 50], r: [-12, -42, 16], dur: 8.5, delay: -3, warm: true },
    { s: [104, 70, 104], p: [40, -214, -130], r: [40, 16, -22], dur: 11, delay: -6 },
    { s: [52, 52, 52], p: [-72, -252, -210], r: [32, 62, 10], dur: 9.5, delay: -4 }
  ];

  function buildCubes(rig) {
    rig.innerHTML = PIECES.map(function (c) {
      var w = c.s[0], h = c.s[1], d = c.s[2];
      var faces = [
        ['front', w, h, 0, 0, 'translateZ(' + d / 2 + 'px)'],
        ['back', w, h, 0, 0, 'rotateY(180deg) translateZ(' + d / 2 + 'px)'],
        ['right', d, h, (w - d) / 2, 0, 'rotateY(90deg) translateZ(' + w / 2 + 'px)'],
        ['left', d, h, (w - d) / 2, 0, 'rotateY(-90deg) translateZ(' + w / 2 + 'px)'],
        ['top', w, d, 0, (h - d) / 2, 'rotateX(90deg) translateZ(' + h / 2 + 'px)'],
        ['bottom', w, d, 0, (h - d) / 2, 'rotateX(-90deg) translateZ(' + h / 2 + 'px)']
      ];
      var pos = '--x:' + c.p[0] + 'px;--y:' + c.p[1] + 'px;--z:' + c.p[2] + 'px;--a:' + c.r[0] + 'deg;--b:' + c.r[1] + 'deg;--c:' + c.r[2] + 'deg;' +
        'width:' + w + 'px;height:' + h + 'px;margin:' + (-h / 2) + 'px 0 0 ' + (-w / 2) + 'px';
      return '<div class="cube' + (c.hot ? ' cube--hot' : '') + (c.warm ? ' cube--warm' : '') + '" style="' + pos + '">' +
        '<div class="cube__body" style="width:' + w + 'px;height:' + h + 'px;--dur:' + c.dur + 's;--delay:' + (c.delay || 0) + 's">' +
        faces.map(function (f) {
          return '<i class="face face--' + f[0] + '" style="width:' + f[1] + 'px;height:' + f[2] + 'px;left:' + f[3] + 'px;top:' + f[4] + 'px;transform:' + f[5] + '"></i>';
        }).join('') + '</div></div>';
    }).join('');
  }

  function makeSprite(core, mid) {
    var c = document.createElement('canvas');
    c.width = c.height = 32;
    var g = c.getContext('2d'), grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, core);
    grad.addColorStop(0.25, mid);
    grad.addColorStop(0.6, 'rgba(255,90,20,0.18)');
    grad.addColorStop(1, 'rgba(255,90,20,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 32, 32);
    return c;
  }

  function Embers(canvas, hero, visual) {
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, parts = [], running = false, last = 0;
    var src = { x: 0, y: 0, w: 300 };
    var sprites = [makeSprite('#fff6dc', '#ffb36b'), makeSprite('#ffe2b0', '#ff8a3d'), makeSprite('#ffd0a0', '#ff5a14')];

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = hero.clientWidth;
      H = hero.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var hr = hero.getBoundingClientRect(), vr = visual.getBoundingClientRect();
      src.x = vr.left + vr.width * 0.52 - hr.left;
      src.y = vr.top + vr.height * 0.58 - hr.top;
      src.w = vr.width;
    }
    function spawn() {
      var fromCube = Math.random() < 0.72;
      parts.push({
        x: fromCube ? src.x + (Math.random() - 0.5) * src.w * 0.32 : Math.random() * W,
        y: fromCube ? src.y + (Math.random() - 0.3) * 50 : H + 10,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -(0.35 + Math.random() * 0.95),
        life: 0,
        max: 150 + Math.random() * 230,
        r: 0.7 + Math.random() * 1.9,
        c: (Math.random() * 3) | 0,
        wob: Math.random() * Math.PI * 2
      });
    }
    function frame(ts) {
      if (!running) return;
      var dt = last ? Math.min(2.5, (ts - last) / 16.67) : 1;
      last = ts;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      if (parts.length < 95 && Math.random() < 0.55 * dt) spawn();
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i];
        p.life += dt;
        p.wob += 0.03 * dt;
        p.x += (p.vx + Math.sin(p.wob) * 0.28) * dt;
        p.y += p.vy * dt;
        var k = p.life / p.max;
        if (k >= 1 || p.y < -20) { parts.splice(i, 1); continue; }
        ctx.globalAlpha = (k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85) * 0.95;
        var s = p.r * 8;
        ctx.drawImage(sprites[p.c], p.x - s / 2, p.y - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(frame);
    }
    return {
      resize: resize,
      start: function () { if (running) return; running = true; last = 0; requestAnimationFrame(frame); },
      stop: function () { running = false; }
    };
  }

  App.ready(function () {
    var hero = document.getElementById('top');
    var rig = document.getElementById('cubeRig');
    var visual = hero && hero.querySelector('.hero__visual');
    if (!hero || !rig || !visual) return;
    buildCubes(rig);

    function fit() { rig.style.setProperty('--scene-scale', Math.min(1, visual.clientWidth / 600).toFixed(3)); }
    fit();

    var embers = reduce ? null : Embers(document.getElementById('heroEmbers'), hero, visual);
    if (embers) embers.resize();
    var resizeTimer = 0;
    addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { fit(); if (embers) embers.resize(); }, 150);
    });
    if (reduce) return;

    // pointer parallax + idle sway
    var target = { x: 0, y: 0 }, cur = { x: 0, y: 0 }, visible = true, rafOn = false;
    addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      target.x = (e.clientX / innerWidth) * 2 - 1;
      target.y = (e.clientY / innerHeight) * 2 - 1;
    }, { passive: true });
    function tick(ts) {
      if (!visible) { rafOn = false; return; }
      cur.x += (target.x - cur.x) * 0.05;
      cur.y += (target.y - cur.y) * 0.05;
      var sway = Math.sin(ts / 3200) * 7;
      rig.style.setProperty('--ry', (cur.x * 16 + sway).toFixed(2) + 'deg');
      rig.style.setProperty('--rx', (-10 - cur.y * 9).toFixed(2) + 'deg');
      requestAnimationFrame(tick);
    }
    function setVisible(v) {
      visible = v;
      if (v) {
        if (!rafOn) { rafOn = true; requestAnimationFrame(tick); }
        if (embers) embers.start();
      } else if (embers) embers.stop();
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { setVisible(entries[0].isIntersecting && !document.hidden); }, { threshold: 0.02 }).observe(hero);
    } else setVisible(true);
    document.addEventListener('visibilitychange', function () {
      var r = hero.getBoundingClientRect();
      setVisible(!document.hidden && r.bottom > 0 && r.top < innerHeight);
    });
  });
})();
