# Test audit

Baseline at the v82 branch: **127** Node cases passed in approximately **0.25 s** with test isolation disabled. The browser runner initially stopped on the first obsolete portrait-key assertion. Count cases using the complete Node command rather than counting files.

| System | Existing checks | Additions and remaining gaps |
| --- | --- | --- |
| Dialogue | Character branches, one-time and conditional options, shared endings, some effects, and Curdist scoring. | Packaged Chromium verifies real opening choices, one-time removal and UI restoration. Many dynamic dialogue graphs still depend on curated cases. Systematic speaker, runtime fallback, and all reward-versus-close paths remain future work. |
| Portraits | Existing dialogue-path checks and browser image assertions. | Validate every registered portrait ID, atlas cell range, file and state variant. The browser gate checks asset requests for startup. It does not inspect every expression or guard cameo in the DOM. |
| NPC and movement | Spawn spacing, collisions, route following, guard state, milk service, dances and blocked areas tested with simulated time. | Focused packaged browser integration exercises desktop and mobile dialogue input. Legacy end-to-end route remains unresolved. Manual path checks should cover the Creamery, southwest corner and range after map edits. |
| Currency, health and progression | Caps, payouts, independent outcomes, tally logic, penalties and many state flags. | No duplicated cases added. Cross-event priority and reward timing across all game-over paths remain incomplete. |
| Pages | No prior paired staging checks. | Verify the runtime-file allowlist, independent HTML content and revision markers. Test both packaged paths in Chromium. The game has no save data, so there is no migration or saved-state compatibility test. |

## Why browser expectations changed

- Portrait cache keys gained disguise and lipstick components. The test still checks the effective expression and the canvas, and compares the expression component of the cache key.
- The Elias introduction now has six intentionally interactive stages. The browser follows explicit choices and reserved Continue controls, then checks exactly which final questions remain after previous questions have been consumed.
- Continue moved into its own control while retaining the same progression. The test locates the visible `Continue →` control when checking a Continue beat.
- Runtime expression rotation deliberately alters an eligible third identical expression. The guard’s third deadpan beat is expected to resolve to speaking, as defined by that portrait family. The test checks the resolved variant.

The legacy browser run then reached the southwest route check and failed. It expected camera Y **2740** and observed approximately **2170.47** after holding down. The cause has not been established as a gameplay bug or a stale route fixture. The assertion remains in place and there are no gameplay changes for it. Subsequent checks in that suite are unverified. This is separate from the packaged Chromium smoke test.

## Testing cost and review

Use `npm test` after every routine change. The fast suite covers 129 cases and runs in roughly 0.3 s in the local Node runner. Run `npm run test:pages` when touching staging, controls, shared dialogue or asset loading. Use `npm run test:browser` to exercise the broader routes and report its outstanding failure explicitly. No tests were removed. Chromium execution in a restricted Codex container may require loopback network permission and `CHROMIUM_NO_SANDBOX=1`.

Luna is a reasonable fit for explicit dialogue, portrait mappings and routine NPC changes backed by a focused fixture. Keep a human or stronger-model review for systemic mechanics, save-data design, environment promotion, and unexplained Chromium failures. Manual checks should cover spoken-button order, portrait attribution across NPC cameos, movement after scene closure, and near-threshold rewards.
