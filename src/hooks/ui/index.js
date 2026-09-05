/**
 * Hooks de UI — Kaupamex UI
 *
 * Hooks de comportamiento de interfaz (no de dominio): posicionamiento de
 * flotantes, bloqueo de scroll, deteccion de click-outside, atajos de
 * teclado. Portados/adaptados de template-ecommerce-ui.
 */
export { default as useClickOutside } from './useClickOutside';
export { default as useEscapeKey } from './useEscapeKey';
export { default as useFloating } from './useFloating';
export { default as useFocusTrap } from './useFocusTrap';
export { default as useMergedRef } from './useMergedRef';
export { default as useDir } from './useDir';
export { default as useSortableList, arrayMove } from './useSortableList';
export { default as useKeyboardShortcut } from './useKeyboardShortcut';
export { default as useScrollLock } from './useScrollLock';
