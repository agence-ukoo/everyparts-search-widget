#!/usr/bin/env node
//
// dump-i18n.mjs — exporte le dictionnaire I18N du moteur en JSON.
//
//   node tools/dump-i18n.mjs [source] [sortie]
//
// Le hub a besoin des textes PAR DÉFAUT du moteur pour deux choses : proposer à
// l'édition les clés qui existent réellement, et ne servir au navigateur que ce
// qui diffère de ces défauts (sans quoi chaque boutique retéléchargerait tout le
// dictionnaire à chaque page). Les lui faire recopier à la main en ferait une
// deuxième source de vérité, qui dériverait en silence.
//
// `I18N` est un const à l'intérieur de l'IIFE : le fichier n'exporte rien et
// n'est pas requérable. On découpe donc le littéral en comptant les accolades,
// puis on l'évalue dans un contexte vide (node:vm) — le bloc est de la donnée
// pure, aucune fonction ni référence extérieure.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = process.argv[2] ?? resolve(ROOT, 'everyparts-widget.js');
const out = process.argv[3] ?? resolve(ROOT, 'everyparts-widget.i18n.json');

const code = readFileSync(src, 'utf8');

const start = code.indexOf('const I18N = {');
if (start === -1) throw new Error(`déclaration « const I18N = { » introuvable dans ${src}`);

// Comptage d'accolades en tenant compte des chaînes et des commentaires : un
// « } » dans un texte traduit ou dans un commentaire ne ferme rien.
const open = code.indexOf('{', start);
let depth = 0, i = open, end = -1;
let quote = null, comment = null;
for (; i < code.length; i++) {
  const c = code[i], next = code[i + 1];
  if (comment === 'line') { if (c === '\n') comment = null; continue; }
  if (comment === 'block') { if (c === '*' && next === '/') { comment = null; i++; } continue; }
  if (quote) {
    if (c === '\\') { i++; continue; }
    if (c === quote) quote = null;
    continue;
  }
  if (c === '/' && next === '/') { comment = 'line'; i++; continue; }
  if (c === '/' && next === '*') { comment = 'block'; i++; continue; }
  if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
  if (c === '{') depth++;
  else if (c === '}' && --depth === 0) { end = i; break; }
}
if (end === -1) throw new Error('littéral I18N non refermé — la source est-elle valide ?');

const literal = code.slice(open, end + 1);
const dict = vm.runInNewContext(`(${literal})`, Object.create(null), { timeout: 2000 });

const locales = Object.keys(dict);
if (locales.length === 0) throw new Error('dictionnaire I18N vide.');

writeFileSync(out, JSON.stringify(dict, null, 2) + '\n');
console.log(`✓ ${out} — ${locales.length} locales, ${Object.keys(dict[locales[0]]).length} clés`);
