// Portado del prototipo funcional -progress/kno-react-common (codigo propio del ejecutor).
// Origen: -progress/kno-react-common/classNames.mjs (util classNames)
/**
 * cx — PracticaYoruba UI
 *
 * Concatena clases condicionalmente (equivalente nativo a la util classNames de
 * kno-react-common / al paquete `classnames`). Acepta strings, números, arrays
 * anidados y objetos `{ clase: booleano }`; ignora todo valor falsy.
 *
 * Evita el anti-patrón `\`${cond && styles.x}\`` — que renderiza el literal
 * "false" en el className cuando `cond` es falso — y unifica el estilo hoy
 * disperso (`filter(Boolean).join(' ')`, ternarios, template literals).
 *
 * Ejemplos:
 *   cx('a', 'b')                       // 'a b'
 *   cx('a', cond && styles.active)     // 'a' si !cond
 *   cx('a', { on: true, off: false })  // 'a on'
 *   cx(['a', 'b'], 'c')                // 'a b c'
 */
export function cx(...args) {
  const out = [];

  const push = (val) => {
    if (!val) return;
    const t = typeof val;
    if (t === 'string' || t === 'number') {
      out.push(String(val));
    } else if (Array.isArray(val)) {
      val.forEach(push);
    } else if (t === 'object') {
      for (const [key, cond] of Object.entries(val)) {
        if (cond) out.push(key);
      }
    }
  };

  args.forEach(push);
  return out.join(' ');
}

export default cx;
