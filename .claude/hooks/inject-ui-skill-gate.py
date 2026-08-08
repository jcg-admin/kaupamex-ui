#!/usr/bin/env python3
"""Gate PreToolUse — recuerda invocar los skills de UI antes de escribir.

Mismo patron que ``api: .claude/hooks/inject-drf-skill-gate.py`` (ver
``api: .claude/rules/drf-skill-gate.md``): comportamiento automatico = hook,
no memoria.

Existe porque el 2026-08-07 se movieron dos reglas siempre-cargadas a skills
on-demand (``ui-adaptacion-nativa``, ``ui-interfaz-en-implementacion``). Un
skill registrado pero nunca invocado es deuda, no capacidad — es exactamente
lo que ``flow-selection-agile.md`` prohibe. Sin este gate, la migracion habria
apagado dos reglas vivas.

Surfacing NO bloqueante: sale 0 SIEMPRE. Es un *gate* por dispararse en el
momento de la accion, no por bloquear — el hook es stateless y no puede saber
si el skill ya se invoco en la sesion.
"""
import json
import sys

# Rutas cuyo cambio produce una superficie visible → doc de interfaz + E2E.
SUPERFICIE_VISIBLE = ('src/pages/', 'src/components/', 'src/layouts/')

# Rutas donde se porta desde la referencia (/-progress, ui-core).
PORTE_NATIVO = ('src/components/', 'src/lib/', 'src/hooks/')


def main() -> None:
    try:
        payload = json.load(sys.stdin)
    except Exception:
        print('{}')
        return

    ruta = (payload.get('tool_input') or {}).get('file_path') or ''
    if not ruta:
        print('{}')
        return

    # Normalizar: el file_path puede venir absoluto.
    norm = ruta.replace('\\', '/')
    idx = norm.find('kaupamex-ui/')
    if idx != -1:
        norm = norm[idx + len('kaupamex-ui/'):]

    if not norm.endswith(('.js', '.jsx', '.ts', '.tsx')):
        print('{}')
        return

    skills = []
    if norm.startswith(PORTE_NATIVO):
        skills.append(
            '`ui-adaptacion-nativa` — los `@progress/kno-*` y `ui-core` son '
            'REFERENCIA para adaptar, NUNCA dependencia de runtime (DEC-03). '
            'Leer `.d.ts` (contrato) + `.mjs` (comportamiento) y reimplementar '
            'nativo con atribucion por archivo.'
        )
    if norm.startswith(SUPERFICIE_VISIBLE) and not norm.endswith(
        ('.test.js', '.test.jsx', '.spec.js', '.spec.jsx')
    ):
        skills.append(
            '`ui-interfaz-en-implementacion` — si el cambio agrega o modifica '
            'superficie visible, el DoD del MISMO pase incluye '
            '`interfaz-<slug>.rst` (mockup ASCII + spec + estados) y un E2E '
            'Playwright con screenshot curado. No se difiere.'
        )

    if not skills:
        print('{}')
        return

    texto = (
        'GATE de UI — antes de escribir `{}`, invocar:\n\n{}\n\n'
        'Invariantes que siguen vigentes sin skill: zero lazy imports '
        '(`npm run check:lazy`), canon `codigo_error` (`npm run check:canon`), '
        'Node v22 antes de `npm ci`/`npm test`.'
    ).format(norm, '\n'.join('- ' + s for s in skills))

    print(json.dumps({
        'hookSpecificOutput': {
            'hookEventName': 'PreToolUse',
            'additionalContext': texto,
        }
    }))


if __name__ == '__main__':
    try:
        main()
    except Exception:
        # El hook NUNCA rompe el flujo.
        print('{}')
    sys.exit(0)
