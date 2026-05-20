#!/usr/bin/env node
// Compiles every SCSS entry (main + *.module.scss) to surface undefined
// mixins/variables that Jest can't catch because it mocks CSS Modules.
// Mirrors webpack's resolution of the `@styles` alias so the check runs
// without spinning up a full webpack build.
//
// Also enforces the canonical abstracts import form
// `@use '@styles/abstracts' as *;` in src/pages, src/components and
// src/layouts. Relative paths or split imports are rejected so the
// project keeps a single way to reach tokens and mixins.

import { compile } from 'sass';
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(repoRoot, 'src');
const stylesDir = join(srcDir, 'styles');

const ALIAS = { '@styles': stylesDir };

const stylesAliasImporter = {
  findFileUrl(url) {
    for (const [prefix, target] of Object.entries(ALIAS)) {
      if (url === prefix || url.startsWith(`${prefix}/`)) {
        const rest = url.slice(prefix.length).replace(/^\//, '');
        return pathToFileURL(join(target, rest));
      }
    }
    return null;
  },
};

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) walk(full, out);
    else if (/\.scss$/.test(entry) && !entry.startsWith('_')) out.push(full);
  }
  return out;
}

const files = walk(srcDir);
let failed = 0;

const IMPORT_SCOPE = [
  join(srcDir, 'pages'),
  join(srcDir, 'components'),
  join(srcDir, 'layouts'),
];
const BAD_IMPORT_PATTERNS = [
  { re: /@use\s+['"](?:\.\.\/)+styles\/abstracts['"]/, why: 'relative path; use @use \'@styles/abstracts\' as *;' },
  { re: /@use\s+['"]@styles\/abstracts\/(?:variables|mixins)['"]/, why: 'split import; use @use \'@styles/abstracts\' as *; (the barrel re-exports both)' },
];

function checkImports(file) {
  if (!IMPORT_SCOPE.some((dir) => file.startsWith(dir + '/'))) return;
  if (!file.endsWith('.module.scss')) return;
  const src = readFileSync(file, 'utf8');
  const lines = src.split('\n');
  lines.forEach((line, i) => {
    for (const { re, why } of BAD_IMPORT_PATTERNS) {
      if (re.test(line)) {
        failed++;
        console.error(`\n\x1b[31m✗\x1b[0m ${relative(repoRoot, file)}:${i + 1}`);
        console.error(`  ${line.trim()}`);
        console.error(`  -> ${why}`);
      }
    }
  });
}

for (const file of files) {
  checkImports(file);
}

for (const file of files) {
  try {
    compile(file, {
      importers: [stylesAliasImporter],
      loadPaths: [srcDir, stylesDir],
      quietDeps: true,
      silenceDeprecations: [
        'legacy-js-api', 'import', 'global-builtin', 'slash-div', 'if-function',
      ],
    });
  } catch (err) {
    failed++;
    const rel = relative(repoRoot, file);
    console.error(`\n\x1b[31m✗\x1b[0m ${rel}`);
    console.error(err.sassMessage || err.message);
    if (err.span) {
      const { start, url } = err.span;
      const where = url ? relative(repoRoot, fileURLToPath(url)) : rel;
      console.error(`  at ${where}:${start.line + 1}:${start.column + 1}`);
    }
  }
}

if (failed > 0) {
  console.error(`\n\x1b[31m${failed} SCSS issue(s) detected (compile or import-style).\x1b[0m`);
  process.exit(1);
}
console.log(`\x1b[32m✓\x1b[0m ${files.length} SCSS entries compiled clean; imports canonical.`);
