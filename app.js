/* Blumenkarte – persönliche Foto-Karte für Blumenfunde in Brandenburg & Berlin */
'use strict';

const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem('bk.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('bk.' + k, JSON.stringify(v)); } catch { } }
};
/* ---------- Plattform: Web-App (Safari / Home-Bildschirm) oder echte iPhone-App (Capacitor) ---------- */
const NATIVE = !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform());
const nativePlugins = {};
function plugin(name) { // iPhone-Funktion (Kamera-unabhängig): Dateien, Teilen, Standort
  const C = window.Capacitor; if (!C) return null;
  if (!nativePlugins[name]) nativePlugins[name] = typeof C.registerPlugin === 'function' ? C.registerPlugin(name) : null;
  return nativePlugins[name];
}
function callNative(name, method, opts = {}) {
  const p = plugin(name);
  if (p && typeof p[method] === 'function') return p[method](opts);
  if (window.Capacitor?.nativePromise) return window.Capacitor.nativePromise(name, method, opts);
  return Promise.reject(new Error('iPhone-Funktion nicht verfügbar: ' + name));
}
function blobToBase64(blob) {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1] || ''); r.onerror = () => rej(r.error); r.readAsDataURL(blob); });
}
// Dateien teilen bzw. sichern. true = geteilt, false = abgebrochen, null = hier nicht möglich.
// Im Web muss das direkt im Tipp-Handler starten (kein await davor).
async function shareFiles(files, text) {
  if (NATIVE) {
    const uris = [];
    for (const f of files) {
      const path = 'teilen/' + f.name, CH = 4 * 1024 * 1024; // in 4-MB-Stücken, damit auch große Backups passen
      for (let o = 0; o < Math.max(f.size, 1); o += CH) {
        const data = await blobToBase64(f.slice(o, o + CH));
        await callNative('Filesystem', o === 0 ? 'writeFile' : 'appendFile', { path, data, directory: 'CACHE', recursive: true });
      }
      uris.push((await callNative('Filesystem', 'getUri', { path, directory: 'CACHE' })).uri);
    }
    try { await callNative('Share', 'share', text ? { files: uris, text } : { files: uris }); return true; } catch { return false; }
  }
  if (navigator.canShare?.({ files })) {
    try { await navigator.share(text ? { files, text } : { files }); return true; } catch { return false; }
  }
  return null;
}

const ICON = {
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s6.5-5.8 6.5-11A6.5 6.5 0 0 0 5.5 10c0 5.2 6.5 11 6.5 11Z"/><circle cx="12" cy="10" r="2.3"/></svg>',
  nav: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 11 21 3l-8 18-2-8-8-2Z"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4Z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7.5 10.5 12 15l4.5-4.5"/><path d="M4 19h16"/></svg>',
  map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z"/><path d="M9 4v14M15 6v14"/></svg>',
  box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 7l9-4 9 4v10l-9 4-9-4V7Z"/><path d="m3 7 9 4 9-4M12 11v10"/></svg>',
  up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21V9M7.5 13.5 12 9l4.5 4.5"/><path d="M4 4h16"/></svg>',
  img: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m3 18 6-5 4 3 3-2 5 4"/></svg>',
  globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.6 5.7 3.6 9s-1.1 6.3-3.6 9c-2.5-2.7-3.6-5.7-3.6-9S9.5 5.7 12 3Z"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/></svg>'
};

/* ============================================================
   Kartenebenen
   ============================================================ */
const E = 20037508.342789244;
const BB_BOUNDS = L.latLngBounds([51.30, 11.20], [53.62, 14.85]); // Brandenburg + Berlin
const TILES_CACHE = 'tiles-v1';
const LAYERS = {
  dop: { label: 'Luftbild Brandenburg/Berlin', short: 'Luftbild', kind: 'wms', url: 'https://isk.geobasis-bb.de/mapproxy/dop20c/service/wms', layers: 'bebb_dop20c', format: 'image/jpeg', maxNative: 18, bb: true, offline: true, kb: 75, attr: 'Luftbild © GeoBasis-DE/LGB, <a href="https://www.govdata.de/dl-de/by-2-0">dl-de/by-2-0</a>' },
  dgm: { label: 'Geländemodell (DGM 1 m)', short: 'Gelände', kind: 'wms', url: 'https://isk.geobasis-bb.de/mapproxy/dgm/service/wms', layers: 'dgm', format: 'image/jpeg', maxNative: 17, bb: true, offline: true, kb: 45, attr: 'DGM © GeoBasis-DE/LGB, <a href="https://www.govdata.de/dl-de/by-2-0">dl-de/by-2-0</a>' },
  h53: { label: 'Luftbild 1953 (Brandenburg, s/w)', short: '1953', kind: 'wms', url: 'https://isk.geobasis-bb.de/mapproxy/dop100g_1953/service/wms', layers: 'bb_dop100g_1953', format: 'image/jpeg', maxNative: 16, bb: true, offline: true, kb: 40, attr: 'Luftbild 1953 © GeoBasis-DE/LGB, <a href="https://www.govdata.de/dl-de/by-2-0">dl-de/by-2-0</a>' },
  esri: { label: 'Satellit weltweit (Esri)', kind: 'xyz', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', maxNative: 19, attr: 'Esri, Maxar, Earthstar Geographics' },
  osm: { label: 'OpenStreetMap (Wege, Orte)', kind: 'xyz', url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', maxNative: 19, attr: '© OpenStreetMap-Mitwirkende' }
};

function tileUrl(def, z, x, y) {
  if (def.kind === 'xyz') return def.url.replace('{z}', z).replace('{x}', x).replace('{y}', y);
  const size = 2 * E / Math.pow(2, z);
  const minx = -E + x * size, maxy = E - y * size;
  const bbox = [minx, maxy - size, minx + size, maxy].map(n => n.toFixed(2)).join(',');
  // 512 px pro Kachel → gestochen scharf auf dem Retina-Display
  return `${def.url}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=${def.layers}&STYLES=&CRS=EPSG%3A3857&FORMAT=${encodeURIComponent(def.format)}${def.transparent ? '&TRANSPARENT=TRUE' : ''}&WIDTH=512&HEIGHT=512&BBOX=${bbox}`;
}
// Info-Ebene der LGB zum Luftbild 1953 (Aktualitäts-/Abdeckungsübersicht)
const YEARS_DEF = { kind: 'wms', url: 'https://isk.geobasis-bb.de/mapproxy/dop100g_1953/service/wms', layers: 'bb_dop100g-53_info', format: 'image/png', transparent: true, maxNative: 14, bb: true, attr: '' };
const YEARS_LEGEND = `${YEARS_DEF.url}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetLegendGraphic&FORMAT=image%2Fpng&LAYER=${YEARS_DEF.layers}&SLD_VERSION=1.1.0`;

const DefTileLayer = L.TileLayer.extend({
  initialize(def) {
    this.def = def;
    L.TileLayer.prototype.initialize.call(this, '', {
      maxNativeZoom: def.maxNative, maxZoom: 21, attribution: def.attr,
      bounds: def.bb ? BB_BOUNDS : undefined, keepBuffer: 3
    });
  },
  getTileUrl(c) { return tileUrl(this.def, c.z, c.x, c.y); }
});
/* Offline-Kacheln: im Web im Browser-Cache (Service Worker liefert aus),
   in der iPhone-App als Dateien im App-Ordner (ohne iCloud-Backup). */
function h64(s) {
  let a = 0x811c9dc5, b = 0x9e3779b9;
  for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); a = Math.imul(a ^ c, 16777619); b = Math.imul(b ^ c, 2246822507) ^ (b >>> 13); }
  return (a >>> 0).toString(16).padStart(8, '0') + (b >>> 0).toString(16).padStart(8, '0');
}
const tileRel = url => { const h = h64(url); return `${h.slice(0, 2)}/${h}${/image%2Fpng/.test(url) ? '.png' : '.jpg'}`; };
const TileStore = NATIVE ? {
  ok: true, base: null, dir: 'LIBRARY_NO_CLOUD',
  async init() {
    for (const dir of ['LIBRARY_NO_CLOUD', 'LIBRARY']) {
      try { const r = await callNative('Filesystem', 'getUri', { path: 'kacheln', directory: dir }); this.dir = dir; this.base = String(r.uri).replace(/\/$/, ''); return; } catch { }
    }
  },
  localSrc(url) { return this.base && window.Capacitor.convertFileSrc ? window.Capacitor.convertFileSrc(this.base + '/' + tileRel(url)) : null; },
  async has(url) { try { await callNative('Filesystem', 'stat', { path: 'kacheln/' + tileRel(url), directory: this.dir }); return true; } catch { return false; } },
  async download(url) { await callNative('Filesystem', 'downloadFile', { url, path: 'kacheln/' + tileRel(url), directory: this.dir, recursive: true }); return 0; },
  clear() { return callNative('Filesystem', 'rmdir', { path: 'kacheln', directory: this.dir, recursive: true }).catch(() => { }); }
} : {
  ok: 'caches' in window,
  init() { },
  localSrc() { return null; },
  async has(url) { return !!(await (await caches.open(TILES_CACHE)).match(url)); },
  async download(url) {
    const r = await fetchTile(url);
    if (!r.ok && r.type !== 'opaque') throw new Error('HTTP ' + r.status);
    const n = r.type === 'opaque' ? 0 : (await r.clone().blob()).size;
    await (await caches.open(TILES_CACHE)).put(url, r);
    return n;
  },
  clear() { return caches.delete(TILES_CACHE); }
};
TileStore.ready = Promise.resolve(TileStore.init()).catch(() => { });

