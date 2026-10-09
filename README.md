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

## Karten
Oben umschalten: **Luftbild** · **Historisch** · **Gelände**. Alle drei gibt es für
**Brandenburg, Berlin und Sachsen**; an der Landesgrenze setzt die App die
Bilder beider Länder nahtlos zusammen.

| Karte | Brandenburg & Berlin (LGB) | Sachsen (GeoSN) |
|---|---|---|
| Luftbild | aktuell, 20 cm | aktuell, 20 cm |
| Historisch | Luftbild Sommer 1953, 1 m, s/w | Satellitenbild 1965 (Corona), 2 m, s/w |
| Gelände | DGM-Schummerung 1 m | DGM-Schummerung 2 m |

Für Sachsen ist 1965 das älteste frei verfügbare Kartenbild nach 1945
(ältere Luftbilder liegen nur als Einzelbilder beim Bundesarchiv).

**Hybrid** (Knopf oben links): legt Wege und Ortsnamen durchsichtig über jede
Karte. Bleibt an, wenn du zwischen Luftbild, Historisch und Gelände wechselst.

## Offline-Karten
- `•••` → **Sichtbaren Ausschnitt speichern** oder **Ganz Brandenburg & Berlin** /
  **Ganz Sachsen** (Übersicht). Ebenen und Detailstufe wählen → Herunterladen.
- Der Download läuft weiter, wenn du das Fenster schließt; unten auf der Karte
  zeigt ein **Fortschritts-Chip** den Stand. Antippen → Details oder Abbrechen.
- Jede Kachel wird geprüft (echtes Bild?). Fehlgeschlagene werden mit Grund
  angezeigt und lassen sich mit **Fehlende nachladen** nachholen.
- Wird die App mittendrin geschlossen, bietet sie beim nächsten Start
  **Fortsetzen** an.
- **Gespeicherte Gebiete** stehen im Menü: zeigen, prüfen/fortsetzen, löschen.
- In der App werden **angesehene Karten automatisch mitgespeichert**
  (abschaltbar im Menü).
- Zoomst du offline weiter hinein, als gespeichert ist, zeigt die App die
  gröbere Kachel vergrößert, statt einer leeren Fläche.

## Intro
Beim Start läuft ein kurzes Intro (1,2 s). Antippen überspringt es.

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

## Echte iPhone-App mit AltStore (kostenlos, Windows-PC)
Die App wird bei jeder Änderung automatisch von GitHub gebaut. Neueste Version:
https://github.com/PhilipPlew280313/Blumenkarte/releases/latest/download/Blumenkarte.ipa

**Einmalig am Windows-PC**
1. **iTunes** und **iCloud** direkt von apple.com laden, nicht aus dem
   Microsoft Store. Mit deiner Apple-ID anmelden.
2. **AltServer** von altstore.io laden (AltStore Classic, Windows), entpacken,
   `Setup.exe` ausführen, dann AltServer **als Administrator** starten.
   Zugriff auf „private Netzwerke“ erlauben.
3. iPhone per Kabel anschließen, entsperren, „Vertrauen“ tippen.
4. In iTunes beim iPhone **„Mit diesem iPhone über WLAN synchronisieren“**
   einschalten.
5. Unten rechts in der Taskleiste aufs AltServer-Symbol → **Install AltStore**
   → dein iPhone → Apple-ID und Passwort eingeben.

**Einmalig am iPhone**
6. Einstellungen → Allgemein → VPN & Geräteverwaltung → deine Apple-ID →
   **Vertrauen**.
7. Einstellungen → Datenschutz & Sicherheit → **Entwicklermodus** einschalten,
   iPhone startet neu, „Einschalten“ bestätigen.
8. In Safari den Link oben öffnen → `Blumenkarte.ipa` wird in „Dateien“
   geladen.
9. **AltStore** öffnen → Reiter **Meine Apps** → **+** oben links →
   `Blumenkarte.ipa` wählen. Fertig, das Blumen-Icon erscheint.

**Automatisch erneuern (alle 7 Tage)**
- AltServer am PC laufen lassen (startet mit Windows, wenn du ihn in den
  Autostart legst), PC und iPhone im **selben WLAN**.
- Am iPhone: Einstellungen → AltStore → **Hintergrundaktualisierung** an.
- AltStore erneuert dann selbst. Zeigt AltStore „läuft in 1 Tag ab“, einmal
  in AltStore auf **Alle aktualisieren** tippen.
- Mit kostenloser Apple-ID: höchstens 3 solcher Apps gleichzeitig
  (AltStore selbst zählt mit).

**Neue Version installieren:** Link oben erneut laden und in AltStore wieder
über **+** installieren. Deine Fotos und Zeichnungen bleiben erhalten.
Wichtig: die App **nicht löschen**, sonst ist der App-Speicher weg.

Die App-Version hat eigene Daten, getrennt von der Web-Version auf dem
Home-Bildschirm. Zum Umziehen: in der Web-Version **Backup-Datei erstellen**,
in der App **Backup-Datei wiederherstellen**.

## Kartendaten
- Brandenburg & Berlin: © GeoBasis-DE/LGB, Datenlizenz Deutschland – Namensnennung 2.0
- Sachsen: © GeoSN, dl-de/by-2-0; Satellitenbild 1965: © GeoSN/USGS, CC BY-NC-SA 2.0
- Hybrid (Wege & Orte): Esri, HERE, Garmin, © OpenStreetMap-Mitwirkende
- Landesgrenzen: deutschlandGeoJSON, © GeoBasis-DE/BKG
