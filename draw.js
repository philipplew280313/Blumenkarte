/* Zeichnungen: Schützengräben, Stellungen & Co. als eigene Ebene über jeder Karte */
'use strict';

const SHAPE_COLORS = { red: '#ff2b2b', blue: '#2a7bff' };
const KIND_LABEL = { line: 'Graben', area: 'Stellung (Fläche)', point: 'Stellung (Punkt)' };
const SDB = IDB('shapes');
let shapes = [];
let draw = null; // aktiver Zeichenmodus: { tool, color, undo: [] }
const shapeGroup = L.featureGroup();
const r7 = n => Math.round(n * 1e7) / 1e7;

/* ---------- Laden & Darstellen ---------- */
async function loadShapes() { shapes = await SDB.all(); renderShapes(); }
function shapesShown() { return !!draw || store.get('shapesOn', true); }
function renderShapes() {
  shapeGroup.clearLayers();
  if (!shapesShown()) { map.removeLayer(shapeGroup); updateMenuDot(); return; }
  if (!map.hasLayer(shapeGroup)) shapeGroup.addTo(map);
  for (const s of shapes) if (draw || store.get('show_' + s.color, true)) addShapeLayer(s);
  updateMenuDot();
}
function addShapeLayer(s) {
  const c = SHAPE_COLORS[s.color] || SHAPE_COLORS.red, round = { lineCap: 'round', lineJoin: 'round' };
  const lys = [];
  if (s.kind === 'point') {
    lys.push(L.circleMarker(s.coords[0], { radius: 8, color: '#fff', weight: 2.5, fillColor: c, fillOpacity: .95 }));
  } else {
    const Ctor = s.kind === 'area' ? L.polygon : L.polyline;
    lys.push(Ctor(s.coords, { ...round, color: '#fff', weight: 7, opacity: .55, fill: false, interactive: false })); // heller Rand – sichtbar auf jeder Karte
    lys.push(Ctor(s.coords, { ...round, color: c, weight: 3.5, fillColor: c, fillOpacity: .18, interactive: false }));
    lys.push(L.polyline(s.kind === 'area' ? [...s.coords, s.coords[0]] : s.coords, { weight: 24, opacity: 0 })); // breite, unsichtbare Tippfläche
  }
  for (const l of lys) {
    l.addTo(shapeGroup);
    if (l.options.interactive !== false) l.on('click', ev => {
      if (draw && draw.tool !== 'move') return; // beim Zeichnen nicht stören
      L.DomEvent.stop(ev); openShape(s.id);
    });
  }
}

/* ---------- Speichern ---------- */
function shapesChanged() { store.set('shapesChanged', Date.now()); }
async function addShape(s) {
  s = { id: uid(), created: Date.now(), color: draw?.color || 'red', note: '', ...s };
  s.coords = s.coords.map(ll => [r7(ll.lat ?? ll[0]), r7(ll.lng ?? ll[1])]);
  await SDB.put(s); shapes.push(s); draw?.undo.push(s.id);
  shapesChanged(); renderShapes();
  return s;
}
async function deleteShape(id) {
  await SDB.del(id); shapes = shapes.filter(s => s.id !== id);
  shapesChanged(); renderShapes();
}

