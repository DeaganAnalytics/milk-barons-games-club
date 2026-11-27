# Creative references

Install Node 24, Python 3.10+ with Pillow, and Chromium or Google Chrome. Run `npm ci` and `python3 -m pip install -r creative/requirements.txt` once. Generate everything with:

```sh
npm run creative -- --zip
```

Find the Markdown documents, PNGs, manifest, counts and optional ZIP in `creative/output/`. Generated exports are ignored by Git. They stay out of the game and Pages package.

- `npm run creative -- --combined --zip` exports a single contact sheet.
- `npm run creative -- --character professor` exports a sheet for one exact character ID.
- `--output PATH` writes to a separate directory. Use this to keep both combined and grouped exports.
- `--skip-pip` skips procedural character captures if headless Chromium is unavailable. Point `CHROMIUM` at a different browser executable if required. Managed environments that cannot launch the browser sandbox can set `CHROMIUM_NO_SANDBOX=1` for the local capture.

The exporter parses JavaScript with Acorn and writes literal text and surrounding source. Conditions, helper-defined turn ordering, state and random expressions are visible in the excerpts. The initial inventory is intentionally broad and can include interface text or technical strings. It does not solve every dynamic branch or infer every speaker and portrait at runtime. Counts represent source excerpts and text candidates rather than unique playable scenes.

The portrait catalogue reads the game's registry and resolvers. Bundled files outside this registry appear as unreferenced artwork when identified as portraits by path. One atlas asset may supply multiple cells. Emotion notes in `portrait-notes.json` are the interpretive layer. They can be keyed by mood, by exact path, or by an atlas path with a row/column suffix. Include observations separate from emotion, intensity and use. The static usage report separates explicit mood attributes, positional references and fallback candidates. It does not estimate player selection frequency.