if (NATIVE) DefTileLayer.include({
  createTile(coords, done) {
    const img = document.createElement('img'); img.alt = ''; img.setAttribute('role', 'presentation');
    const net = this.getTileUrl(coords);
    TileStore.ready.then(() => { // erst wissen, wo die Offline-Kacheln liegen
      const local = TileStore.localSrc(net);
      let usedNet = !local;
      img.onload = () => done(null, img);
      img.onerror = e => { if (!usedNet) { usedNet = true; img.src = net; } else done(e, img); };
      img.src = local || net;
    });
    return img;
  }
});

const lastView = store.get('view', null);
const map = L.map('map', {
  zoomControl: false, attributionControl: true, maxZoom: 21, minZoom: 6,
  zoomSnap: 0.25, wheelPxPerZoomLevel: 90, tap: false
}).setView(lastView ? [lastView.lat, lastView.lng] : [52.45, 13.4], lastView ? lastView.z : 8);
map.attributionControl.setPrefix(false);
L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);

const layerObjs = {};
let currentLayer = null;
function setLayer(key) {
  if (!LAYERS[key]) key = 'dop';
  if (currentLayer) map.removeLayer(currentLayer);
  currentLayer = layerObjs[key] ||= new DefTileLayer(LAYERS[key]);
  currentLayer.addTo(map).bringToBack();
  applyRelief();
  store.set('layer', key);
  document.querySelectorAll('#seg button').forEach(b => b.classList.toggle('on', b.dataset.layer === key));
}
setLayer(store.get('layer', 'dop'));
// Relief verstärken: Kontrast des Geländemodells anheben, damit flache Gräben hervortreten
function applyRelief() {
  const l = layerObjs.dgm, c = l && l.getContainer && l.getContainer(); if (!c) return;
  const v = store.get('relief', 1);
  c.style.filter = v > 1 ? `contrast(${v}) brightness(${(1 + (v - 1) * .08).toFixed(2)})` : '';
}
let yearsLayer = null;
function setYears(on) {
  store.set('years', on);
  if (on) { yearsLayer ||= new DefTileLayer(YEARS_DEF); yearsLayer.setOpacity(.6).addTo(map); }
  else if (yearsLayer) map.removeLayer(yearsLayer);
}
setYears(store.get('years', false));
$('#seg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setLayer(b.dataset.layer); });
map.on('moveend', () => { const c = map.getCenter(); store.set('view', { lat: c.lat, lng: c.lng, z: map.getZoom() }); });

/* ============================================================
   Eigener Standort
   ============================================================ */
let fix = null, follow = false, meMarker = null, meCircle = null, firstFix = true;
function updateMe() {
  if (!fix) return;
  const ll = [fix.lat, fix.lng];
  if (!meMarker) {
    meCircle = L.circle(ll, { radius: fix.acc, color: '#2f8cff', weight: 1, fillOpacity: .12, interactive: false }).addTo(map);
    meMarker = L.marker(ll, { icon: L.divIcon({ className: 'me-wrap', html: '<div class="me"></div>', iconSize: [20, 20] }), interactive: false, zIndexOffset: 1000 }).addTo(map);
  } else { meMarker.setLatLng(ll); meCircle.setLatLng(ll).setRadius(fix.acc); }
  if (follow) map.panTo(ll, { animate: true });
  if (firstFix) { firstFix = false; if (!lastView) map.setView(ll, 16); }
}
function onGeo(p) {
  fix = { lat: p.coords.latitude, lng: p.coords.longitude, acc: Math.round(p.coords.accuracy), t: Date.now() };
  updateMe();
}
function startGeo() {
  const G = NATIVE ? plugin('Geolocation') : null;
  if (G && typeof G.watchPosition === 'function') {
    Promise.resolve(G.watchPosition({ enableHighAccuracy: true, maximumAge: 0, timeout: 30000 }, (p, err) => {
      if (p) onGeo(p); else if (err) console.warn('Standort', err);
    })).catch(() => toast('Standortzugriff verweigert – in den iPhone-Einstellungen erlauben'));
    return;
  }
  if (!('geolocation' in navigator)) return toast('Standort wird von diesem Gerät nicht unterstützt');
  navigator.geolocation.watchPosition(p => {
    fix = { lat: p.coords.latitude, lng: p.coords.longitude, acc: Math.round(p.coords.accuracy), t: Date.now() };
    updateMe();
  }, err => {
    if (err.code === 1) toast('Standortzugriff verweigert – in den iPhone-Einstellungen erlauben');
  }, { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 });
}
startGeo();
function setFollow(on) { follow = on; $('#btnLocate').classList.toggle('follow', on); }
$('#btnLocate').addEventListener('click', () => {
  if (!fix) return toast('Suche Standort …');
  setFollow(true);
  map.setView([fix.lat, fix.lng], Math.max(map.getZoom(), 16));
});
map.on('dragstart', () => setFollow(false));

function freshFix(maxAgeMs = 120000) { return fix && Date.now() - fix.t < maxAgeMs ? { ...fix } : null; }
function currentPosition(timeout = 12000) {
  const G = NATIVE ? plugin('Geolocation') : null;
  if (G && typeof G.getCurrentPosition === 'function') {
    return G.getCurrentPosition({ enableHighAccuracy: true, timeout, maximumAge: 5000 })
      .then(p => ({ lat: p.coords.latitude, lng: p.coords.longitude, acc: Math.round(p.coords.accuracy), t: Date.now() }), () => null);
  }
  return new Promise(res => {
    if (!navigator.geolocation) return res(null);
    navigator.geolocation.getCurrentPosition(
      p => res({ lat: p.coords.latitude, lng: p.coords.longitude, acc: Math.round(p.coords.accuracy), t: Date.now() }),
      () => res(null), { enableHighAccuracy: true, maximumAge: 5000, timeout });
  });
}

/* ============================================================
   Datenbank (IndexedDB) – Fotos bleiben auf dem iPhone
   ============================================================ */
const IDB = (() => {
  let dbp;
  const open = () => dbp ||= new Promise((res, rej) => {
    const r = indexedDB.open('blumenkarte', 2); // v2: zusätzlich Zeichnungen
    r.onupgradeneeded = () => { const d = r.result; for (const s of ['photos', 'shapes']) if (!d.objectStoreNames.contains(s)) d.createObjectStore(s, { keyPath: 'id' }); };
    r.onsuccess = () => { r.result.onversionchange = () => r.result.close(); res(r.result); };
    r.onerror = () => rej(r.error);
    r.onblocked = () => toast('Bitte die App neu starten (anderes Fenster offen)', 5000);
  });
  return name => {
    const tx = async (mode, fn) => {
      const db = await open();
      return new Promise((res, rej) => {
        const t = db.transaction(name, mode); const req = fn(t.objectStore(name));
        t.oncomplete = () => res(req ? req.result : undefined); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
      });
    };
    return { all: () => tx('readonly', s => s.getAll()), get: id => tx('readonly', s => s.get(id)), put: o => tx('readwrite', s => s.put(o)), del: id => tx('readwrite', s => s.delete(id)) };
  };
})();
const DB = IDB('photos');

let entries = []; // {id, created, lat, lng, acc, title, note, thumb, thumbUrl}
async function loadEntries() {
  const all = await DB.all();
  entries.forEach(e => URL.revokeObjectURL(e.thumbUrl));
  entries = all.map(({ blob, ...m }) => ({ ...m, thumbUrl: URL.createObjectURL(m.thumb) }));
  entries.sort((a, b) => b.created - a.created);
  refresh();
}
function shapesNeedBackup() { return typeof shapes !== 'undefined' && shapes.length > 0 && store.get('shapesChanged', 0) > store.get('lastBackup', 0); }
function updateMenuDot() { $('#menuDot').hidden = !(entries.some(e => !e.inPhotos || e.photosStale) || shapesNeedBackup()); }
function refresh() {
  renderMarkers();
  const c = $('#count'); c.hidden = !entries.length; c.textContent = entries.length;
  updateMenuDot();
  const names = [...new Set(entries.map(e => (e.title || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'de'));
  $('#arten').innerHTML = names.map(n => `<option value="${esc(n)}">`).join('');
}

/* ============================================================
   Foto-Marker (gruppiert wie in der iPhone-Fotos-Karte)
   ============================================================ */
const markerLayer = L.layerGroup().addTo(map);
function renderMarkers() {
  markerLayer.clearLayers();
  const z = map.getZoom(), cell = 62, groups = new Map(), view = map.getBounds().pad(0.6);
  for (const e of entries) {
    if (!view.contains([e.lat, e.lng])) continue;
    const p = map.project([e.lat, e.lng], z);
    const k = Math.floor(p.x / cell) + ':' + Math.floor(p.y / cell);
    let g = groups.get(k); if (!g) groups.set(k, g = { items: [], x: 0, y: 0 });
    g.items.push(e); g.x += p.x; g.y += p.y;
  }
  for (const g of groups.values()) {
    const n = g.items.length, lead = g.items[0]; // Liste ist neu → alt sortiert
    const ll = n === 1 ? [lead.lat, lead.lng] : map.unproject([g.x / n, g.y / n], z);
    const icon = L.divIcon({ className: 'ph-wrap', html: `<div class="ph"><img src="${lead.thumbUrl}" alt="">${n > 1 ? `<span class="cnt">${n}</span>` : ''}</div>`, iconSize: [52, 59], iconAnchor: [26, 59] });
    L.marker(ll, { icon, keyboard: false, riseOnHover: true }).on('click', () => onGroup(g)).addTo(markerLayer);
  }
}
map.on('zoomend moveend', renderMarkers);
function onGroup(g) {
  if (g.items.length === 1) return openDetail(g.items[0].id);
  const b = L.latLngBounds(g.items.map(e => [e.lat, e.lng]));
  const spread = map.distance(b.getSouthWest(), b.getNorthEast());
  if (spread < 4 || map.getZoom() >= 20) openList(g.items, `${g.items.length} Fotos hier`);
  else map.flyToBounds(b.pad(0.4), { maxZoom: 20, duration: .6 });
}

/* ============================================================
   Bottom-Sheet, Toast, Vollbild
   ============================================================ */
let sheetCleanup = null;
function openSheet(title, html, onMount) {
  closeSheet(true);
  $('#shTitle').textContent = title;
  $('#shBody').innerHTML = html; $('#shBody').scrollTop = 0;
  document.body.classList.add('sheet-open');
  sheetCleanup = onMount ? onMount($('#shBody')) : null;
}
function closeSheet(silent) {
  document.body.classList.remove('sheet-open');
  if (typeof sheetCleanup === 'function') sheetCleanup();
  sheetCleanup = null;
  if (!silent) document.activeElement?.blur?.();
}
const hideSheet = () => document.body.classList.remove('sheet-open');
const showSheet = () => document.body.classList.add('sheet-open');
$('#shClose').addEventListener('click', () => closeSheet());
$('#backdrop').addEventListener('click', () => closeSheet());
// Nach unten wischen zum Schließen
(() => {
  let y0 = null;
  const s = $('#sheet');
  s.addEventListener('touchstart', e => { if ($('#shBody').scrollTop <= 0 && !e.target.closest('input,textarea')) y0 = e.touches[0].clientY; }, { passive: true });
  s.addEventListener('touchmove', e => { if (y0 == null) return; const dy = e.touches[0].clientY - y0; if (dy > 0) s.style.transform = `translateY(${dy}px)`; }, { passive: true });
  s.addEventListener('touchend', e => { if (y0 == null) return; const dy = e.changedTouches[0].clientY - y0; s.style.transform = ''; y0 = null; if (dy > 110) closeSheet(); });
})();

let toastT;
function toast(msg, ms = 2600) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), ms); }
function showViewer(url) { const v = $('#viewer'); $('img', v).src = url; v.classList.add('show'); }
$('#viewer').addEventListener('click', () => $('#viewer').classList.remove('show'));