/* ---------- Zeichenmodus ---------- */
const TOOL_HINT = {
  move: 'Karte verschieben und zoomen. Gezeichnetes antippen, um Farbe oder Notiz zu ändern.',
  line: 'Mit einem Finger nachzeichnen. Zwei Finger verschieben & zoomen. Endet die Linie am Anfang, entsteht eine Fläche.',
  point: 'Antippen, um eine Stellung als Punkt zu setzen.'
};
function enterDraw() {
  closeSheet();
  if (!store.get('drawIntro')) {
    return openSheet('Gräben & Stellungen', `
      <p class="hint" style="font-size:15px;color:var(--ink-2)">Zeichne auf der Karte nach, was du im Gelände-Relief erkennst – in Rot oder Blau. Die Zeichnungen sind eine eigene Ebene und liegen über jeder Karte.</p>
      <p class="hint" style="font-size:15px;color:var(--ink-2)">Tipp: Mit <b>Gelände</b> und „Relief verstärken“ (Ebenen-Knopf) treten Gräben am deutlichsten hervor.</p>
      <p class="hint">Gut zu wissen: Viele Stellungen in Brandenburg sind Bodendenkmale, und in den alten Kampfgebieten liegt noch Munition im Boden. Vor Ort also nichts ausgraben oder aufheben.</p>
      <div class="row"><button class="btn primary" id="diOk">Los geht's</button></div>`,
      body => { $('#diOk', body).onclick = () => { store.set('drawIntro', true); enterDraw(); }; });
  }
  draw = { tool: 'line', color: store.get('drawColor', 'red'), undo: [] };
  setFollow(false);
  document.body.classList.add('drawing');
  setTool('line'); renderShapes();
}
function exitDraw() {
  cancelStroke();
  draw = null;
  map.dragging.enable();
  document.body.classList.remove('drawing', 'draw-line');
  renderShapes();
  const n = shapes.length;
  if (n) toast(`${n} ${n === 1 ? 'Zeichnung' : 'Zeichnungen'} gespeichert`);
}
function setTool(t) {
  draw.tool = t;
  if (t === 'line') map.dragging.disable(); else map.dragging.enable();
  document.body.classList.toggle('draw-line', t === 'line'); // Browser soll die Ein-Finger-Geste nicht selbst übernehmen
  syncDrawBar();
}
function syncDrawBar() {
  document.querySelectorAll('#drawbar [data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === draw.tool));
  document.querySelectorAll('#drawbar [data-color]').forEach(b => b.classList.toggle('on', b.dataset.color === draw.color));
  $('#drawHint').textContent = TOOL_HINT[draw.tool];
  $('#drawUndo').disabled = !draw.undo.length;
}
$('#drawbar').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || !draw) return;
  if (b.dataset.tool) setTool(b.dataset.tool);
  else if (b.dataset.color) { draw.color = b.dataset.color; store.set('drawColor', draw.color); syncDrawBar(); }
  else if (b.id === 'drawUndo') { const id = draw.undo.pop(); if (id) deleteShape(id).then(syncDrawBar); }
  else if (b.id === 'drawDone') exitDraw();
});
$('#btnDraw').addEventListener('click', enterDraw);

/* ---------- Freihand-Zeichnen mit dem Finger ---------- */
const mapEl = map.getContainer();
const activePointers = new Set();
let stroke = null;
function cancelStroke() { if (stroke) { map.removeLayer(stroke.line); stroke = null; } }
mapEl.addEventListener('pointerdown', e => {
  activePointers.add(e.pointerId);
  if (!draw || draw.tool !== 'line') return;
  if (activePointers.size > 1) return cancelStroke(); // zweiter Finger = zoomen/verschieben
  if (e.target.closest('.leaflet-control, .leaflet-marker-icon')) return;
  const ll = map.mouseEventToLatLng(e);
  stroke = { id: e.pointerId, pts: [ll], line: L.polyline([ll, ll], { color: SHAPE_COLORS[draw.color], weight: 3.5, opacity: .9, interactive: false, lineCap: 'round', lineJoin: 'round' }).addTo(map) };
}, true);
mapEl.addEventListener('pointermove', e => {
  if (!stroke || e.pointerId !== stroke.id) return;
  const p = map.mouseEventToContainerPoint(e);
  if (p.distanceTo(map.latLngToContainerPoint(stroke.pts.at(-1))) < 2) return;
  const ll = map.containerPointToLatLng(p);
  stroke.pts.push(ll); stroke.line.addLatLng(ll);
}, true);
const pointerEnd = e => {
  activePointers.delete(e.pointerId);
  if (stroke && e.pointerId === stroke.id) e.type === 'pointercancel' ? cancelStroke() : finishStroke();
};
mapEl.addEventListener('touchmove', e => { if (stroke) e.preventDefault(); }, { passive: false }); // iOS: kein Scrollen/Wackeln beim Zeichnen
mapEl.addEventListener('pointerup', pointerEnd, true);
mapEl.addEventListener('pointercancel', pointerEnd, true);
mapEl.addEventListener('pointerleave', e => { if (e.pointerType !== 'mouse') activePointers.delete(e.pointerId); }, true);

