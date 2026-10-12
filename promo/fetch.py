import json, math, os, urllib.request, concurrent.futures as cf, time
R = 6378137.0
req = json.load(open('promo/request.json'))
os.makedirs('promo/out', exist_ok=True)
def merc(lat, lon):
    return R * math.radians(lon), R * math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))
def job(j):
    out = 'promo/out/' + j['name']
    if 'url' in j:
        url = j['url']
    else:
        x, y = merc(j['lat'], j['lon'])
        k = 1 / math.cos(math.radians(j['lat']))     # Bodenmeter -> Mercator-Meter
        hw, hh = j['w'] * k / 2, j.get('h', j['w']) * k / 2
        px = j['px']; py = round(px * hh / hw)
        fmt = j.get('fmt', 'image/jpeg')
        url = (f"{j['wms']}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS={j['layers']}&STYLES={j.get('styles','')}"
               f"&CRS=EPSG%3A3857&FORMAT={fmt.replace('/','%2F')}" + ("&TRANSPARENT=TRUE" if 'png' in fmt else "") +
               f"&WIDTH={px}&HEIGHT={py}&BBOX={x-hw:.2f},{y-hh:.2f},{x+hw:.2f},{y+hh:.2f}")
    for attempt in range(4):
        try:
            t = time.time()
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 HeimatScan-promo'}), timeout=180) as r:
                data = r.read(); ct = r.headers.get('Content-Type', '')
            if ('xml' in ct or 'text' in ct) and not out.endswith(('.txt', '.json', '.xml')):
                raise RuntimeError('Server-Antwort: ' + data[:300].decode('utf8', 'replace'))
            open(out, 'wb').write(data)
            return f"OK {j['name']} {len(data)} B {time.time()-t:.1f}s"
        except Exception as e:
            err = str(e); time.sleep(3)
    open(out + '.error.txt', 'w').write(err + '\n' + url)
    return f"FEHLER {j['name']}: {err}"
with cf.ThreadPoolExecutor(4) as ex:
    for r in ex.map(job, req['jobs']):
        print(r, flush=True)
