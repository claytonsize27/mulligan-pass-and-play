# Mulligan · Pass & play

[Play the live game](https://claytonsize27.github.io/mulligan-pass-and-play/)

A mobile-first, offline-capable golf card game for **2–4 human or CPU players on one phone**. Static files, zero runtime dependencies, no server, no accounts, no paid integrations. Independent **house edition** based on the official game's public tutorial and card examples.

## Run and verify

Requires Node.js 22+ for development only. No package installation needed.

```sh
npm test
npm start
# Open http://localhost:4173
npm run build
```

Serve over HTTP/HTTPS; opening `index.html` directly through `file://` does not support ES modules or the service worker. Production is only the `dist/` folder. All URLs are relative, including the service-worker scope, so GitHub project subpaths work.

## Play

Name 2–4 players, select 1/3/9/18 holes or enter a custom scorecard, and tee off. Pass the phone through private club/action/target choices. Reveal all shots, make a private reaction pass, then swing together. Lowest total strokes wins. Reload resumes behind a privacy screen. Add to Home Screen from your mobile browser for standalone use.

The game autosaves locally. Clearing browser storage removes the save. No cloud sync is implemented or required. Private hands are hidden from ordinary UI, not encrypted against device owners or developer tools.

## Read next

- [Consolidated requirements](docs/REQUIREMENTS.md)
- [Rules, evidence, inferred deck and limitations](docs/RULES.md)
- [Architecture and state flowcharts](docs/ARCHITECTURE.md)
- [Free GitHub Pages publishing](docs/DEPLOYMENT.md)
- [Validation and handoff](docs/VALIDATION.md)
- [Product decisions](PRODUCT.md) and [visual system](DESIGN.md)

## Repository map

`src/cards.js` is the sole deck catalogue. `src/engine.js` contains DOM-independent, immutable state transitions and inventory assertions. `src/app.js` renders the interface. `src/storage.js` handles versioned local saves. `sw.js` caches the app for offline play. `test/engine.test.js` tests rules and complete games. `scripts/` contains dependency-free serving/build helpers. `.github/workflows/pages.yml` tests, builds and publishes.

## Cost and hosting

Designed for a **public GitHub repository on GitHub Free** and the default `github.io` address. No purchased domain or paid service is necessary. GitHub's published usage limits still apply. No ongoing compute, scheduled jobs, polling, analytics SDKs, or API calls occur during play. The app requires network only for initial installation, updates, and explicitly opened source links.

Deployment status is recorded in `docs/DEPLOYMENT.md`; this README does not imply that publishing has already happened.


## Player options and deck continuity

Human names start empty; leave one blank to use Player N. CPU names are assigned automatically from difficulty (for example CPU - Normal), with numbered suffixes for duplicates. Each seat independently offers Human or CPU (Easy, Normal, Hard, Expert). All-CPU spectator rounds are supported. CPUs share the same finite deck and legal moves; no private opponent cards or draw order enter their decisions. Discard identities are hidden from humans and all CPU levels; Expert estimates opponents from the catalogue and its own hand only.

Keep your hand between holes. Played cards are replaced up to eight; only an exhausted draw pile triggers a shuffle of currently discarded cards. Overshoots appear beyond the course flag with their distance, and shared reveals include action-effect descriptions.

`src/cpu.js` contains the observation boundary and strategies; `src/course-view.js` provides course scale geometry. `test/cpu.test.js` covers hidden-information independence, legacy saves, all difficulty levels and card continuity across holes.
