/* Intro (2 s): Wald-Luftbild → der Detektor schwingt darüber und legt das Geländemodell frei
   → Zoom durch den Bauch des ersten „a“ von HeimatScan in die App. Alles wird als Skizze gezeichnet (offline, keine Bilder nötig). */
(() => {
  'use strict';
  const cv = document.getElementById('intro');
  if (!cv) return;
  const W = innerWidth, H = innerHeight, dpr = Math.min(window.devicePixelRatio || 1, 2);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  const ctx = cv.getContext('2d');
  const TAU = Math.PI * 2, rad = d => d * Math.PI / 180;
  let seed = 20251;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const mk = (w = W, h = H, s = dpr) => {
    const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w * s)); c.height = Math.max(1, Math.round(h * s));
    const x = c.getContext('2d'); x.scale(s, s); return [c, x];
  };
  const INK = '#0f110c', PAPER = '#f2efe6', LILA = '#a78bfa';

  /* ---------- gemeinsame Geländezüge: Waldweg, Gräben, Trichter ---------- */
  const path = [[-0.1, 0.80], [0.22, 0.69], [0.40, 0.74], [0.60, 0.58], [0.82, 0.52], [1.12, 0.38]].map(([x, y]) => [x * W, y * H]);
  const pathPts = [];
  for (let i = 0; i < path.length - 1; i++) for (let k = 0; k < 12; k++) {
    const t = k / 12; pathPts.push([path[i][0] + (path[i + 1][0] - path[i][0]) * t, path[i][1] + (path[i + 1][1] - path[i][1]) * t]);
  }
  const distPath = (x, y) => { let m = 1e9; for (const p of pathPts) { const d = (p[0] - x) ** 2 + (p[1] - y) ** 2; if (d < m) m = d; } return Math.sqrt(m); };
  function tracePath(c, ox = 0, oy = 0) {
    c.beginPath(); c.moveTo(path[0][0] + ox, path[0][1] + oy);
    for (let i = 1; i < path.length - 1; i++) {
      const mx = (path[i][0] + path[i + 1][0]) / 2, my = (path[i][1] + path[i + 1][1]) / 2;
      c.quadraticCurveTo(path[i][0] + ox, path[i][1] + oy, mx + ox, my + oy);
    }
    const l = path[path.length - 1]; c.lineTo(l[0] + ox, l[1] + oy);
  }
  function zigzag(x0, y0, x1, y1, seg, amp) {
    const pts = [], n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / seg));
    const nx = -(y1 - y0), ny = x1 - x0, nl = Math.hypot(nx, ny);
    for (let i = 0; i <= n; i++) {
      const t = i / n, a = (i % 2 ? 1 : -1) * amp * (0.6 + rnd() * 0.5) * (i === 0 || i === n ? 0 : 1);
      pts.push([x0 + (x1 - x0) * t + nx / nl * a, y0 + (y1 - y0) * t + ny / nl * a]);
    }
    return pts;
  }
  const trenches = [
    zigzag(W * 0.06, H * 0.20, W * 0.74, H * 0.29, W * 0.07, H * 0.018),
    zigzag(W * 0.30, H * 0.91, W * 0.98, H * 0.80, W * 0.06, H * 0.015),
    zigzag(W * 0.70, H * 0.13, W * 0.93, H * 0.44, W * 0.05, H * 0.012)
  ];
  const craters = Array.from({ length: 9 }, () => ({ x: W * (0.08 + rnd() * 0.84), y: H * (0.08 + rnd() * 0.86), r: 5 + rnd() * 9 }));

  /* ---------- Szene A: Wald von oben, als Skizze ---------- */
  function grain(c, alpha) {
    const [g, gx] = mk(96, 96, 1), id = gx.createImageData(96, 96);
    for (let i = 0; i < id.data.length; i += 4) { const v = rnd() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    gx.putImageData(id, 0, 0);
    c.save(); c.globalAlpha = alpha; c.globalCompositeOperation = 'overlay'; c.fillStyle = c.createPattern(g, 'repeat'); c.fillRect(0, 0, W, H); c.restore();
  }
  function vignette(c, a) {
    const g = c.createRadialGradient(W / 2, H * 0.48, Math.min(W, H) * 0.25, W / 2, H * 0.5, Math.max(W, H) * 0.75);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${a})`);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
  }
  function forest() {
    const [c, x] = mk();
    const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#2a3a22'); g.addColorStop(1, '#152011');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.lineCap = x.lineJoin = 'round';
    tracePath(x); x.strokeStyle = '#3b2f1d'; x.lineWidth = 15; x.stroke();
    tracePath(x); x.strokeStyle = '#b9a67c'; x.lineWidth = 11; x.stroke();
    tracePath(x, 1.5, -1); x.strokeStyle = 'rgba(80,62,36,.6)'; x.lineWidth = 0.9; x.stroke();
    // Baumkronen
    const step = 12.5, crowns = [];
    for (let yy = -10; yy < H + 10; yy += step * 0.86) for (let xx = -10; xx < W + 10; xx += step) {
      const px = xx + (rnd() - 0.5) * step * 0.9 + ((yy / step) % 2) * step * 0.5, py = yy + (rnd() - 0.5) * step * 0.8;
      const d = distPath(px, py);
      if (d < 9 || (d < 15 && rnd() < 0.6)) continue;
      if (rnd() < 0.035) continue; // kleine Lichtungen
      crowns.push([px, py, 5.5 + rnd() * 6.5, rnd()]);
    }
    crowns.sort((a, b) => a[1] - b[1]);
    for (const [px, py, r, v] of crowns) {
      x.fillStyle = 'rgba(4,8,3,.38)'; x.beginPath(); x.arc(px + r * 0.35, py + r * 0.4, r, 0, TAU); x.fill();
      const h = 88 + v * 30, l = 17 + v * 14, s = 28 + v * 20;
      x.fillStyle = `hsl(${h},${s}%,${l}%)`;
      x.beginPath();
      for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, rr = r * (0.82 + rnd() * 0.3); k ? x.lineTo(px + Math.cos(a) * rr, py + Math.sin(a) * rr) : x.moveTo(px + Math.cos(a) * rr, py + Math.sin(a) * rr); }
      x.closePath(); x.fill();
      x.strokeStyle = 'rgba(8,14,6,.55)'; x.lineWidth = 0.8; x.stroke();
      x.strokeStyle = `hsla(${h - 10},60%,${l + 28}%,.35)`; x.lineWidth = 1.1;
      x.beginPath(); x.arc(px - r * 0.15, py - r * 0.15, r * 0.6, rad(190), rad(280)); x.stroke();
      x.strokeStyle = 'rgba(5,10,4,.4)'; x.lineWidth = 0.7;
      for (let k = 0; k < 3; k++) { const o = (k - 1) * r * 0.32; x.beginPath(); x.moveTo(px + o, py + r * 0.15); x.lineTo(px + o + r * 0.45, py + r * 0.6); x.stroke(); }
    }
    grain(x, 0.10); vignette(x, 0.55);
    return c;
  }

  /* ---------- Szene B: Geländemodell (Schummerung) mit Hohlweg, Gräben, Trichtern ---------- */
  function dgm() {
    const s = 3, w = Math.ceil(W / s), h = Math.ceil(H / s), hg = new Float32Array(w * h);
    const oct = [[24, 1], [11, 0.45], [5, 0.18]].map(([cell, amp]) => {
      const gw = Math.ceil(w / cell) + 2, gh = Math.ceil(h / cell) + 2, g = Float32Array.from({ length: gw * gh }, rnd);
      return { cell, amp, gw, g };
    });
    const sm = t => t * t * (3 - 2 * t);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let v = 0;
      for (const o of oct) {
        const fx = x / o.cell, fy = y / o.cell, ix = fx | 0, iy = fy | 0, tx = sm(fx - ix), ty = sm(fy - iy), G = o.g, gw = o.gw;
        const a = G[iy * gw + ix], b = G[iy * gw + ix + 1], c2 = G[(iy + 1) * gw + ix], d = G[(iy + 1) * gw + ix + 1];
        v += o.amp * (a + (b - a) * tx + (c2 - a) * ty + (a - b - c2 + d) * tx * ty);
      }
      const X = x * s, Y = y * s, dp = distPath(X, Y);
      v -= 0.55 * Math.exp(-((dp / 9) ** 2)); v += 0.12 * Math.exp(-(((dp - 13) / 5) ** 2));
      hg[y * w + x] = v * 9;
    }
    const [sc, sx] = mk(w, h, 1), id = sx.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, l = hg[y * w + Math.max(0, x - 1)], r = hg[y * w + Math.min(w - 1, x + 1)];
      const u = hg[Math.max(0, y - 1) * w + x], d = hg[Math.min(h - 1, y + 1) * w + x];
      const sh = Math.max(0, Math.min(1, 0.6 + ((l - r) + (u - d)) * 0.55));
      const g = 70 + sh * 160;
      id.data[i * 4] = g + 6; id.data[i * 4 + 1] = g + 4; id.data[i * 4 + 2] = g - 2; id.data[i * 4 + 3] = 255;
    }
    sx.putImageData(id, 0, 0);
    const [c, x] = mk();
    x.imageSmoothingQuality = 'high'; x.drawImage(sc, 0, 0, W, H);
    // Gräben & Trichter: Licht von Nordwest → Nordwand dunkel, Südostwand hell
    x.lineCap = x.lineJoin = 'round';
    const line = (pts, ox, oy) => { x.beginPath(); pts.forEach(([px, py], i) => i ? x.lineTo(px + ox, py + oy) : x.moveTo(px + ox, py + oy)); x.stroke(); };
    for (const t of trenches) {
      x.strokeStyle = 'rgba(28,26,22,.75)'; x.lineWidth = 2.6; line(t, -1.3, -1.3);
      x.strokeStyle = 'rgba(255,253,245,.75)'; x.lineWidth = 2.2; line(t, 1.3, 1.3);
      x.strokeStyle = 'rgba(120,116,106,1)'; x.lineWidth = 1.6; line(t, 0, 0);
    }
    for (const k of craters) {
      x.lineWidth = 2;
      x.strokeStyle = 'rgba(30,28,24,.7)'; x.beginPath(); x.arc(k.x, k.y, k.r, rad(150), rad(330)); x.stroke();
      x.strokeStyle = 'rgba(255,253,245,.7)'; x.beginPath(); x.arc(k.x, k.y, k.r, rad(-30), rad(150)); x.stroke();
    }
    // Bleistift-Schraffur für den Skizzen-Charakter
    x.strokeStyle = 'rgba(40,38,32,.06)'; x.lineWidth = 1;
    for (let i = -H; i < W; i += 7) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + H * 0.6, H); x.stroke(); }
    grain(x, 0.12); vignette(x, 0.45);
    return c;
  }

  /* ---------- Schriftzug „HeimatScan“: feine, lineare Skizzenschrift aus eigenen Strichen ---------- */
  const LW = 5.5; // Strichstärke in Glyphen-Einheiten (Versalhöhe 100, x-Höhe ab y=38)
  const GLYPH = {
    H: { w: 66, d(c) { c.moveTo(0, 0); c.lineTo(0, 100); c.moveTo(66, 0); c.lineTo(66, 100); c.moveTo(0, 51); c.lineTo(66, 51); } },
    e: { w: 54, d(c) { c.moveTo(1, 69); c.lineTo(54, 69); c.ellipse(27.5, 69, 26.5, 31, 0, 0, rad(42), true); } },
    i: { w: 6, d(c) { c.moveTo(3, 38); c.lineTo(3, 100); c.moveTo(3 + 0.01, 17); c.lineTo(3, 17); } },
    m: { w: 82, d(c) { c.moveTo(0, 38); c.lineTo(0, 100); c.moveTo(0, 60); c.arc(20.5, 60, 20.5, Math.PI, 0); c.lineTo(41, 100); c.moveTo(41, 60); c.arc(61.5, 60, 20.5, Math.PI, 0); c.lineTo(82, 100); } },
    a: { w: 56, d(c) { c.moveTo(56, 38); c.lineTo(56, 100); c.moveTo(54, 69); c.ellipse(27.5, 69, 26.5, 31, 0, 0, TAU); } },
    t: { w: 32, d(c) { c.moveTo(11, 12); c.lineTo(11, 84); c.quadraticCurveTo(11, 100, 30, 98); c.moveTo(0, 40); c.lineTo(31, 40); } },
    S: { w: 60, d(c) { c.ellipse(30, 26, 27, 24, 0, rad(-20), rad(90), true); c.lineTo(30, 50); c.ellipse(30, 75, 28, 25, 0, rad(-90), rad(160), false); } },
    c: { w: 52, d(c) { c.ellipse(30, 69, 29, 31, 0, rad(-42), rad(42), true); } },
    n: { w: 42, d(c) { c.moveTo(0, 38); c.lineTo(0, 100); c.moveTo(0, 60); c.arc(21, 60, 21, Math.PI, 0); c.lineTo(42, 100); } }
  };
  const word = (str, gap = 15) => { let x = 0; const out = []; for (const ch of str) { out.push([ch, x]); x += GLYPH[ch].w + gap; } return { glyphs: out, w: x - gap }; };
  const big = word('HeimatScan');
  const k = Math.min(W * 0.80 / big.w, H * 0.075 / 100);
  const tx = (W - big.w * k) / 2, ty = H * 0.47 - 50 * k;
  const aX = big.glyphs.find(g => g[0] === 'a')[1]; // erstes „a“
  let holeX = tx + (aX + 27.5) * k, holeY = ty + 69 * k; // Mitte des Bauchs vom ersten „a“
  let zoomMax = 90;

  /* ---------- HeimatScan-Logo (Bilddatei). Fällt auf die gezeichnete Schrift zurück, falls es nicht lädt. ---------- */
  const LOGO_W = 1400, LOGO_H = 202;
  const TRI = [[606, 80.5], [592, 107.4], [620.1, 107.4]]; // Innenfläche des ersten „A“ (Pixel in der Logo-Datei)
  const logoImg = new Image(); logoImg.decoding = 'async'; logoImg.src = 'icons/heimatscan-logo.png';
  let useLogo = false, lk = 1, lx = 0, ly = 0, triPts = null;
  function useLogoLayout() {
    useLogo = true;
    lk = Math.min(W * 0.88 / LOGO_W, H * 0.12 / LOGO_H);
    lx = (W - LOGO_W * lk) / 2; ly = H * 0.47 - LOGO_H * lk / 2;
    const cx = (TRI[0][0] + TRI[1][0] + TRI[2][0]) / 3, cy = (TRI[0][1] + TRI[1][1] + TRI[2][1]) / 3;
    // etwas kleiner als die Innenfläche, damit die schwarze Kontur stehen bleibt
    triPts = TRI.map(([px, py]) => [lx + (cx + (px - cx) * 0.72) * lk, ly + (cy + (py - cy) * 0.72) * lk]);
    holeX = lx + cx * lk; holeY = ly + cy * lk;
    const side = (TRI[2][0] - TRI[1][0]) * 0.72 * lk;
    zoomMax = Math.max(90, 4.6 * Math.hypot(W, H) / side); // bis das Dreieck den ganzen Bildschirm füllt (Dreieck braucht mehr als ein Kreis)
  }
  function counterPath(c) { // Innenraum, durch den das Intro in die App fliegt (Bildschirm-Koordinaten)
    if (useLogo) { c.beginPath(); c.moveTo(...triPts[0]); c.lineTo(...triPts[1]); c.lineTo(...triPts[2]); c.closePath(); return; }
    c.save(); c.translate(tx + aX * k, ty); c.scale(k, k);
    c.beginPath(); c.ellipse(27.5, 69, 26.5 - LW / 2, 31 - LW / 2, 0, 0, TAU);
    c.restore();
  }
  function lettering() {
    const [c, x] = mk();
    if (useLogo) {
      x.save(); x.shadowColor = 'rgba(0,0,0,.55)'; x.shadowBlur = 18; x.shadowOffsetY = 4;
      x.imageSmoothingQuality = 'high'; x.drawImage(logoImg, lx, ly, LOGO_W * lk, LOGO_H * lk); x.restore();
      return c;
    }
    const pass = (lw, style, ox = 0, oy = 0, jitter = 0) => {
      for (const [ch, gx] of big.glyphs) {
        x.save(); x.translate(tx + ox + gx * k, ty + oy); x.scale(k, k);
        if (jitter) x.rotate(jitter * (rnd() - 0.5));
        x.beginPath(); GLYPH[ch].d(x); x.lineWidth = lw; x.strokeStyle = style; x.lineCap = 'round'; x.lineJoin = 'round'; x.stroke();
        x.restore();
      }
    };
    // Hilfslinien wie auf einem Skizzenblatt: Oberlinie, x-Höhe, Grundlinie
    x.strokeStyle = 'rgba(242,239,230,.30)'; x.lineWidth = 0.7;
    for (const yy of [ty, ty + 38 * k, ty + 100 * k]) { x.beginPath(); x.moveTo(tx - 26, yy); x.lineTo(tx + big.w * k + 26, yy); x.stroke(); }
    x.beginPath(); x.moveTo(holeX, ty - 16); x.lineTo(holeX, ty + 100 * k + 16); x.setLineDash([2, 4]); x.stroke(); x.setLineDash([]);
    pass(LW + 7, 'rgba(0,0,0,.42)', 1.5, 2.5);          // weicher Schatten für Lesbarkeit
    pass(LW + 2.2, INK);                                  // Tuschekontur
    pass(LW, PAPER);                                      // Strich
    pass(1.1, 'rgba(242,239,230,.55)', 1.6, -1.4, 0.03);  // zweiter, leicht versetzter Bleistiftstrich
    pass(0.9, 'rgba(15,17,12,.45)', -1.2, 1.1, 0.03);
    x.save(); counterPath(x); x.strokeStyle = 'rgba(167,139,250,.9)'; x.lineWidth = 1.1; x.setLineDash([2.5, 3]); x.stroke(); x.restore();
    return c;
  }
  /* „powered by LAMPYRIUS“ unten – mit Logo-Datei, falls vorhanden */
  const logo = new Image(); let logoOk = false;
  logo.onload = () => { logoOk = logo.naturalWidth > 0; }; logo.src = 'icons/lampyrius-logo.png';
  function powered(c, alpha) {
    if (alpha <= 0) return;
    const y = H - Math.max(34, H * 0.06);
    c.save(); c.globalAlpha = alpha; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = 6;
    c.fillStyle = 'rgba(242,239,230,.82)'; c.font = '300 11px -apple-system, "SF Pro Text", system-ui, sans-serif';
    c.fillText('powered by', W / 2, y - (logoOk ? 30 : 18));
    if (logoOk) {
      // Logo in Originalfarben auf heller Plakette, damit das Dunkelblau auf dem Wald lesbar bleibt
      const h = 22, w = h * logo.naturalWidth / logo.naturalHeight, px = 10, py = 6;
      c.shadowBlur = 10; c.fillStyle = 'rgba(242,239,230,.94)';
      c.beginPath(); c.roundRect ? c.roundRect(W / 2 - w / 2 - px, y - h + 4 - py, w + 2 * px, h + 2 * py, 10) : c.rect(W / 2 - w / 2 - px, y - h + 4 - py, w + 2 * px, h + 2 * py); c.fill();
      c.shadowBlur = 0; c.drawImage(logo, W / 2 - w / 2, y - h + 4, w, h);
    } else {
      c.fillStyle = '#19b7a8'; c.font = '600 15px -apple-system, "SF Pro Display", system-ui, sans-serif';
      if ('letterSpacing' in c) c.letterSpacing = '3px';
      c.fillText('LAMPYRIUS', W / 2, y);
    }
    c.restore();
  }

  /* ---------- Metalldetektor als Tuschezeichnung ---------- */
  const pivot = [W * 0.5, H * 1.5], swingR = H * 1.16;
  function detector(c, ang) {
    const cx = pivot[0] + swingR * Math.sin(ang), cy = pivot[1] - swingR * Math.cos(ang);
    const dx = pivot[0] - cx, dy = pivot[1] - cy, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
    const L = Math.min(300, len * 0.6), sc = Math.min(1.7, Math.max(1.15, W / 290));
    c.save(); c.translate(cx, cy); c.rotate(Math.atan2(uy, ux) - Math.PI / 2); c.scale(sc, sc);
    const ink = (lw, col, fn) => { c.beginPath(); fn(); c.lineWidth = lw; c.strokeStyle = col; c.stroke(); };
    const both = (lw, fn) => { ink(lw + 3, INK, fn); ink(lw, PAPER, fn); };
    c.lineCap = 'round'; c.lineJoin = 'round';
    // Suchspule (flach auf dem Boden → Ellipse)
    c.fillStyle = 'rgba(167,139,250,.10)'; c.beginPath(); c.ellipse(0, 0, 44, 28, 0, 0, TAU); c.fill();
    both(6, () => c.ellipse(0, 0, 44, 28, 0, 0, TAU));
    ink(1.2, 'rgba(15,17,12,.7)', () => c.ellipse(0, 0, 30, 17, 0, 0, TAU));
    ink(0.8, 'rgba(242,239,230,.55)', () => { for (let i = -2; i <= 2; i++) { c.moveTo(i * 10 - 4, -16); c.lineTo(i * 10 + 4, 16); } });
    // Gestänge, Griff, Armstütze, Bedienteil
    both(4, () => { c.moveTo(0, 6); c.lineTo(0, L * 0.55); });
    both(5.5, () => { c.moveTo(0, L * 0.53); c.lineTo(0, L); });
    both(3, () => { c.moveTo(-6, 4); c.lineTo(0, 14); c.lineTo(6, 4); });
    both(7, () => { c.moveTo(0, L * 0.72); c.lineTo(9, L * 0.86); });
    ink(0.9, 'rgba(15,17,12,.8)', () => { for (let i = 0; i < 5; i++) { const t = L * (0.735 + i * 0.024); c.moveTo(2 + i * 1.3, t - 2); c.lineTo(7 + i * 1.3, t + 2); } });
    both(4, () => { c.moveTo(-10, L * 0.94); c.quadraticCurveTo(0, L * 1.02, 10, L * 0.94); });
    c.fillStyle = INK; c.beginPath(); c.roundRect ? c.roundRect(-9, L * 0.6, 18, 26, 4) : c.rect(-9, L * 0.6, 18, 26); c.fill();
    c.lineWidth = 1.6; c.strokeStyle = PAPER; c.stroke();
    c.fillStyle = LILA; c.beginPath(); c.arc(0, L * 0.6 + 8, 2.4, 0, TAU); c.fill();
    c.restore();
    return [cx, cy, ux, uy];
  }

  /* ---------- Ablauf ---------- */
  const T_SWEEP0 = 220, T_SWEEP1 = 1180, T_ZOOM0 = 1380, T_END = 2000; // 2 s
  const A0 = rad(-30), A1 = rad(30);
  const ease = t => (1 - Math.cos(Math.PI * t)) / 2; // gleichmäßiger Schwung, damit man den Detektor sieht
  let A, B, T, t0 = 0, done = false;
  function finish() {
    if (done) return; done = true;
    cv.style.transition = 'opacity .12s'; cv.style.opacity = '0';
    setTimeout(() => cv.remove(), 140);
    document.documentElement.classList.remove('intro-on');
  }
  cv.addEventListener('pointerdown', finish);
  if (reduce && !/intro-t=/.test(location.hash)) { setTimeout(finish, 250); return; }

  const dbg = /intro-t=(\d+)/.exec(location.hash); // Prüfmodus: einzelnes Bild zum Zeitpunkt t
  function frame(now) {
    if (done) return;
    if (!t0) { t0 = now; cv.style.background = 'transparent'; }
    const t = dbg ? +dbg[1] : now - t0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, W, H);
    if (t < T_ZOOM0) {
      ctx.drawImage(A, 0, 0, W, H);
      const u = Math.min(1, Math.max(0, (t - T_SWEEP0) / (T_SWEEP1 - T_SWEEP0)));
      const ang = A0 + (A1 - A0) * ease(u);
      if (u >= 1) ctx.drawImage(B, 0, 0, W, H);
      else if (t >= T_SWEEP0) {
        // Gelände nur im Fächer, den die Spule schon überstrichen hat (Radar-Wisch um den Drehpunkt)
        const cx = pivot[0] + swingR * Math.sin(ang), cy = pivot[1] - swingR * Math.cos(ang);
        let dx = cx - pivot[0], dy = cy - pivot[1]; const l = Math.hypot(dx, dy); dx /= l; dy /= l;
        const F = 6000;
        ctx.save(); ctx.beginPath(); ctx.moveTo(pivot[0], pivot[1]);
        for (let a = A0; a < ang; a += rad(4)) ctx.lineTo(pivot[0] + Math.sin(a) * F, pivot[1] - Math.cos(a) * F);
        ctx.lineTo(pivot[0] + dx * F, pivot[1] + dy * F); ctx.closePath(); ctx.clip();
        ctx.drawImage(B, 0, 0, W, H); ctx.restore();
        if (u < 1) {
          // Signal-Kante und Echo-Ringe an der Spule
          ctx.lineCap = 'round';
          for (const [lw, a] of [[10, 0.12], [3, 0.35], [1.2, 0.95]]) { ctx.strokeStyle = `rgba(167,139,250,${a})`; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(pivot[0], pivot[1]); ctx.lineTo(pivot[0] + dx * F, pivot[1] + dy * F); ctx.stroke(); }
          for (let r = 0; r < 3; r++) {
            const ph = ((t / 240) + r / 3) % 1;
            ctx.strokeStyle = `rgba(167,139,250,${0.55 * (1 - ph)})`; ctx.lineWidth = 1.4;
            ctx.beginPath(); ctx.ellipse(cx, cy, 30 + ph * 70, 19 + ph * 45, Math.atan2(dy, dx) + Math.PI / 2, 0, TAU); ctx.stroke();
          }
        }
      }
      ctx.drawImage(T, 0, 0, W, H);
      if (t >= T_SWEEP0 - 120 && u < 1) detector(ctx, ang);
      powered(ctx, Math.min(1, t / 200));
    } else {
      // Zoom durch das erste „A“
      const u = Math.min(1, (t - T_ZOOM0) / (T_END - T_ZOOM0)), e = useLogo ? Math.pow(Math.min(1, u / 0.82), 2.2) : u * u * u, s = Math.exp(Math.log(zoomMax) * e);
      ctx.translate(holeX, holeY); ctx.scale(s, s); ctx.translate(-holeX, -holeY);
      ctx.drawImage(B, 0, 0, W, H); ctx.drawImage(T, 0, 0, W, H);
      ctx.globalCompositeOperation = 'destination-out'; counterPath(ctx); ctx.fill();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalCompositeOperation = 'source-over'; powered(ctx, 1 - u * 3);
      if (u > 0.82) cv.style.opacity = String(1 - (u - 0.82) / 0.18);
      if (u >= 1 && !dbg) return finish();
    }
    if (!dbg) requestAnimationFrame(frame);
  }
  function start() {
    try {
      A = forest(); B = dgm(); T = lettering();
      requestAnimationFrame(frame);
    } catch (e) { console.warn('Intro', e); finish(); }
  }
  // Logo abwarten (liegt in der App, also sofort da) – höchstens 500 ms, sonst gezeichnete Schrift
  let started = false;
  const go = ok => { if (started) return; started = true; if (ok && logoImg.naturalWidth) useLogoLayout(); start(); };
  (logoImg.decode ? logoImg.decode() : new Promise((r, j) => { logoImg.onload = r; logoImg.onerror = j; })).then(() => go(true), () => go(false));
  setTimeout(() => go(false), 500);
  if (!dbg) setTimeout(finish, 4500); // Sicherheitsnetz
})();
