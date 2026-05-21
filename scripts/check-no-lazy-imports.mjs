#!/usr/bin/env node
/**
 * check-no-lazy-imports — gate de zero-tolerance para imports lazy en ui.
 *
 * Equivalente JS de api/scripts/check_no_lazy_imports.py.
 *
 * Detecta:
 *   1. require('...') dentro de funciones / metodos / callbacks.
 *   2. import('...') dinamico dentro de funciones EXCLUYENDO el
 *      patron canonico de React code splitting:
 *        const X = lazy(() => import('./Y'));
 *
 * Uso:
 *
 *   # Modo CI: audita src/ entero.
 *   node scripts/check-no-lazy-imports.mjs
 *
 *   # Modo pre-commit: valida archivos especificos (.js/.jsx/.ts/.tsx).
 *   node scripts/check-no-lazy-imports.mjs src/foo.jsx src/bar.js
 *
 * Exit codes:
 *   0 — limpio.
 *   1 — 1+ lazy detectados.
 *   2 — error de parseo.
 *
 * Implementacion: usa @babel/parser que ya esta en devDependencies
 * para los tests de Jest. Si no esta disponible, falla loud con
 * mensaje claro.
 *
 * Refs: iniciativa eliminar-lazy-imports-ui en docs.
 *       .claude/rules/no-lazy-imports.md regla del proyecto.
 */
import { readFileSync, statSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { argv, exit, stderr, stdout } from 'node:process';

let parser;
try {
  parser = await import('@babel/parser');
} catch (err) {
  stderr.write(
    'ERROR: no se pudo cargar @babel/parser. ' +
    'Instalalo con: npm install --save-dev @babel/parser\n',
  );
  exit(2);
}

const EXTS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);
const SCAN_ROOTS = ['src', '__mocks__'];
const SCAN_FILES = ['jest.setup.js', 'jest.config.cjs'];

/** Recolecta archivos a auditar. */
async function collectFiles(args) {
  if (args.length > 0) {
    return args.filter((a) => EXTS.has(extname(a)));
  }
  const out = [];
  async function walk(dir) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name === 'node_modules' || e.name === 'dist' || e.name === 'build') continue;
        await walk(full);
      } else if (EXTS.has(extname(e.name))) {
        out.push(full);
      }
    }
  }
  for (const root of SCAN_ROOTS) {
    await walk(root);
  }
  // Top-level config files que pueden tener requires.
  for (const f of SCAN_FILES) {
    try {
      statSync(f);
      out.push(f);
    } catch {
      // missing — skip silently.
    }
  }
  return out;
}

/** True si el nodo es una llamada a `lazy(...)` (top-level pattern). */
function isReactLazyCall(node) {
  if (!node || node.type !== 'CallExpression') return false;
  const c = node.callee;
  if (c.type === 'Identifier' && c.name === 'lazy') return true;
  if (
    c.type === 'MemberExpression'
    && c.object.type === 'Identifier'
    && c.object.name === 'React'
    && c.property.type === 'Identifier'
    && c.property.name === 'lazy'
  ) return true;
  return false;
}

/** Analiza un archivo y retorna las violaciones. */
function findViolations(src, filePath) {
  let ast;
  try {
    ast = parser.parse(src, {
      sourceType: 'unambiguous',
      plugins: ['jsx', 'typescript'],
      errorRecovery: true,
    });
  } catch (e) {
    return { error: e.message };
  }

  const violations = [];

  // Walker manual: profundidad-primero llevando flag de "estoy dentro de funcion".
  function walk(node, inFunction, inReactLazy) {
    if (!node || typeof node !== 'object') return;

    // Funciones / metodos -> entrar con flag.
    const isFn = (
      node.type === 'FunctionDeclaration'
      || node.type === 'FunctionExpression'
      || node.type === 'ArrowFunctionExpression'
      || node.type === 'ObjectMethod'
      || node.type === 'ClassMethod'
    );

    // import('...') call.
    if (node.type === 'CallExpression' && node.callee?.type === 'Import') {
      if (inFunction && !inReactLazy) {
        violations.push({
          line: node.loc?.start?.line ?? 0,
          col: node.loc?.start?.column ?? 0,
          stmt: "import('...') dentro de funcion",
        });
      }
    }

    // require('...') call.
    if (
      node.type === 'CallExpression'
      && node.callee?.type === 'Identifier'
      && node.callee.name === 'require'
    ) {
      if (inFunction) {
        violations.push({
          line: node.loc?.start?.line ?? 0,
          col: node.loc?.start?.column ?? 0,
          stmt: "require('...') dentro de funcion",
        });
      }
    }

    // Recurse en hijos.
    const nextInFunction = inFunction || isFn;
    // Si este nodo es lazy(...), su primer argumento es la flecha;
    // dentro de esa flecha, los import() son LEGITIMOS.
    const childIsReactLazy = isReactLazyCall(node);
    for (const key of Object.keys(node)) {
      if (key === 'loc' || key === 'start' || key === 'end') continue;
      const child = node[key];
      if (Array.isArray(child)) {
        for (const item of child) {
          walk(item, nextInFunction, inReactLazy || childIsReactLazy);
        }
      } else if (child && typeof child === 'object' && child.type) {
        walk(child, nextInFunction, inReactLazy || childIsReactLazy);
      }
    }
  }
  walk(ast, false, false);
  return { violations };
}

async function main() {
  const args = argv.slice(2).filter((a) => !a.startsWith('--'));
  const files = await collectFiles(args);
  if (files.length === 0) return 0;

  const findings = [];
  let parseErrors = 0;

  for (const filePath of files) {
    let src;
    try {
      src = readFileSync(filePath, 'utf8');
    } catch {
      continue;
    }
    const r = findViolations(src, filePath);
    if (r.error) {
      stderr.write(`  PARSE_ERROR ${filePath}: ${r.error}\n`);
      parseErrors += 1;
      continue;
    }
    for (const v of r.violations) {
      findings.push({ filePath, ...v });
    }
  }

  if (findings.length > 0) {
    stderr.write('LAZY IMPORTS DETECTED:\n\n');
    for (const f of findings) {
      stderr.write(`  ${f.filePath}:${f.line}: ${f.stmt}\n`);
    }
    stderr.write(`\n  Total: ${findings.length} lazy import(s).\n\n`);
    stderr.write('Lazy imports estan PROHIBIDOS en e-comerce-ui/src/**.\n');
    stderr.write('Excepcion: React.lazy(() => import("./Component")) a top-level.\n');
    stderr.write('Ver iniciativa\n');
    stderr.write('  docs/source/gestion/pm/ui/iniciativas/eliminar-lazy-imports-ui/\n');
    stderr.write('para razonamiento y excepciones.\n');
    return 1;
  }

  if (parseErrors > 0) {
    stderr.write(`  ${parseErrors} archivo(s) con error de parseo.\n`);
    return 2;
  }

  return 0;
}

const code = await main();
exit(code);
