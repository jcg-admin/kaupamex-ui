/**
 * RichTextEditor — PracticaYoruba UI (adaptación nativa)
 *
 * Editor WYSIWYG mínimo para campos de texto enriquecido (p.ej. "Descripción
 * completa" del producto). Adaptado NATIVO tomando como referencia la
 * arquitectura de `/-progress/kno-react-editor` (toolbar + área editable +
 * sanitizado), SIN instalar el paquete: la premisa del proyecto es portación
 * nativa (ver `.claude/rules/adaptacion-componentes-nativa.md`).
 *
 * - Toolbar de formato básico (negrita, cursiva, listas) con el primitivo
 *   `Button`.
 * - Área `contentEditable` que emite HTML **sanitizado** con `@lib/sanitize`
 *   (misma política XSS que usa el storefront al renderizar la descripción con
 *   `dangerouslySetInnerHTML`). Defensa en profundidad: se sanitiza al editar
 *   y el storefront vuelve a sanitizar al mostrar.
 * - Contrato de valor tipo input controlado: `value` (HTML string) + `onChange`
 *   (recibe el HTML sanitizado). Emite `''` cuando el contenido queda vacío.
 */
import { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { sanitizeHtml } from '@lib/sanitize';
import { Button } from '@components/common/primitives';
import Toolbar from '@components/common/Toolbar/Toolbar';
import styles from './RichTextEditor.module.scss';

// Toolbar tipográfica (convención universal B/I + etiquetas cortas). Se evita
// depender de iconos nuevos; las letras B/I son texto semántico, no glifos
// decorativos.
const TOOLS = [
  { cmd: 'bold', label: 'Negrita', text: 'B', cls: 'ttBold' },
  { cmd: 'italic', label: 'Cursiva', text: 'I', cls: 'ttItalic' },
  { cmd: 'insertUnorderedList', label: 'Lista con viñetas', text: 'Viñetas' },
  { cmd: 'insertOrderedList', label: 'Lista numerada', text: 'Números' },
  { cmd: 'removeFormat', label: 'Quitar formato', text: 'Limpiar' },
];

/** HTML "vacío" (sin texto visible) se normaliza a cadena vacía. */
function normalize(html) {
  const clean = sanitizeHtml(html || '');
  const text = clean.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  return text.length ? clean : '';
}

const RichTextEditor = forwardRef(function RichTextEditor(
  { value = '', onChange, id, name, className = '', placeholder = '', ariaProps = {} },
  ref,
) {
  const editorRef = useRef(null);
  // null (no ''): fuerza el primer sync en el montaje para pintar el valor
  // inicial; después sólo re-sincroniza si el `value` externo difiere de lo
  // último que emitimos (evita reposicionar el cursor al escribir).
  const lastEmitted = useRef(null);

  useEffect(() => {
    const el = editorRef.current;
    if (el && value !== lastEmitted.current && value !== el.innerHTML) {
      el.innerHTML = sanitizeHtml(value || '');
      lastEmitted.current = value;
    }
  }, [value]);

  // Exponer .focus() para que el form pueda enfocar el campo inválido (H-06).
  useImperativeHandle(ref, () => ({
    focus: () => editorRef.current?.focus(),
  }), []);

  const emit = useCallback(() => {
    const html = normalize(editorRef.current?.innerHTML ?? '');
    lastEmitted.current = html;
    onChange?.(html);
  }, [onChange]);

  const runCommand = useCallback((cmd) => {
    editorRef.current?.focus();
    // execCommand es la vía nativa universal para formato básico en
    // contentEditable; deprecado pero soportado en todos los navegadores.
    // jsdom no lo implementa: guardamos para no romper en tests.
    if (typeof document.execCommand === 'function') {
      document.execCommand(cmd, false, null);
    }
    emit();
  }, [emit]);

  return (
    <div className={`${styles.wrap} ${className}`}>
      <Toolbar className={styles.toolbar} ariaLabel="Formato de texto">
        {TOOLS.map((t) => (
          <Button
            key={t.cmd}
            type="button"
            variant="ghost"
            size="sm"
            aria-label={t.label}
            title={t.label}
            className={t.cls ? styles[t.cls] : undefined}
            // preventDefault en mousedown conserva la selección del editor.
            onMouseDown={(e) => { e.preventDefault(); runCommand(t.cmd); }}
          >
            {t.text}
          </Button>
        ))}
      </Toolbar>
      <div
        ref={editorRef}
        id={id}
        role="textbox"
        aria-multiline="true"
        contentEditable
        suppressContentEditableWarning
        data-name={name}
        data-placeholder={placeholder}
        className={styles.editor}
        onInput={emit}
        onBlur={emit}
        {...ariaProps}
      />
    </div>
  );
});

export default RichTextEditor;