const fmtDate = t => new Date(t).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const fmtCoord = (lat, lng) => `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
const fmtBytes = b => b > 1e9 ? (b / 1e9).toFixed(2).replace('.', ',') + ' GB' : b > 1e6 ? Math.round(b / 1e6) + ' MB' : Math.round(b / 1e3) + ' kB';

/* ============================================================
   Position auf der Karte wählen (Nadel in der Mitte)
   ============================================================ */
function pickPosition(start, prompt) {
  return new Promise(resolve => {
    hideSheet(); setFollow(false);
    document.body.classList.add('placing');
    $('#pinbar p').textContent = prompt || 'Karte verschieben, bis die Nadel auf der Blume steht';
    if (start) map.setView([start.lat, start.lng], Math.max(map.getZoom(), 18));
    const done = v => { document.body.classList.remove('placing'); ok.onclick = cancel.onclick = me.onclick = null; resolve(v); };
    const ok = $('#pinOk'), cancel = $('#pinCancel'), me = $('#pinMe');
    // Die Nadelspitze sitzt exakt in der Bildschirmmitte
    ok.onclick = () => { const c = map.getCenter(); done({ lat: c.lat, lng: c.lng, acc: null, manual: true }); };
    cancel.onclick = () => done(null);
    me.onclick = () => fix ? map.setView([fix.lat, fix.lng], Math.max(map.getZoom(), 18)) : toast('Kein Standort verfügbar');
  });
}

/* ============================================================
   Bildverarbeitung & EXIF
   ============================================================ */
async function loadImg(blob) {
  const url = URL.createObjectURL(blob);
  const img = new Image(); img.src = url;
  try { await img.decode(); } catch (e) { URL.revokeObjectURL(url); throw e; }
  return { img, url };
}
function canvasBlob(c, q = .85) { return new Promise(r => c.toBlob(r, 'image/jpeg', q)); }
async function makeThumb(img, s = 200) {
  const c = document.createElement('canvas'); c.width = c.height = s;
  const w = img.naturalWidth, h = img.naturalHeight, m = Math.min(w, h);
  c.getContext('2d').drawImage(img, (w - m) / 2, (h - m) / 2, m, m, 0, 0, s, s);
  return canvasBlob(c, .8);
}
async function readExif(blob) {
  try {
    const v = new DataView(await blob.slice(0, 512 * 1024).arrayBuffer());
    if (v.getUint16(0) !== 0xFFD8) return null;
    let o = 2;
    while (o < v.byteLength - 10) {
      const m = v.getUint16(o), len = v.getUint16(o + 2);
      if (m === 0xFFE1 && v.getUint32(o + 4) === 0x45786966) return parseTiff(v, o + 10);
      if ((m & 0xFF00) !== 0xFF00 || m === 0xFFDA) break;
      o += 2 + len;
    }
  } catch (e) { }
  return null;
}
function parseTiff(v, t) {
  const le = v.getUint16(t) === 0x4949;
  const u16 = p => v.getUint16(p, le), u32 = p => v.getUint32(p, le);
  const ifd = off => { const n = u16(t + off), tags = {}; for (let i = 0; i < n; i++) { const e = t + off + 2 + i * 12; tags[u16(e)] = { count: u32(e + 4), vo: e + 8 }; } return tags; };
  const rat = (tg, i) => { const p = t + u32(tg.vo) + i * 8; return u32(p) / u32(p + 4); };
  const ascii = tg => { const p = tg.count <= 4 ? tg.vo : t + u32(tg.vo); let s = ''; for (let i = 0; i < tg.count - 1; i++) s += String.fromCharCode(v.getUint8(p + i)); return s; };
  const res = {};
  const i0 = ifd(u32(t + 4));
  if (i0[0x8825]) {
    const g = ifd(u32(i0[0x8825].vo));
    if (g[2] && g[4]) {
      const dms = tg => rat(tg, 0) + rat(tg, 1) / 60 + rat(tg, 2) / 3600;
      let lat = dms(g[2]), lng = dms(g[4]);
      if (g[1] && ascii(g[1]) === 'S') lat = -lat;
      if (g[3] && ascii(g[3]) === 'W') lng = -lng;
      if (isFinite(lat) && isFinite(lng) && (lat || lng)) { res.lat = lat; res.lng = lng; }
    }
  }
  if (i0[0x8769]) {
    const ex = ifd(u32(i0[0x8769].vo));
    if (ex[0x9003]) { const m = ascii(ex[0x9003]).match(/(\d{4}):(\d\d):(\d\d) (\d\d):(\d\d):(\d\d)/); if (m) res.date = new Date(+m[1], m[2] - 1, +m[3], +m[4], +m[5], +m[6]).getTime(); }
    if (ex[0x9286] && ex[0x9286].count > 8) { // UserComment mit unseren Daten
      try {
        const tg = ex[0x9286], p = t + u32(tg.vo) + 8; let s = '';
        for (let i = 0; i < tg.count - 8; i++) { const c = v.getUint8(p + i); if (!c) break; s += String.fromCharCode(c); }
        if (s.startsWith('{"bk"')) res.bk = JSON.parse(s);
      } catch { }
    }
  }
  return res;
}

/* ---------- Metadaten schreiben: Position, Datum, Name & Notiz direkt ins JPEG ----------
   So trägt jedes Foto in der iPhone-Fotomediathek (und damit in iCloud) alle Infos
   in sich und lässt sich daraus komplett wiederherstellen. */
async function encodeClean(img) { // Pixel aufrecht, ohne alte Metadaten
  const w = img.naturalWidth, h = img.naturalHeight, k = Math.min(1, 4032 / Math.max(w, h));
  const c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  const blob = await canvasBlob(c, .92);
  return { blob, u8: new Uint8Array(await blob.arrayBuffer()) };
}
const cat = arrs => { const n = arrs.reduce((s, a) => s + a.length, 0), o = new Uint8Array(n); let p = 0; for (const a of arrs) { o.set(a, p); p += a.length; } return o; };
const utf8 = s => new TextEncoder().encode(s);
function ifdBytes(entries, base, next = 0) {
  entries.sort((a, b) => a.tag - b.tag);
  const n = entries.length, size = 2 + n * 12 + 4, head = new DataView(new ArrayBuffer(size)), extra = [];
  let off = base + size; head.setUint16(0, n, true);
  entries.forEach((e, i) => {
    const p = 2 + i * 12; head.setUint16(p, e.tag, true); head.setUint16(p + 2, e.type, true); head.setUint32(p + 4, e.count, true);
    if (e.bytes.length <= 4) e.bytes.forEach((b, k) => head.setUint8(p + 8 + k, b));
    else { head.setUint32(p + 8, off, true); extra.push(e.bytes); off += e.bytes.length; if (e.bytes.length & 1) { extra.push(new Uint8Array(1)); off++; } }
  });
  head.setUint32(2 + n * 12, next, true);
  return cat([new Uint8Array(head.buffer), ...extra]);
}
function exifSegment(rec) {
  const A = s => { const b = cat([utf8(s), new Uint8Array(1)]); return { type: 2, count: b.length, bytes: b }; };
  const S = v => ({ type: 3, count: 1, bytes: new Uint8Array([v & 255, v >> 8, 0, 0]) });
  const Lp = v => { const d = new DataView(new ArrayBuffer(4)); d.setUint32(0, v, true); return { type: 4, count: 1, bytes: new Uint8Array(d.buffer) }; };
  const R = vals => { const d = new DataView(new ArrayBuffer(vals.length * 8)); vals.forEach(([a, b], i) => { d.setUint32(i * 8, a, true); d.setUint32(i * 8 + 4, b, true); }); return { type: 5, count: vals.length, bytes: new Uint8Array(d.buffer) }; };
  const dms = x => { x = Math.abs(x); const d = Math.floor(x), m = Math.floor((x - d) * 60), s = Math.round(((x - d) * 60 - m) * 60 * 10000); return [[d, 1], [m, 1], [s, 10000]]; };
  const pad = n => String(n).padStart(2, '0'), dt = new Date(rec.created);
  const dts = `${dt.getFullYear()}:${pad(dt.getMonth() + 1)}:${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`;
  const desc = ([rec.title, rec.note].filter(Boolean).join(' - ') || 'Blume')
    .replace(/[äöüÄÖÜß]/g, c => ({ ä: 'ae', ö: 'oe', ü: 'ue', Ä: 'Ae', Ö: 'Oe', Ü: 'Ue', ß: 'ss' }[c])).replace(/[^\x20-\x7e]/g, '');
  const json = JSON.stringify({ bk: 1, id: rec.id, title: rec.title || '', note: rec.note || '', created: rec.created, updated: rec.updated || rec.created, lat: rec.lat, lng: rec.lng, acc: rec.acc ?? null })
    .replace(/[\u0080-￿]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
  const uc = cat([utf8('ASCII\0\0\0'), utf8(json)]);
  const gps = [
    { tag: 0, type: 1, count: 4, bytes: new Uint8Array([2, 3, 0, 0]) },
    { tag: 1, ...A(rec.lat >= 0 ? 'N' : 'S') }, { tag: 2, ...R(dms(rec.lat)) },
    { tag: 3, ...A(rec.lng >= 0 ? 'E' : 'W') }, { tag: 4, ...R(dms(rec.lng)) }];
  const exif = [{ tag: 0x9003, ...A(dts) }, { tag: 0x9004, ...A(dts) }, { tag: 0x9286, type: 7, count: uc.length, bytes: uc }];
  const ifd0 = p => [{ tag: 0x010E, ...A(desc) }, { tag: 0x0112, ...S(1) }, { tag: 0x0131, ...A('Blumenkarte') }, { tag: 0x0132, ...A(dts) }, { tag: 0x8769, ...Lp(p.exif) }, { tag: 0x8825, ...Lp(p.gps) }];
  const len0 = ifdBytes(ifd0({ exif: 0, gps: 0 }), 8).length;
  const exifB = ifdBytes(exif, 8 + len0), gpsB = ifdBytes(gps, 8 + len0 + exifB.length);
  const tiff = cat([new Uint8Array([0x49, 0x49, 42, 0, 8, 0, 0, 0]), ifdBytes(ifd0({ exif: 8 + len0, gps: 8 + len0 + exifB.length }), 8), exifB, gpsB]);
  const body = cat([utf8('Exif\0\0'), tiff]), L = body.length + 2;
  return cat([new Uint8Array([0xFF, 0xE1, L >> 8, L & 255]), body]);
}
function xmpSegment(rec) {
  const x = s => String(s).replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
  const desc = [rec.title, rec.note].filter(Boolean).join(' – ');
  const pkt = `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?><x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title><rdf:Alt><rdf:li xml:lang="x-default">${x(rec.title || 'Blume')}</rdf:li></rdf:Alt></dc:title><dc:description><rdf:Alt><rdf:li xml:lang="x-default">${x(desc)}</rdf:li></rdf:Alt></dc:description></rdf:Description></rdf:RDF></x:xmpmeta><?xpacket end="w"?>`;
  const body = cat([utf8('http://ns.adobe.com/xap/1.0/\0'), utf8(pkt)]).slice(0, 65000), L = body.length + 2;
  return cat([new Uint8Array([0xFF, 0xE1, L >> 8, L & 255]), body]);
}
function tagJpeg(u8, rec) { // synchron, damit das Teilen-Menü direkt nach dem Tippen aufgeht
  const keep = []; let o = 2;
  while (o < u8.length - 4 && u8[o] === 0xFF) {
    const m = u8[o + 1]; if (m === 0xDA) break;
    const len = (u8[o + 2] << 8) | u8[o + 3];
    if (m !== 0xE1) keep.push(u8.subarray(o, o + 2 + len)); // altes EXIF/XMP raus
    o += 2 + len;
  }
  return new Blob([new Uint8Array([0xFF, 0xD8]), ...keep, exifSegment(rec), xmpSegment(rec), u8.subarray(o)], { type: 'image/jpeg' });
}
const fileName = r => `${(r.title || 'blume').replace(/[^\wäöüÄÖÜß-]+/g, '_')}_${new Date(r.created).toISOString().slice(0, 10)}_${r.id}.jpg`;
// Öffnet das iOS-Teilen-Menü („Bild sichern“ / „X Bilder sichern“). Muss direkt im Tipp-Handler laufen.
function shareToPhotos(recs, u8s) {
  const files = recs.map((r, i) => new File([tagJpeg(u8s[i], r)], fileName(r), { type: 'image/jpeg' }));
  return shareFiles(files).then(r => r === true);
}
async function markInPhotos(ids) {
  for (const id of ids) { const r = await DB.get(id); if (r && !r.inPhotos) { r.inPhotos = true; await DB.put(r); } }
  await loadEntries();
}
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

/* ============================================================
   Neues Foto
   ============================================================ */
let shotFix = null;
$('#btnShoot').addEventListener('click', () => {
  shotFix = freshFix(); // Position im Moment des Tippens – du stehst ja an der Blume
  $('#inCamera').value = ''; $('#inCamera').click();
});
$('#inCamera').addEventListener('change', async e => {
  const f = e.target.files[0]; if (!f) return;
  let pos = shotFix;
  const now = freshFix(30000);
  if (now && (!pos || now.acc < pos.acc)) pos = now;
  if (!pos) { toast('Bestimme Standort …'); pos = await currentPosition(); }
  newEntryFlow(f, pos, Date.now());
});
$('#inGallery').addEventListener('change', async e => {
  const files = [...e.target.files]; if (!files.length) return;
  closeSheet();
  const plain = []; let restored = 0, same = 0;
  for (const [i, f] of files.entries()) {
    const ex = await readExif(f);
    if (ex?.bk && ex.bk.lat != null) { // Foto, das die App selbst in der Mediathek gesichert hat
      if (files.length > 3) toast(`Wiederherstellen … ${i + 1}/${files.length}`, 1500);
      (await restoreFromPhoto(f, ex.bk)) ? restored++ : same++;
    } else plain.push([f, ex]);
  }
  if (restored || same) { await loadEntries(); toast(`${restored} ${restored === 1 ? "Blume" : "Blumen"} wiederhergestellt${same ? `, ${same} schon vorhanden` : ''}`, 4000); }
  for (const [f, ex] of plain) {
    const pos = ex && ex.lat != null ? { lat: ex.lat, lng: ex.lng, acc: null, exif: true } : null;
    const ok = await newEntryFlow(f, pos, ex?.date || f.lastModified || Date.now(), plain.length > 1);
    if (ok === 'abort') break;
  }
});
async function restoreFromPhoto(file, bk) {
  const old = await DB.get(bk.id);
  if (old && (old.updated || old.created) >= (bk.updated || bk.created)) return false;
  const { img, url } = await loadImg(file);
  try {
    const [clean, thumb] = await Promise.all([encodeClean(img), makeThumb(img)]);
    await DB.put({ id: bk.id, created: bk.created, updated: bk.updated || bk.created, lat: bk.lat, lng: bk.lng, acc: bk.acc ?? null, title: bk.title || '', note: bk.note || '', blob: clean.blob, thumb, clean: true, inPhotos: true });
    return true;
  } finally { URL.revokeObjectURL(url); }
}

async function newEntryFlow(file, pos, created, batch) {
  let img, url;
  try { ({ img, url } = await loadImg(file)); } catch { toast('Bild konnte nicht gelesen werden'); return; }
  const [clean, thumb] = await Promise.all([encodeClean(img), makeThumb(img)]);
  const draft = { id: uid(), created, title: '', note: '', lat: pos?.lat, lng: pos?.lng, acc: pos?.acc ?? null };
  return new Promise(resolve => {
    const posText = () => draft.lat == null
      ? '<span class="grow" style="color:#ff9f6b">Keine Position – bitte auf der Karte setzen</span>'
      : `<span class="grow">${pos?.exif && !draft.manual ? 'aus Foto-Metadaten' : draft.manual ? 'manuell gesetzt' : 'GPS'}${draft.acc ? ` · ±${draft.acc} m` : ''}</span>`;
    const auto = store.get('autoPhotos', true);
    openSheet(batch ? 'Foto importieren' : 'Neue Blume', `
      <img class="photo-big" src="${url}" alt="">
      <label class="field"><span>Art / Name</span><input id="fTitle" list="arten" placeholder="z. B. Kornblume" autocomplete="off"></label>
      <label class="field"><span>Notiz</span><textarea id="fNote" placeholder="Standort, Anzahl, Besonderheiten …"></textarea></label>
      <div class="posline">${ICON.pin}<span id="fPos" class="grow"></span><button id="fMove">${draft.lat == null ? 'Setzen' : 'Anpassen'}</button></div>
      <div class="row"><button class="btn" id="fCancel">${batch ? 'Überspringen' : 'Verwerfen'}</button><button class="btn primary" id="fSave">Speichern</button></div>
      ${auto ? '<p class="hint">Danach öffnet sich das Teilen-Menü: „Bild sichern“ tippen, dann liegt die Blume mit Position und Notiz auch in deinen Fotos (iCloud).</p>' : ''}`,
      body => {
        const sync = () => { $('#fPos', body).innerHTML = posText(); $('#fMove', body).textContent = draft.lat == null ? 'Setzen' : 'Anpassen'; };
        sync();
        let finished = false;
        const finish = v => { if (finished) return; finished = true; URL.revokeObjectURL(url); resolve(v); };
        const move = async () => {
          const p = await pickPosition(draft.lat != null ? draft : (fix || map.getCenter()));
          if (p) Object.assign(draft, { lat: p.lat, lng: p.lng, acc: null, manual: true });
          showSheet(); sync();
          return !!p;
        };
        $('#fMove', body).onclick = move;
        $('#fCancel', body).onclick = () => { finish('skip'); closeSheet(); };
        $('#fSave', body).onclick = async () => {
          if (draft.lat == null && !(await move())) return;
          const rec = { id: draft.id, created: draft.created, updated: Date.now(), lat: draft.lat, lng: draft.lng, acc: draft.acc, title: $('#fTitle', body).value.trim(), note: $('#fNote', body).value.trim(), blob: clean.blob, thumb, clean: true, inPhotos: false };
          // Teilen-Menü sofort öffnen (iOS erlaubt das nur direkt nach dem Tippen)
          const shared = store.get('autoPhotos', true) ? shareToPhotos([rec], [clean.u8]) : null;
          try { await DB.put(rec); } catch (err) { toast('Speichern fehlgeschlagen: ' + err.message, 5000); return; }
          askPersist();
          finish('saved'); closeSheet();
          await loadEntries();
          if (!batch) map.setView([rec.lat, rec.lng], Math.max(map.getZoom(), 16));
          toast(rec.title ? `„${rec.title}“ gespeichert` : 'Gespeichert');
          if (shared && await shared) await markInPhotos([rec.id]);
        };
        return () => finish('abort');
      });
  });
}

/* ============================================================
   Detailansicht
   ============================================================ */
async function openDetail(id) {
  const rec = await DB.get(id); if (!rec) return;
  const url = URL.createObjectURL(rec.blob);
  let u8 = null; rec.blob.arrayBuffer().then(b => u8 = new Uint8Array(b));
  const photoState = rec.inPhotos && !rec.photosStale ? `<span style="color:var(--leaf)">✓ In deinen Fotos gesichert</span>` : rec.inPhotos ? 'Geändert – Kopie in Fotos ist veraltet' : '<span style="color:#ff9f6b">Noch nicht in deinen Fotos gesichert</span>';
  openSheet(rec.title || 'Ohne Namen', `
    <img class="photo-big" id="dImg" src="${url}" alt="">
    ${rec.note ? `<div class="note">${esc(rec.note)}</div>` : ''}
    <div class="meta">${fmtDate(rec.created)}<br>${fmtCoord(rec.lat, rec.lng)}${rec.acc ? ` · ±${rec.acc} m` : ''}<br>${photoState}</div>
    <div class="row"><button class="btn" id="dEdit">${ICON.edit}Bearbeiten</button><button class="btn" id="dMove">${ICON.pin}Position</button></div>
    <div class="row"><button class="btn" id="dNav">${ICON.nav}Hinführen</button><button class="btn" id="dShare">${ICON.share}Teilen</button></div>
    <div class="row">${rec.inPhotos && !rec.photosStale ? '' : `<button class="btn" id="dPhotos">${ICON.img}In Fotos sichern</button>`}<button class="btn danger" id="dDel">${ICON.trash}Löschen</button></div>`,
    body => {
      $('#dImg', body).onclick = () => showViewer(url);
      $('#dEdit', body).onclick = () => openEdit(rec);
      $('#dMove', body).onclick = async () => {
        const p = await pickPosition(rec, 'Neue Position für dieses Foto wählen');
        if (p) { Object.assign(rec, { lat: p.lat, lng: p.lng, acc: null, updated: Date.now(), photosStale: !!rec.inPhotos }); await DB.put(rec); await loadEntries(); toast('Position geändert'); }
        openDetail(rec.id);
      };
      $('#dNav', body).onclick = () => { location.href = `https://maps.apple.com/?daddr=${rec.lat},${rec.lng}&dirflg=w`; };
      $('#dShare', body).onclick = async () => {
        const file = new File([u8 ? tagJpeg(u8, rec) : rec.blob], fileName(rec), { type: 'image/jpeg' });
        const text = `${rec.title || 'Blume'}${rec.note ? '\n' + rec.note : ''}\nhttps://maps.apple.com/?ll=${rec.lat},${rec.lng}`;
        const r = await shareFiles([file], text);
        if (r === null) { if (navigator.share) navigator.share({ text }).catch(() => { }); else toast('Teilen wird nicht unterstützt'); }
      };
      const dp = $('#dPhotos', body);
      if (dp) dp.onclick = async () => {
        if (!u8) u8 = new Uint8Array(await rec.blob.arrayBuffer());
        if (await shareToPhotos([rec], [u8])) { rec.inPhotos = true; rec.photosStale = false; await DB.put(rec); await loadEntries(); openDetail(rec.id); }
      };
      $('#dDel', body).onclick = async () => {
        if (!confirm('Dieses Foto wirklich aus der App löschen?' + (rec.inPhotos ? '\n(Die Kopie in deinen Fotos bleibt erhalten.)' : ''))) return;
        await DB.del(rec.id); closeSheet(); await loadEntries(); toast('Gelöscht');
      };
      return () => setTimeout(() => URL.revokeObjectURL(url), 500);
    });
}
function openEdit(rec) {
  const url = URL.createObjectURL(rec.thumb);
  openSheet('Bearbeiten', `
    <img src="${url}" style="width:84px;height:84px;border-radius:12px;object-fit:cover">
    <label class="field"><span>Art / Name</span><input id="eTitle" list="arten" value="${esc(rec.title)}" autocomplete="off"></label>
    <label class="field"><span>Notiz</span><textarea id="eNote">${esc(rec.note)}</textarea></label>
    <label class="field"><span>Datum</span><input id="eDate" type="datetime-local" value="${new Date(rec.created - new Date(rec.created).getTimezoneOffset() * 6e4).toISOString().slice(0, 16)}"></label>
    <div class="row"><button class="btn" id="eCancel">Abbrechen</button><button class="btn primary" id="eSave">Speichern</button></div>`,
    body => {
      $('#eCancel', body).onclick = () => openDetail(rec.id);
      $('#eSave', body).onclick = async () => {
        rec.title = $('#eTitle', body).value.trim(); rec.note = $('#eNote', body).value.trim();
        const d = new Date($('#eDate', body).value); if (!isNaN(d)) rec.created = d.getTime();
        rec.updated = Date.now(); if (rec.inPhotos) rec.photosStale = true;
        await DB.put(rec); await loadEntries(); openDetail(rec.id);
      };
      return () => URL.revokeObjectURL(url);
    });
}

