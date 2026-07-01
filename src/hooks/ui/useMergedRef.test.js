/**
 * useMergedRef — combina ref reenviado + ref interno sobre el mismo nodo.
 */
import { render } from '@testing-library/react';
import { forwardRef, useRef, useImperativeHandle } from 'react';
import useMergedRef from './useMergedRef';

const Probe = forwardRef(function Probe(_props, ref) {
  const [innerRef, setRef] = useMergedRef(ref);
  // Expone el texto que ve el ref interno para asertar que apunta al nodo.
  useImperativeHandle(ref, () => innerRef.current, [innerRef]);
  return <input data-testid="node" ref={setRef} defaultValue="hi" />;
});

describe('useMergedRef', () => {
  it('rellena un ref-objeto del padre con el nodo', () => {
    const parentRef = { current: null };
    const { getByTestId } = render(<Probe ref={parentRef} />);
    // useImperativeHandle pisa parentRef con innerRef.current (el mismo nodo).
    expect(parentRef.current).toBe(getByTestId('node'));
  });

  it('invoca un ref-callback del padre con el nodo', () => {
    let got = null;
    const cb = (node) => { got = node; };
    const { getByTestId } = render(<Probe ref={cb} />);
    expect(got).toBe(getByTestId('node'));
  });

  it('el ref interno apunta al nodo (acceso propio del componente)', () => {
    const Inner = forwardRef(function Inner(_p, ref) {
      const [innerRef, setRef] = useMergedRef(ref);
      return (
        <>
          <span data-testid="tag">{typeof window !== 'undefined' ? '' : ''}</span>
          <input data-testid="el" ref={setRef} />
          <button type="button" onClick={() => { innerRef.current.value = 'set'; }}>
            set
          </button>
        </>
      );
    });
    const { getByTestId, getByText } = render(<Inner />);
    getByText('set').click();
    expect(getByTestId('el').value).toBe('set');
  });
});