function finishStroke() {
  const pts = stroke.pts; cancelStroke();
  let px = pts.map(ll => map.latLngToLayerPoint(ll));
  let len = 0; for (let i = 1; i < px.length; i++) len += px[i].distanceTo(px[i - 1]);
  if (px.length < 2 || len < 10) return; // nur angetippt
  px = L.LineUtil.simplify(px, 1.2);
  const closed = px.length >= 4 && len > 60 && px[0].distanceTo(px.at(-1)) < 18;
  if (closed) px.pop();
  addShape({ kind: closed ? 'area' : 'line', coords: px.map(p => map.layerPointToLatLng(p)) }).then(syncDrawBar);
}
map.on('click', e => {
  if (draw?.tool === 'point') addShape({ kind: 'point', coords: [e.latlng] }).then(syncDrawBar);
});

/* ---------- Bearbeiten ---------- */
function shapeLength(s) { let m = 0; for (let i = 1; i < s.coords.length; i++) m += map.distance(s.coords[i - 1], s.coords[i]); return m; }
function shapeArea(s) {
  const P = s.coords.map(c => L.Projection.SphericalMercator.project(L.latLng(c)));
  let a = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; a += p.x * q.y - q.x * p.y; }
  const k = Math.cos(s.coords[0][0] * Math.PI / 180); return Math.abs(a / 2) * k * k;
}
const fmtLen = m => m >= 1000 ? (m / 1000).toFixed(2).replace('.', ',') + ' km' : Math.round(m) + ' m';
function shapeCenter(s) { return L.latLngBounds(s.coords).getCenter(); }
function openShape(id) {
  const s = shapes.find(x => x.id === id); if (!s) return;
  const size = s.kind === 'line' ? `Länge ca. ${fmtLen(shapeLength(s))}` : s.kind === 'area' ? `Fläche ca. ${Math.round(shapeArea(s)).toLocaleString('de-DE')} m² · Umfang ${fmtLen(shapeLength({ coords: [...s.coords, s.coords[0]] }))}` : fmtCoord(s.coords[0][0], s.coords[0][1]);
  openSheet(KIND_LABEL[s.kind] || 'Zeichnung', `
    <div class="seg" style="display:inline-flex;background:#2e2b25" id="shColor">
      <button data-c="red" class="${s.color === 'red' ? 'on' : ''}"><span style="color:${SHAPE_COLORS.red}">●</span> Rot</button>
      <button data-c="blue" class="${s.color === 'blue' ? 'on' : ''}"><span style="color:${SHAPE_COLORS.blue}">●</span> Blau</button>
    </div>
    <label class="field"><span>Notiz</span><textarea id="shNote" placeholder="z. B. Laufgraben, MG-Stellung, Geschützstellung …">${esc(s.note)}</textarea></label>
    <div class="meta">${size}<br>gezeichnet am ${fmtDate(s.created)}</div>
    <div class="row"><button class="btn" id="shNav">${ICON.nav}Hinführen</button><button class="btn danger" id="shDel">${ICON.trash}Löschen</button></div>
    <div class="row"><button class="btn primary" id="shOk">Fertig</button></div>`,
    body => {
      const save = async () => {
        const note = $('#shNote', body).value.trim();
        if (note !== s.note) { s.note = note; await SDB.put(s); shapesChanged(); updateMenuDot(); }
      };
      $('#shColor', body).onclick = async e => {
        const b = e.target.closest('button'); if (!b || b.dataset.c === s.color) return;
        s.color = b.dataset.c; await SDB.put(s); shapesChanged(); renderShapes();
        body.querySelectorAll('#shColor button').forEach(x => x.classList.toggle('on', x === b));
      };
      $('#shNav', body).onclick = () => { const c = shapeCenter(s); location.href = `https://maps.apple.com/?daddr=${c.lat},${c.lng}&dirflg=w`; };
      $('#shDel', body).onclick = async () => { if (!confirm('Diese Zeichnung löschen?')) return; await deleteShape(s.id); closeSheet(); };
      $('#shOk', body).onclick = () => closeSheet();
      return () => { save(); };
    });
}

