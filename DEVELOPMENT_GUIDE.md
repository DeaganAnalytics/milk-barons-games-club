# Development guide

Use this guide before changing a game system. Read the nearest existing example, make the smallest change, and run `npm test` before completing any routine change.

## Find the code

| Task | Start here |
| --- | --- |
| Game wiring and effects | `src/main.mjs` creates playthrough state, routes dialogue actions, updates NPCs and renders each frame. |
| Conversation controls | `src/dialogue.mjs` opens dialogues, filters available replies, resolves portraits and restores the game UI. |
| Movement and interactions | `src/input.mjs` normalises keyboard and touch input. `src/player.mjs` moves Pip. `src/room.mjs` defines candidate interactions, paths and collision rules. |
| NPC behaviour | `src/staff.mjs`, `src/milk-service.mjs`, `src/guards.mjs`, `src/baron.mjs` and `src/milo.mjs` manage state and movement. Drawing belongs in `src/render.mjs` and dedicated sprite modules. |
| Player state | `src/coins.mjs`, `src/health.mjs`, `src/karma.mjs` and `src/tally.mjs` implement accounting and caps. Restart reloads the page. The current game has no save or service-worker implementation. |
| Longer dialogue and scoring | `src/professor-interview.mjs` builds the interview. `src/curdist-assessment.mjs` tracks its independent narrative scores. |

## Routine recipes

### Dialogue

1. Locate the character's dialogue module and the matching entry point in `createDialogue`. A dialogue node can have `text`, `mood`, `replies`, `speaker` and `character`. A reply has a `label` and a `next` node, callback, or `null` to close.
2. Preserve supplied wording, portrait IDs and choice ordering. Use response buttons for Pip's spoken choices and **Continue** for consecutive NPC beats. When another NPC speaks, specify the character ID and check that the caption matches their portrait.
3. Put playthrough progress inside the existing conversation factory or game state. Use a unique once key where the scene uses the central reply filter. Decide whether the request consumes the choice on selection or completion. `src/lifeguard-dialogue.mjs` and `src/dj-dialogue.mjs` show existing approaches.
4. For a reward, use the existing action and state APIs. `enterAction` runs when a node is shown. Closing can dispatch a node action or an explicit `exitAction`. Verify payment timing and replay prevention. Never duplicate a reward in both callbacks.
5. For a focused check, use `node --test --test-isolation=none --test-name-pattern='lifeguard|Mystic' tests/game.test.mjs` or `node --test --test-isolation=none tests/curdist-interview.test.mjs`. Then run **`npm test`**. Open and close the affected conversation in a browser if the change involves controls, attribution, or effects.

### Portraits

Find the exact character and mood in `src/dialogue.mjs` and the character's dialogue module. The first configured mood is the default. Unsupported moods can fall back and repeated expressions can rotate. A tray, injury, lipstick or another state can select different artwork. Distinguish the requested mood from the ultimately rendered asset. Use the asset conventions already in place. Update creative annotations where the artwork warrants it, then regenerate the exports with `npm run creative -- --zip`. Run `npm test`, and check representative dialogue and state variants at desktop and mobile sizes.

### NPCs, movement and gameplay

Reuse the NPC's existing state and update loop. Keep ambient speech separate from portrait dialogue. Check spawn spacing, collisions and pathing, dialogue pause/resume, and the transition back to normal duties. Prefer deterministic tests with supplied random inputs and simulated time. For money, karma or health, verify boundaries and one-time rewards through normal entry points. Run focused tests by filtering `tests/game.test.mjs`, then run `npm test`. Use `npm run test:pages` for packaged startup and input. For changes to movement, scene timing or map geometry, run the longer `npm run test:browser` and manually exercise the affected routes.

## Hand-off and escalation

Luna is suitable for supplied-text edits, adding choices using an established pattern, adjusting explicit portrait IDs, adding focused tests, and changing NPC settings with a clear existing example. Provide the exact implementation files, state changes and a runnable test. Review its diff for unrelated changes.

Use a stronger model for cross-character state, multi-step or concurrent rewards, collision geometry, new persistence or save migrations, deployment changes, and browser failures with unclear causes. Treat unexplained test failures or uncertain intent as review points. Record the failing command and expected player behaviour before proposing an assertion change.
