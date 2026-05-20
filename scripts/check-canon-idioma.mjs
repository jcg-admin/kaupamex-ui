#!/usr/bin/env node
/**
 * check-canon-idioma — gate del canon de idioma en identifiers
 * tecnicos del UI (JS/JSX/TS/TSX).
 *
 * Equivalente JS de docs/scripts/check_canon_idioma.py.
 *
 * Origen: T-003 de iniciativa canon-idioma-enums-error-codes.
 *
 * Detecta string literals ES en posiciones de identifier
 * tecnico:
 *
 * 1. Comparaciones de status: `if (status === 'PENDIENTE_REVISION')`.
 * 2. Payloads de thunks: `apiService.post(url, { reason: 'MERMA' })`.
 * 3. Mock interceptor shape: `return { status: 'APROBADA' }`.
 * 4. Filtros: `?status=APROBADA`.
 * 5. Constants files: `export const STATUS = { APROBADA: '...' }`.
 *
 * Heuristica isEsLiteral (solo dispara sobre strings UPPER_SNAKE_CASE
 * para evitar falsos positivos en JSX text, labels, mensajes):
 *
 * - Caracteres acentuados (a, e, i, o, u, n).
 * - Sufijos ES tipicos: _NO_PERMITIDO, _REQUERIDA, _INVALIDO,
 *   _AGOTADO, _ENCONTRADA, _VENCIDO, _EXPIRADO, _DUPLICADO, etc.
 * - Prefijos/palabras ES del dominio: CARRITO, ORDEN, ENVIO,
 *   PEDIDO, CONTRASENA, VARIANTE, MOTIVO, USUARIO, MERMA,
 *   CONTEO, ROBO, DEVOLUCION, RESENA, COMPRADOR, ENTREGA,
 *   REEMBOLSO, DIRECCION, CATEGORIA, CICLO, JERARQUIA, PRECIO,
 *   DESCUENTO, CUPON, ZONA, LIMITE, FORMATO_CSV, ARCHIVO,
 *   ENCABEZADO, DESCONTINUADO, PENDIENTE, APROBADA, RECHAZADA,
 *   RECIBIDA, REEMBOLSADA, COMPLETADA, PAGADA, ENVIADA,
 *   ENTREGADA, CANCELADA, BUENAS_CONDICIONES, DANADO, INCOMPLETO.
 *
 * Allowlist:
 *
 *   - Inline: `// canon-idioma: <razon>` en la linea inmediatamente
 *     anterior al match exime ese literal.
 *   - Por modulo: archivo ui/scripts/canon-idioma-allowlist.txt
 *     con paths relativos al repo root.
 *
 * Uso:
 *
 *   # Sobre todo src/ + __mocks__/:
 *   node scripts/check-canon-idioma.mjs
 *
 *   # Solo archivos especificos:
 *   node scripts/check-canon-idioma.mjs src/redux/slices/returnsSlice.js
 *
 *   # Modo soft (reporta pero exit 0):
 *   node scripts/check-canon-idioma.mjs --soft
 *
 * Exit codes:
 *   0 — limpio o --soft.
 *   1 — 1+ violaciones detectadas.
 *   2 — error de parseo o de carga de @babel/parser.
 *
 * Refs: canon-idioma-enums-error-codes, DEC-DOC-006 v2,
 *       convencion-nombres-codigo v1.0.0.
 */

import { readFileSync, statSync, existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join, extname, relative, resolve } from 'node:path';
import { argv, exit, stderr, stdout, cwd } from 'node:process';

let parser;
try {
  parser = await import('@babel/parser');
} catch {
  stderr.write(
    'ERROR: no se pudo cargar @babel/parser. ' +
    'Instalalo con: npm install --save-dev @babel/parser\n',
  );
  exit(2);
}

// ---------------------------------------------------------------------------
// Heuristica de deteccion ES
// ---------------------------------------------------------------------------

const ACCENTED_RE = /[áéíóúÁÉÍÓÚñÑ]/;
const IDENTIFIER_RE = /^[A-Z][A-Z0-9_]*$/;

