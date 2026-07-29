/**
 * useBusEvents / useBusListener — lectura del bus de eventos (T-078, DEC-AF-06).
 *
 * El bus **avisa**; el endpoint de estado sigue siendo la verdad (H-API-71).
 * Un oyente reacciona al evento disparando su refetch, no tomando el evento
 * como estado. Así se gana latencia sin cambiar quién es autoritativo: si un
 * evento se pierde, la consulta de estado sigue devolviendo la verdad.
 *
 * Un solo sondeo para todos los oyentes: la clave de React Query es fija, así
 * que N componentes que llamen a `useBusListener` comparten una sola petición.
 */

import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';

import apiService from '@services/apiService';

const POLL_URL = '/api/v2/bus/poll/';
export const BUS_QUERY_KEY = ['bus', 'poll'];

/**
 * Cadencia del único sondeo que queda. Sustituye a los tres ad-hoc que había
 * (60 s de la campana, 6 s del estado OXXO/SPEI, 5 s del retorno de pago), así
 * que se elige entre medias: más ágil que la campana, más barato que los de
 * pago, y con la consulta de estado detrás como red.
 */
export const BUS_POLL_MS = 10_000;

// Cursor compartido: el servidor devuelve el id del último mensaje entregado y
// el siguiente sondeo parte de ahí. Vive fuera del hook porque el sondeo es uno
// solo para toda la aplicación.
let cursor = 0;

/** Reinicia el cursor. Sólo para tests — en runtime avanza monótonamente. */
export function __resetBusCursor() {
  cursor = 0;
}

/**
 * Sondea el bus y devuelve los eventos del último ciclo.
 *
 * @param {{enabled?: boolean, intervalMs?: number}} opciones
 */
export function useBusEvents({ enabled = true, intervalMs = BUS_POLL_MS } = {}) {
  const query = useQuery({
    queryKey: BUS_QUERY_KEY,
    queryFn: async ({ signal }) => {
      const { data } = await apiService.get(`${POLL_URL}?last=${cursor}`, { signal });
      // El servidor conserva el cursor cuando no hubo nada, así que avanzar con
      // su `last` es seguro incluso en ciclos vacíos.
      cursor = data?.last ?? cursor;
      return {
        last: cursor,
        events: Array.isArray(data?.notifications) ? data.notifications : [],
      };
    },
    enabled,
    refetchInterval: enabled ? intervalMs : false,
    // Un evento perdido no se recupera reintentando la misma petición; el
    // siguiente ciclo lo trae, y la consulta de estado es la red de todos modos.
    retry: false,
  });

  return {
    last: query.data?.last ?? 0,
    events: query.data?.events ?? [],
    isLoading: query.isLoading,
  };
}

/**
 * Ejecuta `handler` por cada evento nuevo del tipo indicado.
 *
 * Cada oyente recuerda qué ids ya entregó, de modo que un re-render no vuelve a
 * dispararlo: el evento es una señal de una sola vez.
 *
 * @param {string} type tipo emitido por el backend (`notificacion`, `pago.estado`)
 * @param {(payload: object) => void} handler
 * @param {{enabled?: boolean, intervalMs?: number}} opciones
 */
export function useBusListener(type, handler, opciones = {}) {
  const { last, events, isLoading } = useBusEvents(opciones);
  const entregados = useRef(new Set());
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    events.forEach((evento) => {
      if (evento?.message?.type !== type) return;
      if (entregados.current.has(evento.id)) return;
      entregados.current.add(evento.id);
      handlerRef.current(evento.message.payload ?? {});
    });
  }, [events, type]);

  return { last, isLoading };
}

export default useBusListener;
