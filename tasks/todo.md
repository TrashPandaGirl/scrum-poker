# Scrum Poker — Todo

## Stack & Entscheidungen
- React + Vite
- Echtzeit über Firebase Firestore (Projekt `epicscrummasterkastl`, Collection `pokerRooms`)
- Skalen: Presets (Fibonacci, T-Shirt) + eigene, frei definierbare Reihen
- Deploy-Ziel: gh-pages (wie penalty-wrangler)

## Aufgaben
- [x] Vite + React Projekt-Scaffold anlegen (package.json, vite.config, index.html, src/)
- [x] Firebase SDK einbinden, Config + Firestore init (src/firebase.js)
- [x] Datenmodell: Raum {scale, revealed, votes:{name:value|null}, round, createdAt}
- [x] Home-Screen: Raum erstellen (Skala wählen/custom) + Raum beitreten (Code + Name)
- [x] Raum-Screen: Kartendeck, eigene Stimme abgeben
- [x] Teilnehmerliste mit "hat abgestimmt"-Status (verdeckt bis Reveal)
- [x] Reveal / Reset Buttons
- [x] Ergebnis-Auswertung nach Reveal (Durchschnitt, Verteilung, Konsens)
- [x] Custom-Skala Editor (eigene Werte kommagetrennt)
- [x] Persistenz: Name + Raum in localStorage (Reconnect)
- [x] Styling (sauber, responsive)
- [x] Lokal testen mit Preview-Tools, Echtzeit-Sync verifizieren
- [x] Firestore-Rules für pokerRooms freigeben (Console) + versioniert in firestore.rules

## Feature: Admin-Rechte (darf aufdecken)  ✅ fertig & getestet
- [x] Datenmodell: room.admins (Array von Namen); Ersteller ist erster Admin
- [x] createRoom bekommt creatorName → admins:[creatorName]
- [x] grantAdmin/revokeAdmin (arrayUnion/arrayRemove); letzten Admin nicht entziehbar
- [x] Aufdecken/Neue Runde nur für Admins sichtbar; Nicht-Admins sehen Hinweis
- [x] Teilnehmerliste: 👑 für Admins; Admin kann per Klick Rechte vergeben/entziehen
- [x] Backward-Compat: Räume ohne admins-Feld → alle dürfen aufdecken
- [x] Verlassener Admin wird aus admins entfernt
- [x] End-to-End getestet: Ersteller=Admin, befördern, degradieren, letzter-Admin-Schutz, Nicht-Admin-Sicht (🔒)

## Feature: Pokertisch-Redesign  ✅ fertig & getestet
- [x] Datenmodell: spectators[] (Namen die nicht schätzen); Ersteller default Zuschauer
- [x] room.js: createRoom setzt spectators:[creator]; setSpectating (arrayUnion/Remove + Vote clear)
- [x] Switch oben rechts: "Ich schätze mit / nicht" (togglet eigene Teilnahme)
- [x] Estimators = present ∖ spectators; reveal/votedCount/Auswertung nur über Estimators
- [x] Pokertisch-Layout: grüner ovaler Filz-Tisch, je Schätzer ein Slot in der Mitte
- [x] Leerer (gestrichelter) Slot solange nicht geschätzt
- [x] Eigene gefächerte Kartenhand unten; Klick spielt Karte, markiert Auswahl
- [x] Spielanimation: Karte gleitet verdeckt in den Mitte-Slot (pcard-in keyframe)
- [x] Aufdeck-Animation: Flip links→rechts gestaffelt, gesamt ~2s (verifiziert: 0ms/1500ms)
- [x] Karten-Rückseite mit austauschbarem Logo-Slot (public/card-back-logo.svg, cardBack.js)
- [x] Zuschauer dezent anzeigen (👁 Leiste)
- [x] End-to-End getestet: default-Zuschauer, Switch, Sitze, Play-Anim, Sweep, nur-Schätzer-Auswertung

## Offen / optional
- [ ] Dead CSS aufräumen (.deck/.card/.participants — durch Tisch ersetzt)
- [x] Echtes Logo eingesetzt: wienit (logo-wienit.svg, transparent) → Navy-Karte mit weißem Medaillon

## Review
- [x] End-to-End verifiziert: erstellen → beitreten → abstimmen → aufdecken → Auswertung → neue Runde
- [ ] Optional offen: gh-pages Deploy, Räume automatisch aufräumen (TTL), Karten-Klick-Flakiness ist reines Test-Artefakt (funktioniert real)