/* ============================================================
   Liste / Galerie
   ============================================================ */
function openList(items, title) {
  const all = !items; items = items || entries;
  openSheet(title || `Alle Blumen (${entries.length})`, `
    ${all ? '<input class="search" id="lQ" type="search" placeholder="Suchen nach Art oder Notiz">' : ''}
    <div id="lGrid"></div>
    ${all ? `<div class="row"><button class="btn" id="lImport">${ICON.img}Aus Fotomediathek hinzufügen</button></div>` : ''}`,
    body => {
      const draw = q => {
        q = (q || '').toLowerCase();
        const list = items.filter(e => !q || (e.title + ' ' + e.note).toLowerCase().includes(q));
        $('#lGrid', body).innerHTML = list.length
          ? `<div class="grid">${list.map(e => `<button data-id="${e.id}"><img src="${e.thumbUrl}" alt="" loading="lazy"><span class="cap">${esc(e.title || new Date(e.created).toLocaleDateString('de-DE'))}</span></button>`).join('')}</div>`
          : `<div class="empty">${entries.length ? 'Nichts gefunden.' : 'Noch keine Blumen.<br>Tippe auf den Kamera-Knopf, um die erste festzuhalten.'}</div>`;
      };
      draw();
      $('#lQ', body)?.addEventListener('input', e => draw(e.target.value));
      $('#lGrid', body).addEventListener('click', e => {
        const b = e.target.closest('button[data-id]'); if (!b) return;
        const rec = entries.find(x => x.id === b.dataset.id);
        setFollow(false);
        map.setView([rec.lat, rec.lng], Math.max(map.getZoom(), 17));
        openDetail(rec.id);
      });
      const imp = $('#lImport', body); if (imp) imp.onclick = () => { $('#inGallery').value = ''; $('#inGallery').click(); };
    });
}
$('#btnList').addEventListener('click', () => openList());

