# Mockup — Pasarela de Pagos (copia de conveniencia)

**Canónico:** `e-commerce-docs/docs/mockups/pasarela-pagos/`.

Esta es una **copia de conveniencia** para comparar 1:1 el mockup contra
la implementación (`src/pages/checkout/CheckoutPage.jsx` y
`src/pages/checkout/PaymentSelectionPage.jsx`). Vive junto al código que
lo consume.

Ante cualquier discrepancia entre esta copia y la de `docs`, **manda la
de `docs`**. Si el mockup cambia, actualizar primero el canónico en
`e-commerce-docs` y re-sincronizar esta copia en el mismo cambio (evitar
drift entre las dos ubicaciones).

Sincronizado desde el canónico: 2026-07-07T00:32:52 (P-2-bis).

## Contenido

| Archivo | Qué es |
|---|---|
| `pasarela-de-pagos.dc.html` | El mockup. Stepper de 5 pasos: Bolsa · Contacto · Envío · Pago · Revisar. Carga `./support.js` e `./image-slot.js` por ruta relativa. |
| `support.js` | Runtime del canvas de diseño (referenciado por el HTML). |
| `image-slot.js` | Componente de slots de imagen del canvas (referenciado por el HTML). |

Para verlo: abrir `pasarela-de-pagos.dc.html` en un navegador (los dos
`.js` deben estar en el mismo directorio).
