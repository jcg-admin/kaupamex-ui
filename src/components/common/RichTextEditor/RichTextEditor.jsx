/**
 * RichTextEditor — Kaupamex UI (adaptación nativa)
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
  { cmd: 'underline', label: 'Subrayado', text: 'U', cls: 'ttUnderline' },
  { cmd: 'strikeThrough', label: 'Tachado', text: 'S', cls: 'ttStrike' },
  { cmd: 'subscript', label: 'Subíndice', text: 'X₂' },
  { cmd: 'superscript', label: 'Superíndice', text: 'X²' },
  { cmd: 'formatBlock', value: '<h1>', label: 'Título 1', text: 'H1' },
  { cmd: 'formatBlock', value: '<h2>', label: 'Título 2', text: 'H2' },
  { cmd: 'formatBlock', value: '<h3>', label: 'Título 3', text: 'H3' },
  { cmd: 'formatBlock', value: '<blockquote>', label: 'Cita', text: 'Cita' },
  { cmd: 'insertUnorderedList', label: 'Lista con viñetas', text: 'Viñetas' },
  { cmd: 'insertOrderedList', label: 'Lista numerada', text: 'Números' },
  { cmd: 'justifyLeft', styleCss: true, label: 'Alinear a la izquierda', text: 'Izq' },
  { cmd: 'justifyCenter', styleCss: true, label: 'Centrar', text: 'Centro' },
  { cmd: 'justifyRight', styleCss: true, label: 'Alinear a la derecha', text: 'Der' },
  { cmd: 'justifyFull', styleCss: true, label: 'Justificar', text: 'Just' },
  { cmd: 'indent', styleCss: true, label: 'Aumentar sangría', text: 'Sangría +' },
  { cmd: 'outdent', styleCss: true, label: 'Reducir sangría', text: 'Sangría −' },
  { cmd: 'fontName', styleCss: true, prompt: 'Fuente (p. ej. Arial, Georgia):', label: 'Fuente', text: 'Fuente' },
  { cmd: 'fontSize', styleCss: true, prompt: 'Tamaño (1 a 7):', label: 'Tamaño de fuente', text: 'Tamaño' },
  { cmd: 'createLink', prompt: 'URL del enlace (https://…)', label: 'Insertar enlace', text: 'Enlace' },
  { cmd: 'unlink', label: 'Quitar enlace', text: 'Sin enlace' },
  { cmd: 'insertImage', prompt: 'URL de la imagen (https://…)', label: 'Insertar imagen', text: 'Imagen' },
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

  const runCommand = useCallback((tool) => {
    editorRef.current?.focus();
    let arg = tool.value ?? null;
    // Herramientas que requieren una URL (enlace/imagen): se pide al usuario.
    // El HTML resultante pasa por sanitizeHtml en `emit` → normalize, que
    // bloquea `javascript:` y fuerza rel=noopener (ver src/lib/sanitize.js).
    if (tool.prompt) {
      const url = typeof window !== 'undefined' && typeof window.prompt === 'function'
        ? window.prompt(tool.prompt)
        : null;
      if (!url) { emit(); return; }
      arg = url;
    }
    // execCommand es la vía nativa universal para formato en contentEditable;
    // deprecado pero soportado en todos los navegadores. jsdom no lo
    // implementa: guardamos para no romper en tests.
    if (typeof document.execCommand === 'function') {
      // Alineación/sangría/fuente deben emitir `style` (no atributos/tags
      // deprecados) para que el allowlist acotado los conserve. Se activa
      // styleWithCSS sólo alrededor de esos comandos y se restaura después,
      // para no convertir negrita/cursiva en `style` (que se descartaría).
      if (tool.styleCss) document.execCommand('styleWithCSS', false, true);
      document.execCommand(tool.cmd, false, arg);
      if (tool.styleCss) document.execCommand('styleWithCSS', false, false);
    }
    emit();
  }, [emit]);

  return (
    <div className={`${styles.wrap} ${className}`}>
      <Toolbar className={styles.toolbar} ariaLabel="Formato de texto">
        {TOOLS.map((t) => (
          <Button
            key={t.label}
            type="button"
            variant="ghost"
            size="sm"
            aria-label={t.label}
            title={t.label}
            className={t.cls ? styles[t.cls] : undefined}
            // preventDefault en mousedown conserva la selección del editor.
            onMouseDown={(e) => { e.preventDefault(); runCommand(t); }}
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
