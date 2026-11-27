"""Generate disposable authoring resources from a game checkout."""
import argparse
import collections
import json
from pathlib import Path
import shutil
import subprocess
import tempfile

from PIL import Image, ImageDraw, ImageFont

from capture_pip import capture_pip

ROOT = Path(__file__).resolve().parents[1]
MAJORS = ("pip", "baron", "elias", "professor", "lin-waitress", "milk-mystic", "slot-executive")
NAMES = {
    "pip": "Pip", "baron": "Milk Baron", "elias": "Elias", "milo": "Milo Milksworth", "guard": "Bull Guard",
    "professor": "Professor", "milk-mystic": "Milk Mystic", "slot-executive": "Lady Penelope",
    "male-waiter": "Feta", "handlebar-waiter": "Bull", "martini-waiter": "Sterling",
    "female-waiter": "Genevieve", "blonde-waitress": "Brie", "lin-waitress": "Lin",
    "edmund-vale": "Edmund Skim", "dj": "DJ Dairy",
}
CELL_WIDTH, CELL_HEIGHT = 285, 278
MAX_BYTES = 20_000_000


def identity(entry):
    return entry["character"], entry["mood"] or "", entry["variant"], entry["asset"]


def discover(catalogue):
    referenced = {entry["asset"] for entry in catalogue}
    for path in sorted((ROOT / "assets").rglob("*")):
        asset = path.relative_to(ROOT).as_posix()
        if not path.is_file() or path.suffix.lower() not in {".webp", ".png"} or asset in referenced:
            continue
        if "portrait" in asset.lower() or asset.startswith("assets/dialogue/"):
            yield {"character": "unreferenced", "mood": None, "variant": "", "asset": asset, "cell": None, "default": False}


def artwork(entry):
    with Image.open(entry.get("image", ROOT / entry["asset"])) as original:
        image = original.convert("RGBA")
    if entry["cell"]:
        width, height = image.width // 3, image.height // 4
        column, row = entry["cell"]["column"], entry["cell"]["row"]
        image = image.crop((column * width, row * height, (column + 1) * width, (row + 1) * height))
    return image