/* ============================================================
   Ebenen-Menü
   ============================================================ */
$('#btnLayers').addEventListener('click', () => {
  const cur = store.get('layer', 'dop'), relief = store.get('relief', 1);
  const cnt = c => shapes.filter(s => s.color === c).length;
  openSheet('Karte', `
    <div class="list">${Object.entries(LAYERS).map(([k, d]) => `<label><input type="radio" name="ly" value="${k}" ${k === cur ? 'checked' : ''}><span class="grow">${esc(d.label)}<span class="sub">${d.offline ? 'Offline speicherbar · nur Brandenburg & Berlin' : 'Nur online (wird beim Ansehen zwischengespeichert)'}</span></span></label>`).join('')}</div>
    <label class="field"><span>Relief verstärken (Gelände) <b id="rlv">${Math.round(relief * 100)} %</b></span><input class="range" id="lyRelief" type="range" min="1" max="3" step="0.1" value="${relief}"></label>
    <p class="hint">Hebt flache Gräben, Trichter und Wälle im Geländemodell hervor.</p>
    <div class="sec">Gräben & Stellungen</div>
    <div class="list">
      <label><input type="checkbox" id="lyShapes" ${store.get('shapesOn', true) ? 'checked' : ''}><span class="grow">Meine Zeichnungen anzeigen<span class="sub">${shapes.length} gezeichnet – liegen über jeder Karte</span></span></label>
      <label><input type="checkbox" id="lyRed" ${store.get('show_red', true) ? 'checked' : ''}><span class="grow"><span style="color:${SHAPE_COLORS.red}">●</span> Rote (${cnt('red')})</span></label>
      <label><input type="checkbox" id="lyBlue" ${store.get('show_blue', true) ? 'checked' : ''}><span class="grow"><span style="color:${SHAPE_COLORS.blue}">●</span> Blaue (${cnt('blue')})</span></label>
      <button id="lyDraw">${ICON.edit}<span class="grow" style="color:var(--accent);font-weight:600">Zeichnen</span></button>
    </div>
    <div class="sec">Zusatzinfo</div>
    <div class="list"><label><input type="checkbox" id="lyYears" ${store.get('years', false) ? 'checked' : ''}><span class="grow">Abdeckung Luftbild 1953<span class="sub">Übersicht der LGB, wo Bilder vom Sommer 1953 vorliegen (ca. 90 % von Brandenburg)</span></span></label></div>
    <div id="lyLegend" ${store.get('years', false) ? '' : 'hidden'} style="margin-top:10px;background:#fff;border-radius:12px;padding:10px"><img src="${YEARS_LEGEND}" alt="Legende" style="max-width:100%;display:block" onerror="this.parentNode.innerHTML='<span style=&quot;color:#333;font-size:13px&quot;>Legende nur online verfügbar</span>'"></div>
    <p class="hint">Schnell wechseln: oben auf „Luftbild“, „1953“ oder „Gelände“ tippen.</p>`,
    body => {
      $('#lyDraw', body).onclick = enterDraw;
      $('#lyRelief', body).addEventListener('input', e => {
        store.set('relief', +e.target.value); $('#rlv', body).textContent = Math.round(e.target.value * 100) + ' %';
        if (store.get('layer', 'dop') !== 'dgm') setLayer('dgm');
        applyRelief();
      });
      body.addEventListener('change', e => {
        const id = e.target.id;
        if (id === 'lyRelief') return;
        if (id === 'lyYears') { setYears(e.target.checked); $('#lyLegend', body).hidden = !e.target.checked; return; }
        if (id === 'lyShapes') { store.set('shapesOn', e.target.checked); return renderShapes(); }
        if (id === 'lyRed' || id === 'lyBlue') { store.set(id === 'lyRed' ? 'show_red' : 'show_blue', e.target.checked); if (e.target.checked) store.set('shapesOn', true), $('#lyShapes', body).checked = true; return renderShapes(); }
        if (e.target.name === 'ly') { setLayer(e.target.value); closeSheet(); }
      });
    });
});

