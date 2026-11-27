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

Use Node 24. The browser tests also require Chromium or Google Chrome, Bash, Python 3 and curl. Set `CHROMIUM`, `TEST_HTTP_PORT` or `TEST_DEBUG_PORT` if needed. See [test audit](TEST_AUDIT.md) for scope, findings, and validation results.

## Creative reference exports

Run `npm ci` and `python3 -m pip install -r creative/requirements.txt`. With Chromium installed, run `npm run creative -- --zip`. Download the resulting ZIP or individual Markdown and PNG files from `creative/output/`. See [creative exports](creative/README.md) for sheet options, output scope and annotation instructions.

## GitHub Pages

- Production: [game root](https://deagananalytics.github.io/milk-barons-games-club/), from `main`.
- Development: [dev game](https://deagananalytics.github.io/milk-barons-games-club/dev/), from `develop` once the Actions rollout is approved and configured.

Open feature PRs against `develop`. Promote tested work through a PR from `develop` to `main`, with explicit owner approval. Revert a bad production change with an approved revert PR to `main`; promote or backport the revert to `develop` when appropriate.

The Pages workflow runs the complete Node suite for each candidate independently, stages the game using a runtime-file allowlist, and publishes one artifact. A failed candidate keeps that environment’s last published revision. The other can still advance. The workflow checks both branch heads every run and uses one deployment concurrency group. The packaged HTML shows the actual revision, with **DEV BUILD** only in development. The game currently has no saved progress, persistent browser keys or service worker. Any future persistence must namespace development keys and continue reading existing production keys.

### Cutover

1. In [Settings → Pages](https://github.com/DeaganAnalytics/milk-barons-games-club/settings/pages), record the current source and last successful production commit. Keep the release variable disabled until the setup is ready.
2. In **Settings → Environments → github-pages**, allow the `main` and `develop` branches. If deployment reviewers are required, approve the Pages deployment when prompted. Confirm Actions can write the two deployment tag refs.
3. Set the Pages source to **GitHub Actions**. In **Settings → Secrets and variables → Actions → Variables**, set `PAGES_RELEASES_ENABLED` to `true`. From **Actions → Publish game to Pages**, run the workflow on `main`.
4. Check that Actions completed the deploy and pin steps. Open both URLs and confirm the game starts. The production heading shows the published `main` commit. The development heading shows **DEV BUILD** and the published `develop` commit. From a machine that can reach Pages, run `GAME_URL=https://deagananalytics.github.io/milk-barons-games-club/ npm run test:pages` to repeat the browser smoke checks against the public site.
5. After the next approved change to `develop`, verify that its published commit advances and the production commit remains the same. Compare both served headings and the deployment pins.

### Rollback and recovery

For a gameplay release rollback, open a revert PR against `main` and have the owner approve the merge. The next successful Pages run restores production from the revert and preserves the selected development revision. Verify both URLs and the new pins.

For an infrastructure rollback, first disable `PAGES_RELEASES_ENABLED` and let any in-progress deploy finish. Restore the previously recorded Pages source in **Settings → Pages**. If that source is **Deploy from a branch**, select its recorded branch and directory. Verify production at the root URL. Branch-based publishing can remove the separate `/dev/` site until the Actions workflow is re-enabled.

The two Git tags point to the most recently successful Pages deployment and are updated together after deploy succeeds. Git keeps these source snapshots independently of artifact retention. If a pin is lost or a Pages deploy succeeds but tag writing fails, recover the exact successful revisions from the workflow log or the deployed page titles, then restore the affected refs before running again. For initial cutover, test both heads first. If no pin exists and that environment fails testing, deployment stops to preserve any existing site. Once both pins exist, either environment can independently fall back. Workflow checkout should remain full-depth so the pinned commits can be archived.
