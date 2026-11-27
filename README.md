# milk-barons-games-club
A retro RPG-style browser game featuring the Milk Baron, developed as an experiment in AI-assisted game development using OpenAI Codex.

## Play

Move with WASD, the arrow keys, or the on-screen directional buttons. Press E, Space, or Interact near the Baron, Milo, a guard, one of the milk servers, or Edmund Skim to talk. Listen for the Baron’s overhead remarks as you explore the hall. If the Baron stays out of view for ten seconds, he heads for the rug nearest you, including the center rug. Milo Milksworth moves between corners and tries to keep clear of the Baron.


Every minute of active time outside dialogue and rug travel, the Baron calls for milk. The closest server with milk delivers it, and Edmund Skim clears the broken glass before the Baron resumes his rounds.

The Backroom Creamery is built into the upper-left wall. Walk up to the hatch and interact to talk to the bartender.

## Run locally

From the repository root, run `python3 -m http.server 8000` and open `http://localhost:8000`. The site uses native browser modules and runs directly from the static files.

## Project structure

- `index.html` and `style.css` define the page and responsive controls.
- `src/main.mjs` creates the game state, connects the controls and dialogue panel, and runs the frame loop.
- `src/input.mjs`, `src/player.mjs`, and `src/directions.mjs` handle keyboard and touch input, movement, and facing.
- `src/room.mjs` holds the map dimensions, camera bounds, interactions, and collision geometry. `src/baron.mjs` controls the Baron's rug walks, dialogue, and expressions.
- `src/milo.mjs` controls Milo’s hiding spots and movement. `src/staff.mjs` controls the six servers and Edmund Skim, the cleaner, who roams the hall and stops to sweep.
- `src/hall-art.mjs` assembles the approved sprites in `assets/hall/`. Add `?floor=planks` to the URL to preview the wide-plank floor.
- `src/render.mjs` draws the room and animates its characters using the images in `assets/`, including the repeating parquet texture.

## Development

See [Development guide](DEVELOPMENT_GUIDE.md) for code locations, common changes and test recipes.

- `npm test` runs every Node test. Run it after routine changes.
- `npm run test:pages` stages both site layouts and checks startup, assets, desktop keyboard and mobile touch in Chromium.
- `npm run test:browser` runs the longer gameplay suite.
- `npm run test:all` runs the complete suite, including both browser suites.

Use Node 24. The browser tests also require Chromium or Google Chrome, Bash, Python 3 and curl. Set `CHROMIUM`, `TEST_HTTP_PORT` or `TEST_DEBUG_PORT` if needed. See [test audit](TEST_AUDIT.md) for the outstanding legacy browser failure.

## Creative reference exports

Run `npm ci` and `python3 -m pip install -r creative/requirements.txt`. With Chromium installed, run `npm run creative -- --zip`. Download the resulting ZIP or individual Markdown and PNG files from `creative/output/`. See [creative exports](creative/README.md) for sheet options, output scope and annotation instructions.

## GitHub Pages

- Production: [game root](https://deagananalytics.github.io/milk-barons-games-club/), from `main`.
- Development: [dev game](https://deagananalytics.github.io/milk-barons-games-club/dev/), from `develop` once the Actions rollout is approved and configured.

Open feature PRs against `develop`. Promote tested work through a PR from `develop` to `main`, with explicit owner approval. Revert a bad production change with an approved revert PR to `main`; promote or backport the revert to `develop` when appropriate.

The Pages workflow runs the complete Node suite for each candidate independently, stages the game using a runtime-file allowlist, and publishes one artifact. A failed candidate keeps that environment’s last published revision. The other can still advance. The workflow checks both branch heads every run and uses one deployment concurrency group. The packaged HTML shows the actual revision, with **DEV BUILD** only in development. The game currently has no saved progress, persistent browser keys or service worker. Any future persistence must namespace development keys and continue reading existing production keys.

### Cutover and recovery

Only after owner approval, confirm the last production commit in the Pages deployment history. In **Settings → Pages**, set Source to **GitHub Actions**. Allow the `github-pages` environment to deploy from `main` and `develop`; permit the workflow to write the `pages-production` and `pages-development` tag refs. Set the repository Actions variable `PAGES_RELEASES_ENABLED` to `true`. Once the workflow is available on `main`, run **Publish game to Pages** manually or push an approved change. Verify both URLs before treating cutover as complete. For an immediate infrastructure rollback, turn off the variable and restore the previous Pages source under owner approval.

The two Git tags point to the most recently successful Pages deployment and are updated together after deploy succeeds. Git keeps these source snapshots independently of artifact retention. If a pin is lost or a Pages deploy succeeds but tag writing fails, recover the exact successful revisions from the workflow log or the deployed page titles, then restore the affected refs before running again. For initial cutover, test both heads first. If no pin exists and that environment fails testing, deployment stops to preserve any existing site. Once both pins exist, either environment can independently fall back. Workflow checkout should remain full-depth so the pinned commits can be archived.
