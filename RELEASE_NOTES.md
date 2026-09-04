# Release Notes

## v0.1.0 - 2026-09-03

Initial usable skeleton.

- Extracted the Nyx dashboard mockup into static `HTML/CSS/JS`.
- Added fixture-driven panes and tabs.
- Added collapsible sidebar, tabs, pane close/collapse/zoom, drag reorder, search.
- Added live `Theme Editor`.
- Added presets: `Nyx`, `Graphite`, `Daylight`.
- Added CSS export, reset, and local persistence.
- Added responsive bottom editor panel for narrow viewports.

Verified:

- `node --check app.js`
- HTTP `200 OK` for `index.html`, `styles.css`, `app.js`, `fixtures.json`
- Browser-visible render
- Live preset application
- Density slider state update
