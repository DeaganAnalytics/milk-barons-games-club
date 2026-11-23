# milk-barons-games-club
A retro RPG-style browser game featuring the Milk Baron, developed as an experiment in AI-assisted game development using OpenAI Codex.

## Play

Move with WASD, the arrow keys, or the on-screen directional buttons. Press E, Space, or Interact near the Baron, Milo, or a guard to choose dialogue replies. Listen for the Baron’s overhead remarks as you explore the hall. If the Baron stays out of view for ten seconds, he heads for the rug nearest you, including the center rug. Milo Milksworth moves between corners and tries to keep clear of the Baron.

## Run locally

From the repository root, run `python3 -m http.server 8000` and open `http://localhost:8000`. The site uses native browser modules and runs directly from the static files.

## Project structure

- `index.html` and `style.css` define the page and responsive controls.
- `src/main.mjs` connects the page and runs the frame loop. `src/game.mjs` creates the world and advances it one step at a time.
- `src/input.mjs` handles keyboard and touch controls. `src/player.mjs`, `src/baron.mjs`, `src/milo.mjs`, and `src/guards.mjs` own each character's behavior.
- `src/room.mjs` defines the 3×5 hall, rugs, camera bounds, and interaction ranges. `src/collision.mjs`, `src/movement.mjs`, and `src/directions.mjs` handle shared movement rules.
- `src/dialogue-content.mjs` contains the conversations and unlock rules. `src/dialogue.mjs` connects them to the reply buttons and portrait atlas.
- `src/hall-art.mjs` assembles the approved hall assets. Add `?floor=planks` to preview the wide-plank floor.
- `src/render.mjs` draws the hall and animates its characters. `src/speech-layout.mjs` keeps overhead dialogue inside the viewport.

## Tests

Run `node --test tests/game.test.mjs` for the movement, collision, dialogue, and patrol tests. GitHub Actions runs this suite on pull requests.

The browser smoke test uses Node 22 or newer and a local Chromium or Chrome instance. With the HTTP server running, start Chromium with `chromium --headless --remote-debugging-port=9227 --user-data-dir="$(mktemp -d)" about:blank`, then run `node tests/browser.mjs`. Set `GAME_URL` to test a different URL. Set `SCREENSHOT_PREFIX` to save desktop and mobile screenshots.

## GitHub Pages

In **Settings → Pages**, select **Deploy from a branch**, choose **main** and **/ (root)**, and save. GitHub Pages serves `index.html` at the project URL.

[Open the club](https://deagananalytics.github.io/milk-barons-games-club/)
