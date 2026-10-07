# Blumenkarte – Installation aufs iPhone

Die App ist eine Web-App. Sie muss einmal im Internet liegen (kostenlos, HTTPS),
damit das iPhone Kamera, GPS und Offline-Speicher freigibt. Danach läuft sie vom
Home-Bildschirm wie eine normale App, auch ohne Netz.

## 1. Online stellen (einmalig, ca. 5 Minuten)

**Variante A – Netlify Drop (am einfachsten, am Computer)**
1. ZIP entpacken.
2. https://app.netlify.com/drop öffnen, kostenloses Konto anlegen.
3. Den entpackten Ordner `blumenkarte` ins Browserfenster ziehen.
4. Du bekommst eine Adresse wie `https://irgendwas-123.netlify.app`.
   Unter „Site configuration → Change site name“ kannst du sie z. B. in
   `philips-blumenkarte` umbenennen.

**Variante B – GitHub Pages**
1. Auf github.com ein neues Repository anlegen (z. B. `blumenkarte`).
2. „Add file → Upload files“ → alle Dateien aus dem Ordner hochladen.
3. Settings → Pages → Branch `main` / Ordner `/ (root)` → Save.
4. Adresse: `https://DEINNAME.github.io/blumenkarte/`

## 2. Aufs iPhone holen
1. Die Adresse in **Safari** öffnen.
2. Teilen-Knopf → **„Zum Home-Bildschirm“**.
3. Ab jetzt immer über das Blumen-Icon starten (nicht über Safari) –
   die App hat ihren eigenen Speicher.
4. Beim ersten Start Standort („Beim Verwenden der App“) und Kamera erlauben.

## 3. Karten offline speichern
- `•••` → **Ganz Brandenburg & Berlin**: Übersicht fürs ganze Land
  (Zoom 13 ≈ 20.000 Kacheln, ca. 1,2 GB für Luftbild + Gelände).
- `•••` → **Sichtbaren Ausschnitt speichern**: ein Gebiet bis zur vollen Schärfe
  (Zoom 18). Vorher auf die Gegend zoomen, in der du unterwegs bist.
- Im WLAN machen, App offen und iPhone entsperrt lassen. Bricht es ab:
  einfach neu starten, Fertiges wird übersprungen.

## Bedienung
- **Kamera-Knopf**: Foto machen → Name + Notiz → Speichern. Die Position wird
  im Moment des Tippens per GPS genommen; mit „Anpassen“ kannst du sie auf der
  Karte korrigieren.
- **Luftbild / Gelände** oben: sofort umschalten.
- **Ebenen-Knopf**: zusätzlich Satellit weltweit (Esri) und OpenStreetMap
  (für außerhalb Brandenburgs, nur online).
- **Pfeil-Knopf**: zu deinem Standort springen und mitlaufen.
- **Raster-Knopf**: alle Funde als Galerie, mit Suche.
- Fotos auf der Karte antippen: Detail, Bearbeiten, Position ändern,
  Hinführen (Apple Karten, zu Fuß), Teilen, Löschen.
- **Aus Fotomediathek hinzufügen**: ältere Fotos importieren. Die Position kommt
  aus den Foto-Daten, wenn iOS sie mitliefert (in der Auswahl ggf. „Optionen →
  Ort einbeziehen“), sonst setzt du sie auf der Karte.

## Wichtig: So gehen deine Daten nicht verloren
Die App speichert alles auf dem iPhone. Zusätzlich sichert sie jede Blume in
deine **Fotomediathek** (und damit in iCloud-Fotos):

- Nach dem Speichern geht das Teilen-Menü auf → **„Bild sichern“** tippen.
  Das Bild trägt dann Position, Datum, Name und Notiz in sich und erscheint
  auch in der Karte der iPhone-Fotos-App.
- Ein **oranger Punkt** am `•••`-Knopf zeigt: Es gibt noch ungesicherte Blumen.
  `•••` → „Jetzt in Fotos sichern“ sichert bis zu 20 auf einmal.
- **Wiederherstellen** (z. B. neues iPhone oder App gelöscht):
  `•••` → „Aus Fotos wiederherstellen“ → die Blumen-Bilder auswählen
  (in der Fotos-App z. B. ein Album „Blumen“ anlegen, dann geht das schnell).
  Alles kommt mit Position, Name und Notiz zurück.
- Zusätzlich gibt es die **Backup-Datei (ZIP)** für iCloud Drive oder den
  Computer (enthält auch `blumen.geojson` für QGIS).
- **App-Updates** (neue Dateien an dieselbe Adresse hochladen) löschen nichts.
  Nur wenn du das App-Icon vom Home-Bildschirm löschst, ist der App-Speicher weg.

## Luftbild 1953
Oben auf **„1953“** tippen. Historische Luftbilder der LGB, schwarz-weiß, 1 m
Auflösung. Geflogen im Sommer 1953, deckt ca. 90 % von Brandenburg ab.
Wo Bilder vorliegen, zeigt Ebenen-Knopf → „Abdeckung Luftbild 1953“.

## Gräben & Stellungen nachzeichnen
- Seitenknopf mit der Zickzack-Linie → **Zeichenmodus**.
- **Graben**: mit einem Finger nachzeichnen. Zwei Finger verschieben und zoomen.
  Führst du die Linie zurück zum Anfang, wird eine **Fläche** daraus
  (z. B. eine Geschützstellung).
- **Stellung**: antippen setzt einen Punkt.
- **Rot / Blau** wählen, **Rückgängig**, **Fertig**.
- Gezeichnetes antippen → Farbe ändern, Notiz schreiben, Länge/Fläche sehen,
  hinführen lassen, löschen.
- Ebenen-Knopf → „Meine Zeichnungen anzeigen“, Rote und Blaue getrennt
  ein- und ausblenden. Die Zeichnungen liegen über jeder Karte, also auch
  über Luftbild und 1953.
- **Relief verstärken** (Ebenen-Knopf): hebt flache Gräben im Gelände hervor.
  Am besten bei Zoom 17–19 mit „Gelände“ zeichnen.
- Die Zeichnungen sind in der **Backup-Datei (ZIP)** enthalten, nicht in den
  Fotos. Der orange Punkt am `•••`-Knopf erinnert dich, wenn sie seit dem
  letzten Backup geändert wurden. Export/Import als GeoJSON für QGIS.

Gut zu wissen: Viele Stellungen sind Bodendenkmale, und in den alten
Kampfgebieten liegt noch Munition im Boden. Vor Ort nichts ausgraben oder
aufheben.

## Kartendaten
Luftbild (DOP20) und Geländemodell (DGM 1 m): © GeoBasis-DE/LGB,
Datenlizenz Deutschland – Namensnennung 2.0. Deckt Brandenburg und Berlin ab.
