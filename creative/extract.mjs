import {readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {relative, resolve} from 'node:path';
import {parse} from 'acorn';
import {dialoguePortraitInventory} from '../src/dialogue.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(process.argv[2]);
const inventory = dialoguePortraitInventory();
const paths = readdirSync(resolve(root, 'src')).filter(name => name.endsWith('.mjs')).sort();
const moodNames = new Set([...inventory.catalogue.map(entry => entry.mood).filter(Boolean),
  ...Object.values(inventory.pipReactions).flat(), 'exasperated']);
const usage = {};
const text = [
  '# Dialogue export',
  '',
  'Generated from game source. Each module is grouped by source declaration. “Candidate text” includes speech, player choices, directions and player-facing notices. Literal strings are decoded as shown in game. Templates show their source expressions. Use the accompanying source excerpts for speaker order, explicit portrait moods, conditions, random selection, actions and state changes. Unlabelled literals in positional arrays follow the order defined by the module’s construction helpers.',
  '',
  'Ambient, scripted, minigame and portrait dialogue share this inventory. A string appearing once in source can be reused at several points in play. The export is a source inventory, rather than a recording of every possible playthrough.',
  ''
];

function traverse(node, visit, parent = null, container = null) {
  if (!node?.type) return;
  visit(node, parent, container);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(child => traverse(child, visit, node, parent));
    else if (value?.type) traverse(value, visit, node, parent);
  }
}

const human = value => typeof value === 'string' && /\p{L}/u.test(value)
  && (/\s/u.test(value.trim()) || /[.!?…]$/u.test(value) || /^(Continue|Yes|No|Moo|Milky)[.!]?$/i.test(value))
  && !/^(\.\.?\/|https?:\/\/|#[\da-f]{3,8}$)/i.test(value);
const keyOf = node => node.key?.name ?? node.key?.value;
const inline = value => JSON.stringify(value).replaceAll('<', '\\u003c').replaceAll('>', '\\u003e');
let sequences = 0;
let lines = 0;

for (const file of paths) {
  const path = 'src/' + file;
  const source = readFileSync(resolve(root, path), 'utf8');
  const ast = parse(source, {ecmaVersion: 'latest', sourceType: 'module', locations: true});
  const headings = [];
  for (const entry of ast.body) {
    if (entry.type === 'ImportDeclaration') continue;
    const declaration = entry.declaration ?? entry;
    const candidates = [];
    traverse(declaration, (node, parent, container) => {
      const authored = node.type === 'Literal' && moodNames.has(node.value);
      if (authored) {
        const kind = parent?.type === 'Property' && ['mood', 'playerMood'].includes(keyOf(parent))
          ? keyOf(parent) : 'positional or dynamic reference';
        const moods = usage[file] ??= {};
        const count = moods[node.value] ??= {};
        count[kind] = (count[kind] ?? 0) + 1;
      }
      const value = node.type === 'Literal' ? node.value
        : node.type === 'TemplateLiteral' ? source.slice(node.start + 1, node.end - 1) : null;
      const key = parent?.value === node ? keyOf(parent) : null;
      if (!human(value) && !(typeof value === 'string' && ['text', 'label', 'direction', 'message'].includes(key))) return;
      const call = parent?.type === 'CallExpression' ? parent.callee.name : null;
      const role = {text: 'Line', label: 'Choice', direction: 'Direction', message: 'Notice'}[key]
        ?? (parent?.arguments?.[0] === node ? {reply: 'Choice', pip: 'Pip', brie: 'Brie', recommendLin: 'Brie', lin: 'Lin', say: 'Line',
          mystic: 'Milk Mystic', elias: 'Elias', guard: 'Guard', professor: 'Professor', baron: 'Milk Baron'}[call] : null)
        ?? (call === 'choice' && parent.arguments[['brie-curd-dialogue.mjs', 'lin-brie-referral.mjs'].includes(file) ? 0 : 1] === node ? 'Choice' : null)
        ?? 'Candidate text';
      const metadata = ['text', 'label'].includes(key) && container?.type === 'ObjectExpression'
        ? container.properties.filter(property => ['speaker', 'character', 'mood', 'once', 'enterAction', 'action'].includes(keyOf(property)))
          .map(property => `${keyOf(property)}=${source.slice(property.value.start, property.value.end)}`)
        : [];
      candidates.push(`- **${role}**, L${node.loc.start.line} · ${inline(value)}${metadata.length ? ' · \`' + metadata.join(' / ') + '\`' : ''}`);
    });
    if (!candidates.length) continue;
    sequences++;
    lines += candidates.length;
    const heading = declaration.id?.name ?? declaration.declarations?.map(item => item.id.name).filter(Boolean).join(', ') ?? declaration.type;
    headings.push(`### ${heading || declaration.type} · L${entry.loc.start.line}`, '', ...candidates, '',
      '<details><summary>Source, conditions, portrait assignments and effects</summary>', '', '```js',
      source.slice(entry.start, entry.end), '```', '', '</details>', '');
  }
  if (headings.length) text.push(`## ${file.replace(/\.mjs$/, '').replaceAll('-', ' ')}`, '', `Source: ${path}`, '', ...headings);
}

writeFileSync(resolve(output, 'DIALOGUE_EXPORT.md'), text.join('\n') + '\n');
writeFileSync(resolve(output, 'inventory.json'), JSON.stringify({
  ...inventory,
  catalogue: inventory.catalogue.map(({asset, ...entry}) => ({...entry, asset: relative(root, fileURLToPath(asset))})),
  usage, sequences, lines
}, null, 2) + '\n');
