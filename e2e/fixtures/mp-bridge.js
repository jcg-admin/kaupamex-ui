/**
 * Fixture — puente de egress a MercadoPago para el navegador (Nivel B in-container)
 *
 * PROBLEMA: Chromium dentro del contenedor efímero de Claude Code NO tiene
 * egress HTTPS externo (verificado: example.com -> ERR_CONNECTION_RESET, con y
 * sin el proxy del agente). Node SÍ alcanza MP a través del proxy sancionado
 * (HTTPS_PROXY). El proxy del agente no tunela TLS de navegador encadenado
 * (proxy-chain / shim -> ERR_CONNECTION_CLOSED), así que un `--proxy-server`
 * apuntando al agente no sirve para el navegador.
 *
 * SOLUCIÓN (el "puente"): `context.route(/mercadopago\.com/)` intercepta TODAS
 * las peticiones a `*.mercadopago.com` desde el navegador real y las RELAYA por
 * Node usando `https-proxy-agent` sobre `HTTPS_PROXY` (Node sí tiene egress).
 * Así MP.js real corre en Chromium real y `createCardToken` produce un token
 * real de MP — sin depender del egress del navegador.
 *
 * Requisitos que este puente satisface (aprendidos empíricamente):
 *   1. La página se sirve desde un ORIGEN real (`http://127.0.0.1:PORT`), no
 *      `about:blank`, para que MP.js tenga un origen CORS válido.
 *   2. Se añade `access-control-allow-origin` (eco del Origin del request) a las
 *      respuestas relayadas.
 *   3. Se responde el preflight `OPTIONS` (204 + headers CORS).
 *   4. Se quitan headers hop-by-hop (`content-encoding/length`, etc.) para que
 *      el navegador no intente re-descomprimir un cuerpo ya decodificado.
 *
 * ── USO ──────────────────────────────────────────────────────────────────────
 * Opt-in por `E2E_MP_BRIDGE=1` (+ `HTTPS_PROXY` en el entorno). Si el flag no
 * está, el fixture es NO-OP y `mpBridge.enabled === false` (los specs que lo
 * usan siguen su camino normal: navegador con egress directo en WSL/CI).
 *
 *   import { test, expect } from './fixtures/mp-bridge.js';
 *   test('...', async ({ browser, mpBridge }) => {
 *     const context = await browser.newContext();
 *     await mpBridge.install(context);            // no-op si !enabled
 *     const page = await context.newPage();
 *     await page.goto(mpBridge.origin ?? '/');    // origen real si enabled
 *     await page.addScriptTag({ url: 'https://sdk.mercadopago.com/js/v2' });
 *     // ... createCardToken corre en navegador real, egress vía el puente ...
 *   });
 *
 * El `origin` del puente es un servidor http local mínimo (página en blanco);
 * cuando el spec necesita la SPA real (WSL/CI con egress), deja el flag apagado
 * y usa el `baseURL` de Playwright como siempre.
 */

import http from 'node:http';
import https from 'node:https';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { test as base, expect } from '@playwright/test';

const MP_HOST_RE = /^https:\/\/[a-z0-9.-]*mercadopago\.com\//i;
const HOP_BY_HOP = new Set([
  'content-encoding', 'content-length', 'transfer-encoding', 'connection',
]);

// Relaya una petición del navegador por Node a través de HTTPS_PROXY.
// El agente HTTPS-proxy tunela el CONNECT + TLS que el navegador no puede.
function relayThroughProxy(agent, { method, url, headers, body }) {
  return new Promise((resolve, reject) => {
    const h = { ...headers };
    // El navegador puso su propio host/length/encoding; Node los recalcula.
    delete h.host;
    delete h['content-length'];
    delete h['accept-encoding'];
    const req = https.request(url, { method, headers: h, agent }, (res) => {
      const chunks = [];
      res.on('data', (d) => chunks.push(d));
      res.on('end', () => resolve({
        status: res.statusCode,
        headers: res.headers,
        body: Buffer.concat(chunks),
      }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

// Instala el route de intercepción sobre un BrowserContext dado.
function installRoute(context, agent) {
  return context.route(MP_HOST_RE, async (route) => {
    const request = route.request();
    const origin = request.headers()['origin'] || '*';

    // Preflight CORS: responder localmente, no relayar.
    if (request.method() === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: {
          'access-control-allow-origin': origin,
          'access-control-allow-methods': 'GET,POST,OPTIONS',
          'access-control-allow-headers':
            request.headers()['access-control-request-headers'] || '*',
        },
      });
      return;
    }

    try {
      const relayed = await relayThroughProxy(agent, {
        method: request.method(),
        url: request.url(),
        headers: request.headers(),
        body: request.postData(),
      });
      const out = {};
      for (const [k, v] of Object.entries(relayed.headers)) {
        if (HOP_BY_HOP.has(k.toLowerCase())) continue;
        out[k] = Array.isArray(v) ? v.join(', ') : v;
      }
      out['access-control-allow-origin'] = origin;
      await route.fulfill({ status: relayed.status, headers: out, body: relayed.body });
    } catch {
      await route.abort();
    }
  });
}

export const test = base.extend({
  // Fixture test-scoped. Levanta (si está habilitado) un origen http local y
  // expone `install(context)` para registrar el route de relay.
  mpBridge: async ({}, use) => {
    const enabled = process.env.E2E_MP_BRIDGE === '1';
    const proxy = process.env.HTTPS_PROXY || process.env.https_proxy || '';

    if (!enabled) {
      // NO-OP: en WSL/CI el navegador tiene egress directo.
      await use({ enabled: false, origin: null, install: async () => {} });
      return;
    }
    if (!proxy) {
      throw new Error('E2E_MP_BRIDGE=1 pero HTTPS_PROXY no está definido; ' +
        'el puente relaya por ese proxy.');
    }

    const agent = new HttpsProxyAgent(proxy);
    const server = http.createServer((_req, res) => {
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end('<!doctype html><html><head><title>mp-bridge</title></head>' +
              '<body>mp-bridge origin</body></html>');
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address();
    const origin = `http://127.0.0.1:${port}`;

    await use({
      enabled: true,
      origin,
      install: (context) => installRoute(context, agent),
    });

    await new Promise((resolve) => server.close(resolve));
  },
});

export { expect };