def render(entries, path, title, combined=False):
    columns = min(len(entries), 8 if combined else 5)
    rows = (len(entries) + columns - 1) // columns
    image = Image.new("RGB", (columns * CELL_WIDTH, rows * CELL_HEIGHT + 45), "#182327")
    draw = ImageDraw.Draw(image)
    text_font = ImageFont.load_default(size=15)
    title_font = ImageFont.load_default(size=22)
    draw.text((12, 10), title, font=title_font, fill="white")
    for index, entry in enumerate(entries):
        column, row = index % columns, index // columns
        x, y = column * CELL_WIDTH, row * CELL_HEIGHT + 45
        draw.rectangle((x + 4, y + 3, x + CELL_WIDTH - 5, y + CELL_HEIGHT - 5), fill="#e0e4e4")
        art = artwork(entry)
        art.thumbnail((CELL_WIDTH - 24, 198), Image.Resampling.NEAREST)
        image.paste(art, (x + (CELL_WIDTH - art.width) // 2, y + 8 + (198 - art.height) // 2), art)
        labels = [NAMES.get(entry["character"], entry["character"]),
                  entry["mood"] or Path(entry["asset"]).stem, entry["variant"]]
        height = y + 210
        for label in filter(None, labels):
            words, line = label.split(), ""
            for word in words + [""]:
                while word and draw.textlength(word, font=text_font) > CELL_WIDTH - 24:
                    if line:
                        draw.text((x + 10, height), line, font=text_font, fill="#152126")
                        height += 17
                        line = ""
                    midpoint = max(i for i in range(1, len(word)) if draw.textlength(word[:i], font=text_font) <= CELL_WIDTH - 24)
                    draw.text((x + 10, height), word[:midpoint], font=text_font, fill="#152126")
                    height += 17
                    word = word[midpoint:]
                candidate = " ".join(filter(None, (line, word)))
                if not word or draw.textlength(candidate, font=text_font) > CELL_WIDTH - 24:
                    if line:
                        draw.text((x + 10, height), line, font=text_font, fill="#152126")
                        height += 17
                    line = word
                else:
                    line = candidate
        if height > y + CELL_HEIGHT - 4:
            raise ValueError(f"Clipped portrait label: {identity(entry)}")
    image.save(path, optimize=True)
    if path.stat().st_size >= MAX_BYTES:
        raise ValueError(f"Contact sheet exceeds 20 MB: {path}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=ROOT / "creative/output")
    parser.add_argument("--skip-pip", action="store_true", help="Skip procedural Pip captures when Chromium is unavailable")
    parser.add_argument("--zip", action="store_true")
    parser.add_argument("--combined", action="store_true", help="Use one combined sheet instead of the grouped deck")
    parser.add_argument("--character", action="append", help="Limit contact sheets to these exact character identifiers")
    args = parser.parse_args()
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as folder:
        stage = Path(folder)
        subprocess.run(["node", str(ROOT / "creative/extract.mjs"), str(stage)], check=True)
        data = json.loads((stage / "inventory.json").read_text())
        catalogue = data["catalogue"]
        procedural = [] if args.skip_pip else list(capture_pip(ROOT, stage))
        unreferenced = list(discover(catalogue))
        entries = sorted([*catalogue, *procedural, *unreferenced], key=identity)
        keys = [identity(entry)[:3] for entry in catalogue]
        problems = [f"Duplicate identifier: {key}" for key, count in collections.Counter(keys).items() if count > 1]
        missing = {entry["asset"] for entry in catalogue if not (ROOT / entry["asset"]).is_file()}
        problems.extend(f"Missing asset: {name}" for name in sorted(missing))
        valid = [entry for entry in entries if entry["asset"] not in missing]
        selected = [entry for entry in valid if not args.character or entry["character"] in args.character]
        if not selected:
            parser.error("No portraits matched the requested characters")
        group_for = {}
        groups = collections.defaultdict(list)
        for entry in selected:
            character = entry["character"]
            key = ("all-portraits" if args.combined else character
                   if character in MAJORS or args.character else
                   "unreferenced-artwork" if character == "unreferenced" else
                   "staff-and-guests" if character in NAMES and character not in {"guard", "dj", "milo"} else
                   "club-characters" if not character.startswith(("dancer-", "slot-")) else
                   "dance-and-gaming")
            groups[key].append(entry)
        for key, group in sorted(groups.items()):
            filename = f"portraits-{key}.png"
            render(group, stage / filename, NAMES.get(key, key.replace("-", " ").title()), args.combined)
            for entry in group:
                group_for[identity(entry)] = filename
        write_index(stage, entries, group_for, problems)
        write_usage(stage, data)
        summary = {
            "characters_or_objects": len({entry["character"] for entry in [*catalogue, *procedural]}),
            "registered_portraits": len(catalogue), "procedural_portraits": len(procedural), "unreferenced_artwork": len(unreferenced),
            "source_sequences": data["sequences"], "candidate_lines": data["lines"],
            "contact_sheets": len(groups), "problems": problems
        }
        (stage / "SUMMARY.json").write_text(json.dumps(summary, indent=2) + "\n")
        prior = output / "CREATIVE_FILES.txt"
        if prior.exists():
            for name in prior.read_text().splitlines():
                if Path(name).name == name and (output / name).is_file():
                    (output / name).unlink()
        exported = [path.name for path in stage.iterdir() if path.is_file() and path.suffix in {".png", ".md", ".json"} and path.name != "inventory.json"]
        for name in exported:
            shutil.copy2(stage / name, output / name)
        prior.write_text("\n".join(sorted(exported)) + "\n")
        if args.zip:
            archive = stage / "transfer"
            archive.mkdir()
            for name in exported:
                shutil.copy2(stage / name, archive / name)
            shutil.make_archive(str(output / "MILK_CLUB_CREATIVE"), "zip", archive)
        print(json.dumps(summary, indent=2))


def write_index(stage, entries, sheets, problems):
    notes_file = ROOT / "creative/portrait-notes.json"
    notes = json.loads(notes_file.read_text()) if notes_file.exists() else {}
    rows = [
        "# Portrait index", "",
        "Runtime identifiers are character and mood pairs. State variants share the underlying mood identifier. "
        "Asset-only filenames in the unreferenced inventory have no established runtime identifier. "
        "An unreferenced asset may have a non-dialogue use. Observations describe common visual cues within the inspected mood groups. Emotional readings and suggested uses are interpretive.", "",
        "The first configured mood is the default where a character has a registered expression list. "
        "An unsupported requested mood falls back to that default unless a special variant is recognised. "
        "When an expression has appeared twice, the renderer can select another available expression in its mood family. "
        "Empty trays, lipstick, disguises, milk splatter, tussled hair and injury may affect presentation independently.", "",
        "Pip’s portrait is drawn at runtime by `src/pip-art.mjs`. Canvas expressions, disguise, lipstick and the "
        "milk moustache combine procedurally. The Pip sheet captures individual expressions and representative combinations.", "",
        "| Mood / variant | Asset | Sheet | Observed features | Interpretive notes |",
        "| --- | --- | --- | --- | --- |",
    ]
    table_header = rows[-2:]
    del rows[-2:]
    last_character = None
    for entry in entries:
        if entry["character"] != last_character:
            last_character = entry["character"]
            rows.extend(["", f"## {NAMES.get(last_character, last_character)} (`{last_character}`)", "", *table_header])
        path = entry["asset"]
        key = path if not entry["cell"] else f"{path}#{entry['cell']['row']},{entry['cell']['column']}"
        note_key = entry["mood"]
        if not note_key:
            parts = Path(path).stem.split("-")
            note_key = parts[-1] if parts[-1] in notes else None
        observation, interpretation = notes.get(key, notes.get(note_key, [
            "Object or alternate artwork. See the artwork and variant label.",
            "For object or state-specific presentation. Avoid treating this as a facial emotion."
        ]))
        cues = {"milk splattered": "Visible milk on hair and clothing.",
                "tousled": "Loose strands around the face.",
                "empty tray": "No glass is visible.",
                "lipstick": "Lipstick marks on the face.",
                "milk moustache": "Pale milk line above the mouth.",
                "milk moustache and lipstick": "Milk line and lipstick marks are both visible.",
                "moustache": "False moustache drawn over the upper lip.",
                "eyePatch": "Eye patch and false moustache.",
                "woman": "Styled hair and alternate clothing."}
        if entry["variant"] in cues:
            observation += " " + cues[entry["variant"]]
        mood = f"`{entry['mood']}`" if entry["mood"] else "No mood ID"
        variant = entry["variant"] or ("default" if entry["default"] else "")
        sheet = sheets.get(identity(entry), "—")
        rows.append(f"| {mood} {variant} | `{key}` | {sheet} | {observation} | {interpretation} |")
    rows.extend(["", "## Validation issues", "", *([f"- {problem}" for problem in problems] or ["None detected."]), ""])
    (stage / "PORTRAIT_INDEX.md").write_text("\n".join(rows))


def write_usage(stage, data):
    rows = [
        "# Portrait usage frequency", "",
        "Counts are static references in each source module. Explicit authored NPC and Pip mood attributes are counted "
        "separately from positional or dynamic references. The latter include declarations and candidate pools. "
        "Counts are neither runtime telemetry nor a proof of reachability. A zero explicit count can still have runtime uses.", "",
        "| Module | Mood | NPC assignments | Pip assignments | Positional or dynamic references |",
        "| --- | --- | ---: | ---: | ---: |",
    ]
    for module, moods in sorted(data["usage"].items()):
        for mood, counts in sorted(moods.items()):
            rows.append(f"| {module} | {mood} | {counts.get('mood', 0)} | {counts.get('playerMood', 0)} | {counts.get('positional or dynamic reference', 0)} |")
    rows.extend(["", "## Renderer fallback candidates", "", *[f"- {', '.join(group)}" for group in data["expressionFamilies"]], "",
        "See the portrait index for asset-only entries and per-character defaults. These rules do not imply equal selection frequency.", ""])
    (stage / "PORTRAIT_USAGE.md").write_text("\n".join(rows))


if __name__ == "__main__":
    main()
