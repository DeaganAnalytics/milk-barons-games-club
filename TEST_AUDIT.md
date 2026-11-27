# Test audit

Baseline at the v82 branch: **127** Node cases passed in approximately **0.25 s** with test isolation disabled. The browser runner initially stopped on the first obsolete portrait-key assertion. Count cases using the complete Node command rather than counting files.

| System | Existing checks | Additions and remaining gaps |
| --- | --- | --- |
| Dialogue | Character branches, one-time and conditional options, shared endings, some effects, and Curdist scoring. | Packaged Chromium verifies real opening choices, one-time removal and UI restoration. Many dynamic dialogue graphs still depend on curated cases. Systematic speaker, runtime fallback, and all reward-versus-close paths remain future work. |
| Portraits | Existing dialogue-path checks and browser image assertions. | Validate every registered portrait ID, atlas cell range, file and state variant. The browser gate checks asset requests for startup. It does not inspect every expression or guard cameo in the DOM. |
| NPC and movement | Spawn spacing, collisions, route following, guard state, milk service, dances and blocked areas tested with simulated time. | Focused packaged browser integration exercises desktop and mobile dialogue input. The legacy end-to-end route detours around the west-wall slot machines. Manual path checks should cover the Creamery, southwest corner and range after map edits. |
| Currency, health and progression | Caps, payouts, independent outcomes, tally logic, penalties and many state flags. | No duplicated cases added. Cross-event priority and reward timing across all game-over paths remain incomplete. |
| Pages | No prior paired staging checks. | Verify the runtime-file allowlist, independent HTML content and revision markers. Test both packaged paths in Chromium. The game has no save data, so there is no migration or saved-state compatibility test. |

## Why browser expectations changed

- Portrait cache keys gained disguise and lipstick components. The test still checks the effective expression and the canvas, and compares the expression component of the cache key.
- The Elias introduction now has six intentionally interactive stages. The browser follows explicit choices and reserved Continue controls, then checks exactly which final questions remain after previous questions have been consumed.
- Continue moved into its own control while retaining the same progression. The test locates the visible `Continue →` control when checking a Continue beat.
- Runtime expression rotation deliberately alters an eligible third identical expression. The guard’s third deadpan beat is expected to resolve to speaking, as defined by that portrait family. The test checks the resolved variant.

- The old southwest route predated the slot machines. Chromium observed a stop at camera Y **2170.47** where the next step intersects the first slot. The route now detours around the bank, retaining the original **2740** southwest camera assertion and both guest-position checks.
- The Milo intro follows the current button wording through its final reply. The current portrait expressions are checked at the matching beats.
- The waiter roster test increases the Resource Timing buffer before navigation and waits for all expected requests. A controlled run confirmed that the old 250-entry buffer filled while the larger buffer recorded all portrait requests.
- The Feta and Skim tests now check the named waiter, the welcoming portrait and Pip’s visible speaker attribution.
- The Lifeguard test checks the nine current labels in order, including the pool-work question.

## Testing cost and review

Use `npm test` after every routine change. The fast suite covers 129 cases and runs in roughly 0.3 s in the local Node runner. Run `npm run test:pages` when touching staging, controls, shared dialogue or asset loading. Use `npm run test:browser` to exercise the broader routes. No tests were removed. Chromium execution in a restricted Codex container may require loopback network permission and `CHROMIUM_NO_SANDBOX=1`.

Luna is a reasonable fit for explicit dialogue, portrait mappings and routine NPC changes backed by a focused fixture. Keep a human or stronger-model review for systemic mechanics, save-data design, environment promotion, and unexplained Chromium failures. Manual checks should cover spoken-button order, portrait attribution across NPC cameos, movement after scene closure, and near-threshold rewards.

## Cutover validation

The complete `npm run test:all` run passed in the managed Chromium environment. It covered **129 Node cases**, the packaged desktop and mobile browser checks at `/` and `/dev/`, and the full legacy browser suite through all four corners, milk service, Lifeguard, and the floor preview. The legacy fixes change fixtures and assertions only. The production diff adds a read-only portrait catalogue for exports and changes no artwork or gameplay logic. The public Pages deployment requires a separate live check after the settings switch.

## GitHub Actions Chromium startup

After PR #84, Game tests #7 passed Node tests but timed out waiting for the Chromium debugger on the Ubuntu 26.04 runner before running browser assertions. The creative job was skipped on that push, but the PR run also failed to start the capture debugger. The logs showed D-Bus errors without establishing the underlying cause. Both browser-dependent jobs now use the same pinned Chrome for Testing headless shell on Ubuntu 24.04. Startup diagnostics identify the debugger endpoint and include Chromium output. Test assertions and Pages publishing are unchanged.
