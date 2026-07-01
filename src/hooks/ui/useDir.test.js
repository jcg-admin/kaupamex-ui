/**
 * useDir — resuelve dirección (ltr/rtl) desde el estilo computado.
 */
import { render } from '@testing-library/react';
import { useRef } from 'react';
import useDir from './useDir';

function Probe({ initial }) {
  const ref = useRef(null);
  const dir = useDir(ref, initial, []);
  return <div ref={ref} dir="rtl" data-testid="out">{String(dir)}</div>;
}

describe('useDir', () => {
  it('respeta el valor inicial si viene dado (no recalcula)', () => {
    const { getByTestId } = render(<Probe initial="ltr" />);
    expect(getByTestId('out')).toHaveTextContent('ltr');
  });

  it('resuelve la dirección del nodo cuando no hay inicial', () => {
    // jsdom no mapea el atributo dir a getComputedStyle().direction (devuelve
    // ''), así que se stubea para simular un contexto RTL real del navegador.
    const spy = jest.spyOn(window, 'getComputedStyle')
      .mockReturnValue({ direction: 'rtl' });
    const { getByTestId } = render(<Probe />);
    expect(getByTestId('out')).toHaveTextContent('rtl');
    spy.mockRestore();
  });
});
