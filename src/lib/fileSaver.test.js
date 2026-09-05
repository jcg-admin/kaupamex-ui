/**
 * Tests — fileSaver.js (Kaupamex UI)
 *
 * jsdom no implementa URL.createObjectURL/revokeObjectURL ni dispara
 * descargas reales; se mockean. Se asserta el cableado: objectURL creado,
 * ancla con download+href, click disparado, objectURL revocado.
 */
import { saveAs, downloadFromBlob } from './fileSaver';

describe('fileSaver', () => {
  let createObjectURL;
  let revokeObjectURL;
  let clickSpy;
  let appendSpy;
  let removeSpy;

  beforeEach(() => {
    jest.useFakeTimers();
    createObjectURL = jest.fn(() => 'blob:mock-url');
    revokeObjectURL = jest.fn();
    // jsdom no define estas APIs; las inyectamos.
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;

    clickSpy = jest
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});
    appendSpy = jest.spyOn(document.body, 'appendChild');
    removeSpy = jest.spyOn(document.body, 'removeChild');
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('saveAs', () => {
    it('crea un objectURL, dispara el click y revoca el url', () => {
      const blob = new Blob(['hola'], { type: 'text/plain' });
      saveAs(blob, 'saludo.txt');

      expect(createObjectURL).toHaveBeenCalledWith(blob);
      expect(clickSpy).toHaveBeenCalledTimes(1);

      // El ancla se agregó con download y href correctos.
      const anchor = appendSpy.mock.calls[0][0];
      expect(anchor.tagName).toBe('A');
      expect(anchor.getAttribute('download')).toBe('saludo.txt');
      expect(anchor.href).toContain('blob:mock-url');

      // El ancla se removió del DOM tras el click.
      expect(removeSpy).toHaveBeenCalledWith(anchor);

      // El objectURL se revoca en el siguiente tick.
      jest.runOnlyPendingTimers();
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('usa "download" como nombre por defecto', () => {
      saveAs(new Blob(['x']));
      const anchor = appendSpy.mock.calls[0][0];
      expect(anchor.getAttribute('download')).toBe('download');
    });

    it('lanza TypeError si el primer argumento no es Blob', () => {
      expect(() => saveAs('no-soy-blob', 'f.txt')).toThrow(TypeError);
    });
  });

  describe('downloadFromBlob', () => {
    it('construye un Blob y delega en saveAs', () => {
      downloadFromBlob('a,b,c\n1,2,3', 'datos.csv', 'text/csv');
      expect(createObjectURL).toHaveBeenCalledTimes(1);
      const blob = createObjectURL.mock.calls[0][0];
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('text/csv');
      expect(clickSpy).toHaveBeenCalledTimes(1);
    });

    it('acepta un array de partes', () => {
      downloadFromBlob(['parte1', 'parte2'], 'multi.txt');
      const blob = createObjectURL.mock.calls[0][0];
      expect(blob).toBeInstanceOf(Blob);
    });
  });
});