/* ---------- GeoJSON Export / Import (QGIS, Google Earth via Umwandlung, Backup) ---------- */
function shapesGeoJSON(list = shapes) {
  return {
    type: 'FeatureCollection',
    features: list.map(s => {
      const ring = s.coords.map(([la, ln]) => [ln, la]);
      const geometry = s.kind === 'point' ? { type: 'Point', coordinates: ring[0] }
        : s.kind === 'area' ? { type: 'Polygon', coordinates: [[...ring, ring[0]]] }
          : { type: 'LineString', coordinates: ring };
      return { type: 'Feature', geometry, properties: { id: s.id, art: KIND_LABEL[s.kind], farbe: s.color === 'blue' ? 'blau' : 'rot', stroke: SHAPE_COLORS[s.color], notiz: s.note || '', datum: new Date(s.created).toISOString() } };
    })
  };
}
async function importShapesGeoJSON(gj) {
  const have = new Set(shapes.map(s => s.id)); let n = 0;
  const feats = gj.type === 'FeatureCollection' ? gj.features : gj.type === 'Feature' ? [gj] : [];
  const colorOf = p => {
    const v = String(p?.farbe || p?.color || p?.stroke || '').toLowerCase().trim();
    if (/blau|blue/.test(v)) return 'blue';
    const m = v.match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/);
    return m && parseInt(m[3], 16) > parseInt(m[1], 16) ? 'blue' : 'red';
  };
  for (const f of feats) {
    const g = f?.geometry; if (!g) continue;
    const p = f.properties || {}, base = { color: colorOf(p), note: p.notiz || p.note || p.name || '', created: Date.parse(p.datum) || Date.now() };
    const parts = [];
    const ll = c => [c[1], c[0]];
    if (g.type === 'Point') parts.push({ kind: 'point', coords: [ll(g.coordinates)] });
    else if (g.type === 'MultiPoint') g.coordinates.forEach(c => parts.push({ kind: 'point', coords: [ll(c)] }));
    else if (g.type === 'LineString') parts.push({ kind: 'line', coords: g.coordinates.map(ll) });
    else if (g.type === 'MultiLineString') g.coordinates.forEach(l => parts.push({ kind: 'line', coords: l.map(ll) }));
    else if (g.type === 'Polygon') parts.push({ kind: 'area', coords: g.coordinates[0].slice(0, -1).map(ll) });
    else if (g.type === 'MultiPolygon') g.coordinates.forEach(pg => parts.push({ kind: 'area', coords: pg[0].slice(0, -1).map(ll) }));
    for (const [i, part] of parts.entries()) {
      const id = p.id && parts.length === 1 ? String(p.id) : uid() + i;
      if (have.has(id) || part.coords.length < (part.kind === 'line' ? 2 : part.kind === 'area' ? 3 : 1)) continue;
      const s = { id, ...base, ...part, coords: part.coords.map(([a, b]) => [r7(a), r7(b)]) };
      await SDB.put(s); shapes.push(s); have.add(id); n++;
    }
  }
  if (n) { shapesChanged(); renderShapes(); }
  return n;
}
function exportShapes() {
  if (!shapes.length) return toast('Noch keine Zeichnungen');
  saveFile(new Blob([JSON.stringify(shapesGeoJSON(), null, 1)], { type: 'application/geo+json' }), `graeben-stellungen-${stamp()}.geojson`, 'Deine Zeichnungen (GeoJSON)');
}
$('#inShapes').addEventListener('change', async e => {
  const f = e.target.files[0]; if (!f) return;
  try { const n = await importShapesGeoJSON(JSON.parse(await f.text())); closeSheet(); toast(`${n} ${n === 1 ? 'Zeichnung' : 'Zeichnungen'} importiert`); }
  catch (err) { toast('Datei konnte nicht gelesen werden: ' + err.message, 5000); }
});

loadShapes().catch(e => toast('Zeichnungen: ' + e.message, 5000));
window.__bk.shapes = () => shapes;
