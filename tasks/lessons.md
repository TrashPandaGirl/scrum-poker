# Lessons

## Vite + Preview-Harness Port
- **Pattern:** Der Preview-Harness weist den Port über die `PORT`-Env-Variable zu, aber Vite liest die nicht automatisch und wählt bei belegtem 5173 einfach den nächsten freien Port → Proxy zeigt auf leere Seite.
- **Regel:** In `vite.config.js` immer `server.port = Number(process.env.PORT) || 5173` setzen, wenn mit dem Preview-Harness gearbeitet wird.

## Projekt-Konvention: Speicherort
- **Pattern:** Alle echten Projekte liegen unter `~/ClaudeProjects/<name>`, nicht als Sibling-Ordner. Ein leerer `~/ScrumPoker`-Ordner war ein Ausreißer.
- **Regel:** Neue Projekte unter `~/ClaudeProjects/` anlegen; leere Sibling-Ordner nicht als Projekt-Root verwenden (auch weil preview `cwd` innerhalb des Projekt-Roots erzwingt).

## Firebase Firestore Rules bei geteiltem Projekt
- **Pattern:** Wiederverwendung eines bestehenden Firebase-Projekts scheitert an Security-Rules, wenn eine neue Collection nicht in den Rules erlaubt ist (`permission-denied`).
- **Regel:** Vor dem Wiederverwenden prüfen/klären, ob die neue Collection in den Firestore-Rules freigegeben ist. Rules-Deploy von lokal überschreibt die komplette Ruleset — nie blind deployen; stattdessen match-Block in der Console ergänzen lassen oder Rules versioniert im Projekt halten.

## Firestore-Feldpfade mit User-Input (blank-screen-Crash)
- **Pattern:** `updateDoc(ref, { [`votes.${name}`]: v })` interpretiert `.` im Namen als verschachtelten Feldpfad. Name mit Punkt in der Mitte („T.K") → verschachtelte Daten `{T:{K:v}}` → React rendert ein Objekt → „Objects are not valid as a React child" → **ganze App blank** (kein Error-Boundary = weißer Screen). Name endet mit „." → `updateDoc` wirft sofort.
- **Regel:** Dynamische Feldpfade aus User-Input NIE als String bauen. `new FieldPath('votes', name)` benutzen (behandelt `name` literal). Zusätzlich: (1) Werte defensiv normalisieren (nur erwartete Primitive rendern), (2) IMMER eine Error-Boundary um die App, damit ein einzelner Fehler nie alles weißschießt. Vote-Werte konsistent als `String(value)` speichern.
