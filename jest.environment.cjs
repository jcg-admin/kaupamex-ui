/**
 * Custom Jest environment — extends jsdom with Node.js fetch globals.
 *
 * MSW v2's @mswjs/interceptors references `Request` at module-load time.
 * Jest/jsdom runs in a VM context that doesn't inherit Node 18+ globals
 * (Request, Response, Headers, fetch). Copying them from the outer Node.js
 * process into this.global makes them available when msw/node is required
 * in jest.setup.js.
 */
const { TestEnvironment } = require('jest-environment-jsdom');

class JsdomWithFetchEnv extends TestEnvironment {
  async setup() {
    await super.setup();
    ['fetch', 'Request', 'Response', 'Headers', 'FormData', 'ReadableStream',
      'WritableStream', 'TransformStream', 'TextEncoder', 'TextDecoder',
      'BroadcastChannel', 'MessageChannel', 'MessageEvent',
    ].forEach((key) => {
      if (key in globalThis && !(key in this.global)) {
        Object.defineProperty(this.global, key, {
          writable: true,
          configurable: true,
          value: globalThis[key],
        });
      }
    });
  }
}

module.exports = JsdomWithFetchEnv;