const ES_SUFFIXES = [
  '_NO_PERMITIDO', '_NO_PERMITIDA',
  '_REQUERIDA', '_REQUERIDO',
  '_INVALIDO', '_INVALIDA',
  '_AGOTADO', '_AGOTADA',
  '_ENCONTRADA', '_ENCONTRADO',
  '_NO_DISPONIBLE',
  '_VENCIDO', '_VENCIDA',
  '_EXPIRADO', '_EXPIRADA',
  '_YA_PROCESADO', '_YA_PROCESADA',
  '_YA_UTILIZADO', '_YA_UTILIZADA',
  '_NO_MODIFICABLE', '_NO_EDITABLE',
  '_NO_AUTORIZADO', '_NO_AUTORIZADA',
  '_NO_SOPORTADO', '_NO_SOPORTADA',
  '_NO_ENCONTRADO', '_NO_ENCONTRADA',
  '_YA_REGISTRADA', '_YA_REGISTRADO',
  '_NO_VIGENTE',
  '_SIN_STOCK',
  '_DUPLICADO', '_DUPLICADA',
];

const ES_PREFIXES = [
  'CARRITO', 'ORDEN', 'ENVIO', 'PEDIDO',
  'CONTRASENA', 'CONTRASE',
  'VARIANTE', 'MOTIVO', 'RAZON', 'USUARIO',
  'MERMA', 'CONTEO', 'ROBO', 'DEVOLUCION',
  'RESENA', 'COMPRADOR', 'ENTREGA', 'REEMBOLSO',
  'DIRECCION', 'CATEGORIA', 'CICLO', 'JERARQUIA',
  'PRECIO', 'DESCUENTO', 'CUPON', 'ZONA', 'LIMITE',
  'FORMATO_CSV', 'ARCHIVO', 'ENCABEZADO',
  'DESCONTINUADO',
  'PENDIENTE', 'APROBADA', 'APROBADO',
  'RECHAZADA', 'RECHAZADO',
  'RECIBIDA', 'RECIBIDO',
  'REEMBOLSADA', 'REEMBOLSADO',
  'COMPLETADA', 'COMPLETADO',
  'DESACTIVADO', 'DESACTIVADA',
  'PAGADA', 'PAGADO',
  'ENVIADA', 'ENVIADO',
  'ENTREGADA', 'ENTREGADO',
  'CANCELADA', 'CANCELADO',
  'BUENAS_CONDICIONES', 'DANADO', 'INCOMPLETO',
];

function isEsLiteral(value) {
  if (typeof value !== 'string' || !value) return [false, ''];
  if (!IDENTIFIER_RE.test(value)) return [false, ''];
  if (ACCENTED_RE.test(value)) return [true, 'caracter acentuado'];
  for (const suffix of ES_SUFFIXES) {
    if (value.endsWith(suffix)) return [true, `sufijo ES tipico: ${suffix}`];
  }
  for (const prefix of ES_PREFIXES) {
    if (value === prefix || value.startsWith(prefix + '_')) {
      return [true, `prefijo/palabra ES tipico: ${prefix}`];
    }
  }
  return [false, ''];
}

// ---------------------------------------------------------------------------
// AST walker (recursivo simple)
// ---------------------------------------------------------------------------

const SKIP_KEYS = new Set([
  'loc', 'range', 'start', 'end',
  'leadingComments', 'trailingComments', 'innerComments',
  'extra', 'comments', 'tokens', 'errors',
]);

function walkAst(node, visitor) {
  if (!node || typeof node !== 'object') return;
  visitor(node);
  for (const key of Object.keys(node)) {
    if (SKIP_KEYS.has(key)) continue;
    const value = node[key];
    if (Array.isArray(value)) {
      for (const item of value) walkAst(item, visitor);
    } else if (value && typeof value === 'object' && typeof value.type === 'string') {
      walkAst(value, visitor);
    }
  }
}

// ---------------------------------------------------------------------------
// Check de un archivo
// ---------------------------------------------------------------------------

