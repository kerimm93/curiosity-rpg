# 🔭 Curiosity RPG

**Ein persönliches Wissensmanagement-System das Lernen in ein RPG verwandelt.**

Curiosity RPG läuft vollständig im Browser als einzelne HTML-Datei, speichert alle Daten lokal bei dir, und lässt sich optional über GitHub Gist zwischen Geräten synchronisieren. Kein Server, kein Account, keine Werbung, keine Installation.

→ **[App öffnen](https://kerimm93.github.io/curiosity-rpg)**

---

## Was die App macht

Wissen hat eine Struktur wie eine Weltenkarte. **Welten** sind Themenfelder, **Kontinente** sind Strömungen, **Länder** sind Werkkorpora, **Städte** sind Bücher, **Dörfer** sind Artikel und Podcasts. Diese Metapher gibt dem Lernsystem eine Orientierung die flache Ordner nie bieten können.

---

## Features

### 🗺️ Wissenshierarchie
Welt → Kontinent → Land → Stadt/Dorf — fünf Ebenen für komplexe Wissensstrukturen. Karten- und Tabellenansicht wechselbar. Inline-Bearbeitung in der Tabelle für schnelle Korrekturen nach Importen.

### ⚔️ Verschachtelte Quests
Quests können beliebig tief verschachtelt werden: Abschnitt → Kapitel → Unterkapitel → Aufgabe. Orte lassen sich mit einem Klick in Quests konvertieren — alle bisherigen Quests werden automatisch zu Unterquests.

### 🧠 Wissen
Begriffe, Skills und offene Fragen als eigene Objekte, mit Typ-System und KI-gestütztem Training. Drei Modi: Prüfung, Sokratisch, Erklären in eigenen Worten.

### 📚 Anti-Library
Strategischer Backlog für Medien die du noch nicht gelesen hast. Kanban und Tabellenansicht, direkt editierbar.

### 📬 Queue mit Spaced Repetition
Die Anti-Library wird zur Lernwarteschleife. Fünf Bewertungen (Nochmal / Bald / Gut / Sehr gut / Skip) steuern das Intervall. Tab-Badge zeigt fällige Einträge. Erste Karte direkt im Dashboard bewertbar.

### ⑤ Sprints
Lernvorhaben mit Intention, atomaren Schritten (Verb + Objekt), Hilfsmitteln und Erfolgskriterium.

### 🔭 Feynman-Probleme
Übergeordnete offene Fragen als Hintergrundfilter für alles was du liest. Aktiv oder dormant, verknüpfbar mit Wissen-Einträgen.

### 🔄 KI-gestütztes Verfeinern
Für jedes Objekt wird ein maßgeschneiderter Prompt generiert — ADHS-optimiert nach Verb-Objekt-Struktur. Ergebnis direkt zurückimportieren mit Diff-Vorschau.

### 🔌 Integrationen
- **Readwise Reader** — Tag-basierter Import in die Anti-Library
- **Raindrop.io** — URL-Regelwerk: definiere welche Domains importiert werden und welchen Typ sie bekommen (Letterboxd → Film, Audible → Hörbuch etc.)
- **Zotero** — Web-API, immer aktuell, durchsuchbar; BibTeX als Fallback

Alle API-Keys bleiben lokal im Browser — nie exportiert, nie synchronisiert.

### ☁️ GitHub Gist Sync
Auto-Sync nach jeder Änderung, Versionscheck vor jedem Upload, Merge-Modus bei Konflikten.

### 📊 Export & Import
JSON (vollständig, mit Merge-Modus), CSV pro Bereich, Universalimport mit KI-Prompts.

### 📱 Responsive
Dark Theme. Hamburger-Menü auf Mobile. Touch-optimierte Targets.

---

## In Planung

- Dashboard weiter ausbauen
- Lese-Sessions tracken
- Projekte als Container über Sprints hinweg
- Readwise Highlights in Prompts einbetten (Zettelkasten-Workflow)
- Semantische Relationen zwischen Wissen-Einträgen
- Relationen zwischen Orten (Städtepartnerschaft)

---

## Selbst hosten

1. Repository forken oder `index.html` herunterladen
2. Als `index.html` in ein GitHub-Repository laden
3. Settings → Pages → Branch: main → Save
4. App läuft unter `https://username.github.io/repository-name`

**GitHub Gist Sync einrichten:**
1. Neues privates Gist auf [gist.github.com](https://gist.github.com)
2. Personal Access Token mit `gist`-Berechtigung auf [github.com/settings/tokens](https://github.com/settings/tokens)
3. Beides in der App unter ⚙ Daten → GitHub Gist Sync eintragen

---

## Technisch

- Einzelne HTML-Datei, kein Framework, kein Build-Step, kein Backend
- Vanilla JavaScript
- Daten im `localStorage`, optional GitHub Gist als Cloud
- MIT Lizenz
