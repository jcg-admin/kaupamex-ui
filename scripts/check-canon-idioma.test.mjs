#!/usr/bin/env node
/**
 * check-canon-idioma.test.mjs — pruebas unitarias del gate UI.
 *
 * Origen: T-003 de iniciativa canon-idioma-enums-error-codes.
 *
 * Usa node:test (stdlib, Node 18+). NO requiere Jest ni deps
 * externas. El test invoca el script via child_process y verifica
 * exit code + stdout.
 *
 * Casos:
 *   1. CLEAN — archivo con identifiers EN no genera violacion.
 *   2. VIOLATION — archivo con literal ES dispara exit 1.
 *   3. ALLOWLIST inline — comentario "// canon-idioma:" exime.
 *   4. ALLOWLIST modulo — entry en allowlist.txt salta el archivo.
 *   5. --soft — violacion + soft retorna exit 0.
 *
 * Ejecucion:
 *
 *   cd ui
 *   node --test scripts/check-canon-idioma.test.mjs
 */

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SCRIPT = resolve(__dirname, 'check-canon-idioma.mjs');

let tmpRoot;
let allowlistPath;

before(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), 'canon-idioma-test-'));
  // Estructura: <tmpRoot>/src/demo/
  mkdirSync(join(tmpRoot, 'src', 'demo'), { recursive: true });
  // Allowlist vacio.
  allowlistPath = join(tmpRoot, 'allowlist.txt');
  writeFileSync(allowlistPath, '', 'utf-8');
});

after(() => {
  rmSync(tmpRoot, { recursive: true, force: true });
});

function runScript(file, extraArgs = []) {
  // Invoca el script con cwd=tmpRoot para que SCAN_ROOTS=src
  // funcione.
  const result = spawnSync(
    process.execPath,
    [SCRIPT, '--allowlist', allowlistPath, ...extraArgs, ...(file ? [file] : [])],
    { cwd: tmpRoot, encoding: 'utf-8' },
  );
  return result;
}

test('CLEAN: archivo con identifiers EN -> exit 0', () => {
  const file = join('src', 'demo', 'clean.js');
  writeFileSync(join(tmpRoot, file), `
    const STATUS = 'PENDING_REVIEW';
    const MESSAGE = 'Pendiente de revision';  // texto user-facing en ES, NO dispara
    if (status === 'APPROVED') doSomething();
  `, 'utf-8');
  const r = runScript(file);
  assert.equal(r.status, 0, `stdout=${r.stdout}\nstderr=${r.stderr}`);
  assert.match(r.stdout, /OK/);
});

test('VIOLATION: literal ES dispara exit 1', () => {
  const file = join('src', 'demo', 'violation.js');
  writeFileSync(join(tmpRoot, file), `
    const REASONS = ['CONTEO_FISICO', 'MERMA', 'ROBO'];
    const ERROR = 'VARIANTE_REQUERIDA';
  `, 'utf-8');
  const r = runScript(file);
  assert.equal(r.status, 1, `stdout=${r.stdout}\nstderr=${r.stderr}`);
  assert.match(r.stdout, /CONTEO_FISICO/);
  assert.match(r.stdout, /MERMA/);
  assert.match(r.stdout, /VARIANTE_REQUERIDA/);
});

test('ALLOWLIST inline: comentario canon-idioma exime el match', () => {
  const file = join('src', 'demo', 'allowed-inline.js');
  writeFileSync(join(tmpRoot, file), `
    // canon-idioma: legacy data en BD, migracion T-709
    const REASONS = ['CONTEO_FISICO'];

    // canon-idioma: migracion pendiente T-103
    const ERROR = 'VARIANTE_REQUERIDA';
  `, 'utf-8');
  const r = runScript(file);
  assert.equal(r.status, 0, `stdout=${r.stdout}\nstderr=${r.stderr}`);
  assert.match(r.stdout, /OK/);
});

test('ALLOWLIST modulo: entry en allowlist.txt salta archivo', () => {
  const file = join('src', 'demo', 'in-allowlist.js');
  writeFileSync(join(tmpRoot, file), `
    const ERROR = 'VARIANTE_REQUERIDA';
  `, 'utf-8');
  // Anade el path al allowlist.
  writeFileSync(allowlistPath, 'src/demo/in-allowlist.js\n', 'utf-8');
  const r = runScript(file);
  assert.equal(r.status, 0, `stdout=${r.stdout}\nstderr=${r.stderr}`);
  assert.match(r.stderr, /saltados por allowlist/);
  // Limpia allowlist para no afectar otros tests.
  writeFileSync(allowlistPath, '', 'utf-8');
});

test('--soft: violacion + soft retorna exit 0', () => {
  const file = join('src', 'demo', 'soft.js');
  writeFileSync(join(tmpRoot, file), `
    const ERROR = 'VARIANTE_REQUERIDA';
  `, 'utf-8');
  const r = runScript(file, ['--soft']);
  assert.equal(r.status, 0, `stdout=${r.stdout}\nstderr=${r.stderr}`);
  assert.match(r.stdout, /VARIANTE_REQUERIDA/);
});