function findViolations(src, filePath) {
  let ast;
  try {
    ast = parser.parse(src, {
      sourceType: 'unambiguous',
      plugins: ['jsx', 'typescript'],
      errorRecovery: true,
    });
  } catch (e) {
    return { error: e.message, violations: [] };
  }

  const lines = src.split('\n');
  const violations = [];

  walkAst(ast, (node) => {
    if (node.type !== 'StringLiteral') return;
    const [isEs, razon] = isEsLiteral(node.value);
    if (!isEs) return;
    const lineno = node.loc?.start?.line;
    if (!lineno) return;
    // Allowlist inline: la linea anterior contiene "canon-idioma:".
    const prev = lines[lineno - 2] || '';
    if (prev.includes('canon-idioma:')) return;
    violations.push({ lineno, value: node.value, razon });
  });

  return { violations };
}

// ---------------------------------------------------------------------------
// Collect files
// ---------------------------------------------------------------------------

const EXTS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);
const SCAN_ROOTS = ['src', '__mocks__'];
const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.next', 'coverage']);

async function collectFiles(args) {
  // CLI args = paths concretos. Ignoramos flags al collectar.
  const positional = args.filter((a) => !a.startsWith('--'));
  if (positional.length > 0) {
    return positional.filter((a) => EXTS.has(extname(a)) && existsSync(a));
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
        if (SKIP_DIRS.has(e.name)) continue;
        await walk(full);
      } else if (EXTS.has(extname(e.name))) {
        out.push(full);
      }
    }
  }
  for (const root of SCAN_ROOTS) {
    await walk(root);
  }
  return out.sort();
}

// ---------------------------------------------------------------------------
// Allowlist por modulo
// ---------------------------------------------------------------------------

const DEFAULT_ALLOWLIST = './scripts/canon-idioma-allowlist.txt';

function loadModuleAllowlist(path) {
  if (!existsSync(path)) return new Set();
  const txt = readFileSync(path, 'utf-8');
  const out = new Set();
  for (const line of txt.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    out.add(t);
  }
  return out;
}

function isInAllowlist(filePath, allowlist) {
  // filePath es relativo al cwd. Cualquier prefijo del allowlist
  // que matchee el inicio del path = skip.
  const normalized = filePath.replace(/\\/g, '/');
  for (const prefix of allowlist) {
    if (normalized.startsWith(prefix)) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const rawArgs = argv.slice(2);
  const soft = rawArgs.includes('--soft');
  const allowlistArgIdx = rawArgs.indexOf('--allowlist');
  const allowlistPath = allowlistArgIdx >= 0
    ? rawArgs[allowlistArgIdx + 1]
    : DEFAULT_ALLOWLIST;
  // Construye cleanArgs sin --soft / --allowlist VALUE.
  const excludeIndexes = new Set();
  rawArgs.forEach((a, i) => {
    if (a === '--soft') excludeIndexes.add(i);
    if (a === '--allowlist') {
      excludeIndexes.add(i);
      excludeIndexes.add(i + 1);
    }
  });
  const cleanArgs = rawArgs.filter((_, i) => !excludeIndexes.has(i));

  const allowlist = loadModuleAllowlist(allowlistPath);
  const files = await collectFiles(cleanArgs);

  if (files.length === 0) {
    stderr.write('check-canon-idioma: 0 archivos para escanear.\n');
    exit(0);
  }

  let totalViolations = 0;
  let skippedFiles = 0;
  let parseErrors = 0;

  for (const filePath of files) {
    if (isInAllowlist(filePath, allowlist)) {
      skippedFiles++;
      continue;
    }
    let src;
    try {
      src = readFileSync(filePath, 'utf-8');
    } catch {
      continue;
    }
    const { error, violations } = findViolations(src, filePath);
    if (error) {
      stderr.write(`check-canon-idioma: parse error ${filePath}: ${error}\n`);
      parseErrors++;
      continue;
    }
    for (const v of violations) {
      stdout.write(`${filePath}:${v.lineno}: literal ES '${v.value}' (${v.razon})\n`);
      totalViolations++;
    }
  }

  if (skippedFiles > 0) {
    stderr.write(`check-canon-idioma: ${skippedFiles} archivos saltados por allowlist.\n`);
  }
  if (parseErrors > 0) {
    stderr.write(`check-canon-idioma: ${parseErrors} parse errors.\n`);
  }

  if (totalViolations === 0) {
    stdout.write('check-canon-idioma: OK — sin violaciones.\n');
    exit(0);
  }

  stderr.write(`check-canon-idioma: ${totalViolations} violaciones detectadas.\n`);
  exit(soft ? 0 : 1);
}

await main();
