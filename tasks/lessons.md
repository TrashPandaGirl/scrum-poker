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
