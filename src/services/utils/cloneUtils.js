/**
 * cloneData — clona en profundidad los datos mock antes de entregarlos, para
 * que los consumidores no muten la fixture compartida.
 *
 * Usa `structuredClone` nativo (Node 22 / navegadores modernos) en vez del
 * anti-patrón `JSON.parse(JSON.stringify(...))`, que pierde Date/undefined/Map,
 * y rompe con referencias cíclicas.
 */
export const cloneData = (data) => structuredClone(data);
