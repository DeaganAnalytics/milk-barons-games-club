# Milk Baron's Games Club — Agent Instructions

## Project Overview
Milk Baron's Games Club is a browser-based HTML5 game project hosted publicly using GitHub Pages.

Live website:
https://deagananalytics.github.io/milk-barons-games-club/

The project is developed iteratively using AI coding agents, particularly OpenAI Codex. Prioritise simple, reliable implementations that preserve existing gameplay and functionality.

## Core Development Principles
- Make the smallest practical changes necessary to complete the requested task.
- Preserve existing functionality unless explicitly instructed otherwise.
- Do not refactor, rename, reorganise or rewrite unrelated code.
- Reuse existing functions, components, assets and patterns wherever practical.
- Prefer straightforward, readable code over unnecessary abstractions.
- Do not introduce dependencies, frameworks, build tools or external services without approval.
- Avoid creating unnecessary files or duplicating existing functionality.
- Maintain the existing project architecture unless a change is explicitly requested.
- Do not implement additional features beyond the requested scope.

## Repository and File Management
- Inspect relevant files before modifying them.
- Read only the files needed to understand and complete the task; expand the search when necessary.
- Preserve existing file names and directory structure unless changes are required.
- Avoid modifying unrelated configuration, documentation or assets.
- Do not delete existing assets or code without a clear reason.
- Keep changes focused and easy to review through Git diffs.
- Do not commit, push, merge or deploy changes unless explicitly requested or required by the active workflow.

## GitHub Pages Compatibility
- Public URL: https://deagananalytics.github.io/milk-barons-games-club/
- Maintain compatibility with GitHub Pages static hosting.
- Do not introduce server-side runtime requirements.
- Use relative paths for scripts, stylesheets and assets where appropriate.
- Do not assume the website is hosted at the domain root.
- Preserve the existing entry point and deployment structure.
- Do not modify GitHub Actions, publishing settings or deployment configuration unless specifically required.
- Avoid changes that could break existing published URLs.
- Assume changes merged into the publishing branch may become publicly visible automatically.

## Gameplay and Compatibility
- Preserve existing gameplay mechanics unless a change is explicitly requested.
- Maintain compatibility with modern desktop and mobile browsers.
- Support desktop keyboard controls and Android touchscreen controls.
- Avoid changes that introduce unnecessary input latency or reduce responsiveness.
- Preserve existing game state, movement, collision and rendering behaviour unless the task requires modification.
- Ensure visual changes work across different screen sizes and orientations where practical.
- Do not remove existing accessibility or usability features.

## Assets and Visual Changes
- Reuse existing assets where practical.
- Keep new assets appropriately sized for web delivery.
- Avoid introducing large files unnecessarily.
- Use consistent visual styling with the existing game.
- Do not replace existing artwork unless explicitly requested.
- Ensure asset paths work under the GitHub Pages project subdirectory.
- Do not introduce external asset hosting without approval.

## Testing and Validation
- Run focused checks relevant to the files and functionality changed.
- Prefer existing testing tools and workflows.
- Do not introduce an elaborate testing framework for a small change.
- Check for syntax errors and obvious runtime issues.
- For gameplay changes, verify the relevant controls and game mechanics where testing is available.
- For asset or deployment changes, check relative paths and GitHub Pages compatibility.
- Do not claim that browser or gameplay testing occurred unless it was actually performed.
- If testing is unavailable, explain what remains unverified.
- Avoid repeatedly running expensive or redundant checks.

## Efficiency and Codex Usage
- Keep investigation proportional to the task's complexity.
- Avoid repeatedly reading large files when the relevant context is already available.
- Use targeted searches and inspections where possible.
- Avoid unnecessary tool calls, repeated tests and unrelated analysis.
- Do not rewrite entire files when a small targeted change is sufficient, unless the file structure makes that impractical.
- Prefer completing straightforward tasks directly rather than creating extensive implementation plans.
- For complex or potentially disruptive changes, briefly explain the proposed approach before proceeding.
- Do not sacrifice correctness or adequate testing merely to reduce token usage.

## Security and Privacy
- Never add secrets, credentials, API keys or private tokens to the repository.
- Do not introduce analytics, tracking, advertising or telemetry without explicit approval.
- Do not add external network requests unless required and approved.
- Avoid unnecessary third-party services.
- Do not modify repository security settings or permissions without approval.

## Communication and Reporting
- Keep responses concise and focused on the requested task.
- Ask clarifying questions only when ambiguity materially affects implementation or risks breaking existing behaviour.
- Clearly identify assumptions when necessary.
- After completing a task, briefly summarise:
  - What changed.
  - Which files were modified.
  - What tests or checks were performed.
  - Any known limitations or outstanding issues.
- Do not provide lengthy explanations of routine implementation details unless requested.

## Priority
When instructions conflict, prioritise:
1. Explicit instructions in the current task and applicable higher-priority instructions.
2. Correctness, security and preservation of existing functionality.
3. Minimal, maintainable changes.
4. Compatibility with the existing project and GitHub Pages deployment.
5. Efficiency and reduced unnecessary Codex usage.

## Working on develop

- Start routine changes on `develop` or a feature branch targeting `develop`. Never push routine work to `main` or merge production changes without explicit user approval.
- Read `DEVELOPMENT_GUIDE.md` for the relevant implementation recipe. Follow existing patterns and avoid speculative or unrelated refactoring.
- Preserve supplied wording, punctuation, portrait identifiers, branching conditions and scripted effects. Report ambiguities and unsupported requirements.
- Run focused tests while developing, then run the complete Node suite with `npm test`. Add targeted regression tests where appropriate. Investigate failures, explain intentional expectation changes, and never weaken tests just to pass.
- Review the Git diff before finishing. Report tests passed, failed or skipped and any remaining uncertainty.
- Regenerate creative exports from source with `npm run creative -- --zip` when dialogue or portraits change. Maintain portrait annotations and identifier consistency. See `creative/README.md`.

## Pip dialogue

- Every line Pip speaks in a conversation must appear as a selectable response button with his exact words, even if there is only one option. Selecting it advances straight to the next beat. Keep explicit annotations such as `[Lie]` on the choice.
- Use **Continue** for advancing NPC dialogue or narration. Never use it in place of Pip's words or repeat his selected line in the dialogue panel.
- Author new Pip lines as response choices. Existing `speaker: 'Pip'` beats use the shared conversion to buttons. Do not add more such placements or embed a literal `Pip:` prefix in dialogue text.
- Run `npm test` for the source scan and check the affected conversation in the browser when changing dialogue presentation.
