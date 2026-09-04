# Nyx UX Skeleton

Version: 0.1.0

Static HTML/CSS/JS skeleton for the Nyx dashboard UX.

## Run

```sh
python3 -m http.server 8769 --bind 127.0.0.1
```

Open:

```text
http://127.0.0.1:8769/
```

## Scope

- `index.html`: UX structure.
- `styles.css`: theme tokens and responsive layout.
- `app.js`: local interactions and live theme editor.
- `fixtures.json`: simulated Queue, Agenda, KM, NoteCortex, Multi-LLM and NoteDroppy data.

## Guarantees

- No real NotePlan writes.
- No real KM writes.
- No Nyx Core modification.
- Fixture-only runtime.

## Usage

Use the `Theme Editor` panel to change colors, radius, sidebar width and density.
The current theme is applied live, stored in `localStorage`, and exportable as CSS.
