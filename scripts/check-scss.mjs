#!/usr/bin/env node
// Compiles every SCSS entry (main + *.module.scss) to surface undefined
// mixins/variables that Jest can't catch because it mocks CSS Modules.
// Mirrors webpack's resolution of the `@styles` alias so the check runs
// without spinning up a full webpack build.

import { compile } from 'sass';
import { readdirSync, statSync } from 'node:fs';
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
  console.error(`\n\x1b[31m${failed} SCSS file(s) failed to compile.\x1b[0m`);
  process.exit(1);
}
console.log(`\x1b[32m✓\x1b[0m ${files.length} SCSS entries compiled clean.`);