/* ============================================================
   Menü
   ============================================================ */
$('#btnMenu').addEventListener('click', openMenu);
async function openMenu() {
  const todo = entries.filter(e => !e.inPhotos || e.photosStale);
  const lastB = store.get('lastBackup', 0);
  openSheet('Blumenkarte', `
    <div class="sec">Datensicherung</div>
    <div class="list">
      <div>${ICON.img}<span class="grow">${!entries.length ? 'Noch keine Fotos' : todo.length ? `<b style="color:#ff9f6b">${todo.length} von ${entries.length}</b> noch nicht in deinen Fotos` : `<span style="color:var(--leaf)">✓ Alle ${entries.length} in deinen Fotos gesichert</span>`}<span class="sub">Gesicherte Bilder tragen Position, Datum, Name und Notiz in sich – über iCloud-Fotos sind sie sicher.</span></span></div>
      ${todo.length ? `<button id="mPhotos">${ICON.share}<span class="grow" style="color:var(--accent);font-weight:600">Jetzt in Fotos sichern (${Math.min(todo.length, 20)}${todo.length > 20 ? ` von ${todo.length}` : ''})<span class="sub">Im Teilen-Menü „Bilder sichern“ tippen</span></span></button>` : ''}
      <label><input type="checkbox" id="mAuto" ${store.get('autoPhotos', true) ? 'checked' : ''}><span class="grow">Nach jedem Foto automatisch anbieten</span></label>
      <button id="mRestore">${ICON.up}<span class="grow">Aus Fotos wiederherstellen<span class="sub">Gesicherte Blumen-Fotos auswählen – alles kommt zurück</span></span></button>
      <button id="mExport">${ICON.box}<span class="grow">Backup-Datei erstellen (ZIP)<span class="sub">Letztes Backup: ${lastB ? new Date(lastB).toLocaleDateString('de-DE') : 'noch nie'}</span></span></button>
      <button id="mImport">${ICON.up}<span class="grow">Backup-Datei wiederherstellen</span></button>
      ${shapes.length ? `<div>${ICON.edit}<span class="grow">${shapes.length} Zeichnungen (Gräben & Stellungen)<span class="sub">${shapesNeedBackup() ? '<b style="color:#ff9f6b">Seit dem letzten Backup geändert</b> – ' : ''}sind in der Backup-Datei enthalten, nicht in den Fotos</span></span></div>` : ''}
    </div>
    <div class="sec">Offline-Karten</div>
    <div class="list">
      <button id="mDlView">${ICON.down}<span class="grow">Sichtbaren Ausschnitt speichern<span class="sub">Luftbild, 1953 und Gelände bis zur vollen Schärfe</span></span></button>
      <button id="mDlBB">${ICON.map}<span class="grow">Ganz Brandenburg & Berlin<span class="sub">Übersicht für das ganze Land</span></span></button>
      <div><span class="grow">Speicher belegt<span class="sub" id="mStore">wird berechnet …</span></span></div>
      <button id="mClear">${ICON.trash}<span class="grow" style="color:#ff6b6b">Offline-Karten löschen</span></button>
    </div>
    <div class="sec">Meine Daten</div>
    <div class="list">
      <button id="mImgs">${ICON.img}<span class="grow">Fotos aus Mediathek hinzufügen<span class="sub">Position aus den Foto-Daten, sonst auf der Karte setzen</span></span></button>
      <button id="mGeo">${ICON.globe}<span class="grow">Als GeoJSON exportieren<span class="sub">Fundpunkte für QGIS & Co.</span></span></button>
      <button id="mShapesOut">${ICON.globe}<span class="grow">Zeichnungen als GeoJSON exportieren<span class="sub">Gräben & Stellungen für QGIS & Co.</span></span></button>
      <button id="mShapesIn">${ICON.up}<span class="grow">Zeichnungen importieren (GeoJSON)<span class="sub">z. B. in QGIS nachgezeichnete Gräben</span></span></button>
    </div>
    <div class="sec">Info</div>
    <div class="list"><div>${ICON.info}<span class="grow">${entries.length} Blumen gespeichert<span class="sub">Kartendaten: © GeoBasis-DE/LGB (dl-de/by-2-0), Esri, OpenStreetMap-Mitwirkende</span></span></div></div>`,
    body => {
      storageInfo().then(t => { const el = $('#mStore', body); if (el) el.textContent = t; });
      $('#mDlView', body).onclick = () => openDownload('view');
      $('#mDlBB', body).onclick = () => openDownload('bb');
      $('#mClear', body).onclick = async () => {
        if (!confirm('Alle gespeicherten Kartenkacheln löschen? Deine Fotos bleiben erhalten.')) return;
        await TileStore.clear(); toast('Offline-Karten gelöscht'); openMenu();
      };
      $('#mImgs', body).onclick = () => { $('#inGallery').value = ''; $('#inGallery').click(); };
      $('#mExport', body).onclick = exportBackup;
      $('#mAuto', body).onchange = e => store.set('autoPhotos', e.target.checked);
      $('#mRestore', body).onclick = () => { $('#inGallery').value = ''; $('#inGallery').click(); };
      const mp = $('#mPhotos', body);
      if (mp) {
        // Bilder vorbereiten, damit das Teilen-Menü sofort beim Tippen aufgeht
        const batch = todo.slice(0, 20); let ready = null;
        Promise.all(batch.map(e => DB.get(e.id).then(r => r.blob.arrayBuffer().then(b => [r, new Uint8Array(b)])))).then(x => ready = x);
        mp.onclick = async () => {
          if (!ready) return toast('Einen Moment, Bilder werden vorbereitet …');
          if (await shareToPhotos(ready.map(x => x[0]), ready.map(x => x[1]))) {
            for (const [r] of ready) { r.inPhotos = true; r.photosStale = false; await DB.put(r); }
            await loadEntries(); toast(`${ready.length} Fotos gesichert`); openMenu();
          }
        };
      }
      $('#mImport', body).onclick = () => { $('#inBackup').value = ''; $('#inBackup').click(); };
      $('#mGeo', body).onclick = exportGeoJSON;
      $('#mShapesOut', body).onclick = exportShapes;
      $('#mShapesIn', body).onclick = () => { $('#inShapes').value = ''; $('#inShapes').click(); };
    });
}
async function storageInfo() {
  try {
    const e = await navigator.storage.estimate();
    const persisted = await navigator.storage.persisted?.();
    return `${fmtBytes(e.usage || 0)} von ca. ${fmtBytes(e.quota || 0)} verfügbar${persisted ? ' · dauerhaft' : ''}`;
  } catch { return 'unbekannt'; }
}
let persistAsked = false;
async function askPersist() { if (persistAsked) return; persistAsked = true; try { await navigator.storage?.persist?.(); } catch { } }

/* ============================================================
   Offline-Karten herunterladen
   ============================================================ */
const lon2x = (lon, n) => Math.floor((lon + 180) / 360 * n);
const lat2y = (lat, n) => { const r = lat * Math.PI / 180; return Math.floor((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * n); };
function clipBB(b) {
  const s = Math.max(b.getSouth(), BB_BOUNDS.getSouth()), n = Math.min(b.getNorth(), BB_BOUNDS.getNorth());
  const w = Math.max(b.getWest(), BB_BOUNDS.getWest()), e = Math.min(b.getEast(), BB_BOUNDS.getEast());
  return s < n && w < e ? L.latLngBounds([s, w], [n, e]) : null;
}
function tileRange(b, z) {
  const n = 2 ** z;
  const x0 = lon2x(b.getWest(), n), x1 = lon2x(b.getEast(), n), y0 = lat2y(b.getNorth(), n), y1 = lat2y(b.getSouth(), n);
  return { z, x0, x1, y0, y1, count: (x1 - x0 + 1) * (y1 - y0 + 1) };
}
function planDownload(bounds, zmax, keys) {
  const b = clipBB(bounds); if (!b) return { jobs: [], count: 0, bytes: 0 };
  const jobs = []; let count = 0, bytes = 0;
  for (const k of keys) {
    const d = LAYERS[k];
    for (let z = 7; z <= Math.min(zmax, d.maxNative); z++) {
      const r = tileRange(b, z); jobs.push({ def: d, ...r }); count += r.count; bytes += r.count * d.kb * 1024;
    }
  }
  return { jobs, count, bytes };
}
function* tileIter(jobs) { for (const j of jobs) for (let x = j.x0; x <= j.x1; x++) for (let y = j.y0; y <= j.y1; y++) yield tileUrl(j.def, j.z, x, y); }


const corsMode = {}; // pro Host merken, ob CORS klappt
async function fetchTile(url) {
  const host = new URL(url).host;
  if (corsMode[host] !== false) {
    try { const r = await fetch(url, { mode: 'cors', credentials: 'omit' }); corsMode[host] = true; return r; }
    catch (e) { if (corsMode[host] === true) throw e; corsMode[host] = false; }
  }
  return fetch(url, { mode: 'no-cors', credentials: 'omit' });
}

let dl = null; // laufender Download
function openDownload(mode) {
  if (!TileStore.ok) return toast('Offline-Speicher wird nicht unterstützt');
  const bounds = mode === 'bb' ? BB_BOUNDS : map.getBounds();
  const inBB = clipBB(bounds);
  if (!inBB) return toast('Der Ausschnitt liegt außerhalb von Brandenburg/Berlin');
  const defZ = mode === 'bb' ? 13 : 18;
  const minZ = mode === 'bb' ? 9 : Math.max(10, Math.ceil(map.getZoom()));
  const maxZ = mode === 'bb' ? 16 : 18;
  const sel = { dop: true, h53: true, dgm: true };
  openSheet(mode === 'bb' ? 'Ganz Brandenburg' : 'Ausschnitt speichern', `
    <div class="list">
      <label><input type="checkbox" data-k="dop" checked><span class="grow">Luftbild aktuell</span></label>
      <label><input type="checkbox" data-k="h53" checked><span class="grow">Luftbild 1953<span class="sub">volle Schärfe schon bei Zoom 16</span></span></label>
      <label><input type="checkbox" data-k="dgm" checked><span class="grow">Gelände (DGM)</span></label>
    </div>
    <label class="field"><span>Detailstufe bis Zoom <b id="zv"></b></span><input class="range" id="zr" type="range" min="${minZ}" max="${maxZ}" step="1" value="${Math.min(maxZ, Math.max(minZ, defZ))}"></label>
    <div class="est"><span id="estN"></span><span id="estB"></span></div>
    <p class="hint" id="zHint"></p>
    <div class="prog" id="pBar" hidden><i></i></div>
    <div class="est" id="pTxt" hidden></div>
    <div class="row"><button class="btn primary" id="dlGo">${ICON.down}Herunterladen</button></div>
    <p class="hint">Bereits gespeicherte Kacheln werden übersprungen – ein abgebrochener Download kann einfach neu gestartet werden. Lass die App dabei geöffnet und das iPhone entsperrt, am besten im WLAN.</p>`,
    body => {
      const zr = $('#zr', body);
      const desc = z => z >= 18 ? 'volle Luftbildschärfe (einzelne Pflanzen erkennbar)' : z >= 17 ? 'sehr scharf, volle DGM-Auflösung' : z >= 15 ? 'Wege, Felder, Hecken gut erkennbar' : z >= 13 ? 'Orte, Wälder, Seen' : 'grobe Übersicht';
      const upd = () => {
        const keys = Object.keys(sel).filter(k => sel[k]);
        const p = planDownload(bounds, +zr.value, keys);
        $('#zv', body).textContent = zr.value; $('#zHint', body).textContent = 'Zoom ' + zr.value + ': ' + desc(+zr.value);
        $('#estN', body).textContent = p.count.toLocaleString('de-DE') + ' Kacheln';
        $('#estB', body).textContent = 'ca. ' + fmtBytes(p.bytes);
        $('#dlGo', body).disabled = !p.count || !!dl;
        return p;
      };
      body.querySelectorAll('input[type=checkbox]').forEach(c => c.onchange = () => { sel[c.dataset.k] = c.checked; upd(); });
      zr.oninput = upd; upd();
      const bar = $('#pBar', body), ptxt = $('#pTxt', body), go = $('#dlGo', body);
      const showProg = () => {
        if (!dl) return;
        bar.hidden = ptxt.hidden = false;
        $('i', bar).style.width = (dl.done / dl.total * 100).toFixed(1) + '%';
        ptxt.innerHTML = `<span>${dl.done.toLocaleString('de-DE')} / ${dl.total.toLocaleString('de-DE')}</span><span>${fmtBytes(dl.bytes)}${dl.failed ? ` · ${dl.failed} Fehler` : ''}</span>`;
      };
      go.onclick = async () => {
        if (dl) return;
        const p = upd();
        if (p.count > 400000 && !confirm(`Das sind ${p.count.toLocaleString('de-DE')} Kacheln (≈ ${fmtBytes(p.bytes)}). Das dauert sehr lange. Trotzdem starten?`)) return;
        askPersist();
        go.textContent = 'Abbrechen'; go.disabled = false; go.classList.remove('primary');
        go.onclick = () => { if (dl) dl.stop = true; };
        await runDownload(p, showProg);
        if (document.body.contains(go) && document.body.classList.contains('sheet-open')) openDownload(mode);
      };
      const iv = setInterval(showProg, 400); showProg();
      return () => clearInterval(iv);
    });
}
async function runDownload(plan, onProg) {
  dl = { total: plan.count, done: 0, failed: 0, bytes: 0, stop: false };
  let lock = null;
  try { lock = await navigator.wakeLock?.request('screen'); } catch { }
  const it = tileIter(plan.jobs);
  const worker = async () => {
    for (let n = it.next(); !n.done && !dl.stop; n = it.next()) {
      const url = n.value;
      try {
        if (!(await TileStore.has(url))) {
          let ok = false;
          for (let a = 0; a < 3 && !ok; a++) {
            try { dl.bytes += await TileStore.download(url); ok = true; }
            catch (e) { if (e && e.name === 'QuotaExceededError') throw e; await new Promise(s => setTimeout(s, 800 * (a + 1))); }
          }
          if (!ok) throw new Error('fail');
        }
      } catch (e) {
        dl.failed++;
        if (e && e.name === 'QuotaExceededError') { dl.stop = true; dl.quota = true; }
      }
      dl.done++;
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  const res = dl; dl = null;
  try { await lock?.release(); } catch { }
  onProg?.();
  toast(res.quota ? 'Speicher für die App ist voll – kleineren Bereich oder geringere Detailstufe wählen' : res.stop ? 'Download abgebrochen' : `Fertig: ${res.done.toLocaleString('de-DE')} Kacheln${res.failed ? `, ${res.failed} fehlgeschlagen` : ''}`, 4000);
}

/* ============================================================
   Backup (ZIP) & GeoJSON
   ============================================================ */
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(u8) { let c = -1; for (let i = 0; i < u8.length; i++) c = (c >>> 8) ^ CRC[(c ^ u8[i]) & 0xFF]; return (c ^ -1) >>> 0; }
async function makeZip(files) { // unkomprimiert (Fotos sind schon komprimiert)
  const enc = new TextEncoder(), parts = [], central = []; let off = 0;
  const d = new Date(), dosT = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), dosD = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  for (const f of files) {
    const blob = f.blob instanceof Blob ? f.blob : new Blob([f.blob]);
    const crc = crc32(new Uint8Array(await blob.arrayBuffer())), name = enc.encode(f.name), size = blob.size;
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
    h.setUint16(10, dosT, true); h.setUint16(12, dosD, true); h.setUint32(14, crc, true); h.setUint32(18, size, true); h.setUint32(22, size, true);
    h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
    parts.push(h.buffer, name, blob);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
    c.setUint16(12, dosT, true); c.setUint16(14, dosD, true); c.setUint32(16, crc, true); c.setUint32(20, size, true); c.setUint32(24, size, true);
    c.setUint16(28, name.length, true); c.setUint32(42, off, true);
    central.push(c.buffer, name);
    off += 30 + name.length + size;
  }
  const cSize = central.reduce((s, b) => s + b.byteLength, 0);
  const e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cSize, true); e.setUint32(16, off, true);
  return new Blob([...parts, ...central, e.buffer], { type: 'application/zip' });
}
async function readZip(blob) {
  const tail = new DataView(await blob.slice(Math.max(0, blob.size - 65557)).arrayBuffer());
  let p = tail.byteLength - 22; while (p >= 0 && tail.getUint32(p, true) !== 0x06054b50) p--;
  if (p < 0) throw new Error('Keine ZIP-Datei');
  const n = tail.getUint16(p + 10, true), cSize = tail.getUint32(p + 12, true), cOff = tail.getUint32(p + 16, true);
  const cd = new DataView(await blob.slice(cOff, cOff + cSize).arrayBuffer()), dec = new TextDecoder(), out = {};
  for (let i = 0, q = 0; i < n; i++) {
    const method = cd.getUint16(q + 10, true), size = cd.getUint32(q + 20, true), nl = cd.getUint16(q + 28, true), xl = cd.getUint16(q + 30, true), cl = cd.getUint16(q + 32, true), lo = cd.getUint32(q + 42, true);
    const name = dec.decode(new Uint8Array(cd.buffer, q + 46, nl));
    const lh = new DataView(await blob.slice(lo, lo + 30).arrayBuffer());
    const start = lo + 30 + lh.getUint16(26, true) + lh.getUint16(28, true);
    if (method === 0) out[name] = blob.slice(start, start + size);
    q += 46 + nl + xl + cl;
  }
  return out;
}
async function saveFile(blob, name, label) {
  const file = new File([blob], name, { type: blob.type });
  openSheet('Fertig', `
    <p class="hint" style="font-size:15px;color:var(--ink-2)">${esc(label)} (${fmtBytes(blob.size)}) ist bereit. Tippe auf „Sichern“ und wähle z. B. „In Dateien sichern“ oder AirDrop.</p>
    <div class="row"><button class="btn primary" id="sv">${ICON.share}Sichern</button></div>`,
    body => {
      $('#sv', body).onclick = async () => {
        if ((await shareFiles([file])) !== null) return;
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 60000);
      };
    });
}
const stamp = () => new Date().toISOString().slice(0, 10);
async function exportBackup() {
  if (!entries.length && !shapes.length) return toast('Noch keine Daten');
  openSheet('Backup', '<p class="hint" id="bx">Backup wird erstellt …</p>');
  const recs = await DB.all();
  // in Teile ≤ 1,5 GB aufteilen, damit iOS die Datei sicher verarbeiten kann
  const chunks = [[]]; let acc = 0;
  for (const r of recs) { const s = r.blob.size + r.thumb.size; if (acc + s > 1.5e9 && chunks.at(-1).length) { chunks.push([]); acc = 0; } chunks.at(-1).push(r); acc += s; }
  const zips = [];
  for (const [i, part] of chunks.entries()) {
    const meta = part.map(({ blob, thumb, ...m }) => ({ ...m, photo: `fotos/${m.id}.jpg`, thumbFile: `thumbs/${m.id}.jpg` }));
    const files = [{ name: 'blumen.json', blob: new Blob([JSON.stringify({ app: 'blumenkarte', version: 1, exported: Date.now(), items: meta }, null, 1)], { type: 'application/json' }) }];
    files.push({ name: 'blumen.geojson', blob: new Blob([JSON.stringify(geojson(part))], { type: 'application/geo+json' }) });
    if (i === 0) files.push({ name: 'zeichnungen.geojson', blob: new Blob([JSON.stringify(shapesGeoJSON())], { type: 'application/geo+json' }) });
    for (const r of part) { files.push({ name: `fotos/${r.id}.jpg`, blob: r.blob }, { name: `thumbs/${r.id}.jpg`, blob: r.thumb }); }
    zips.push(await makeZip(files));
    const el = $('#bx'); if (el) el.textContent = `Teil ${i + 1} von ${chunks.length} erstellt …`;
  }
  store.set('lastBackup', Date.now());
  if (zips.length === 1) return saveFile(zips[0], `blumenkarte-backup-${stamp()}.zip`, 'Dein Backup');
  // mehrere Teile nacheinander sichern
  let i = 0;
  const next = () => { if (i < zips.length) { saveFile(zips[i], `blumenkarte-backup-${stamp()}-teil${i + 1}.zip`, `Backup Teil ${i + 1} von ${zips.length}`); i++; const b = $('#sv'); const o = b.onclick; b.onclick = async () => { await o(); next(); }; } };
  next();
}
$('#inBackup').addEventListener('change', async e => {
  const files = [...e.target.files]; if (!files.length) return;
  openSheet('Wiederherstellen', '<p class="hint" id="ix">Lese Backup …</p>');
  let added = 0, skipped = 0, drawn = 0;
  try {
    const have = new Set(entries.map(x => x.id));
    for (const f of files) {
      const z = await readZip(f);
      if (!z['blumen.json'] && !z['zeichnungen.geojson']) throw new Error('Kein Blumenkarte-Backup');
      if (z['zeichnungen.geojson']) drawn += await importShapesGeoJSON(JSON.parse(await z['zeichnungen.geojson'].text()));
      const data = z['blumen.json'] ? JSON.parse(await z['blumen.json'].text()) : { items: [] };
      for (const m of data.items) {
        if (have.has(m.id)) { skipped++; continue; }
        const blob = new Blob([z[m.photo]], { type: 'image/jpeg' });
        let thumb = z[m.thumbFile] ? new Blob([z[m.thumbFile]], { type: 'image/jpeg' }) : null;
        if (!thumb) { const { img, url } = await loadImg(blob); thumb = await makeThumb(img); URL.revokeObjectURL(url); }
        const { photo, thumbFile, ...rec } = m;
        await DB.put({ ...rec, blob, thumb }); added++; have.add(m.id);
        const el = $('#ix'); if (el) el.textContent = `${added} Fotos übernommen …`;
      }
    }
    await loadEntries();
    closeSheet(); toast(`${added} Fotos wiederhergestellt${skipped ? `, ${skipped} schon vorhanden` : ''}${drawn ? `, ${drawn} Zeichnungen` : ''}`, 4000);
  } catch (err) { closeSheet(); toast('Fehler: ' + err.message, 5000); }
});
function geojson(list) {
  return {
    type: 'FeatureCollection',
    features: list.map(r => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [+r.lng.toFixed(7), +r.lat.toFixed(7)] }, properties: { id: r.id, name: r.title || '', notiz: r.note || '', datum: new Date(r.created).toISOString(), genauigkeit_m: r.acc ?? null, foto: `fotos/${r.id}.jpg` } }))
  };
}
function exportGeoJSON() {
  if (!entries.length) return toast('Noch keine Daten');
  saveFile(new Blob([JSON.stringify(geojson(entries), null, 1)], { type: 'application/geo+json' }), `blumenkarte-${stamp()}.geojson`, 'Die GeoJSON-Datei');
}

/* ============================================================
   Online/Offline, Service Worker, Start
   ============================================================ */
const netBadge = () => $('#offlineBadge').classList.toggle('show', !navigator.onLine);
addEventListener('online', netBadge); addEventListener('offline', netBadge); netBadge();
$('#offlineBadge').textContent = 'Offline – gespeicherte Karten';

if (!NATIVE && 'serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(e => console.warn('SW', e));
}
loadEntries().then(migrate).catch(e => toast('Datenbank-Fehler: ' + e.message, 5000));
askPersist();
// Ältere Einträge (Version 1) einmalig in ein sauberes, aufrecht gedrehtes JPEG umwandeln
async function migrate() {
  let n = 0;
  for (const e of entries.filter(e => !e.clean)) {
    const r = await DB.get(e.id); if (!r || r.clean) continue;
    try { const { img, url } = await loadImg(r.blob); const c = await encodeClean(img); URL.revokeObjectURL(url); r.blob = c.blob; r.clean = true; r.updated ||= r.created; await DB.put(r); n++; } catch { }
  }
  if (n) loadEntries();
}
window.__bk = { map, entries: () => entries, LAYERS, tileUrl, planDownload, readExif, makeZip, readZip };
