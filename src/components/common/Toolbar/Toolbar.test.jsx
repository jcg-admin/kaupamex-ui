/**
 * Tests — Toolbar
 * Adaptado de @progress/kno-react-buttons (Toolbar) — referencia no runtime.
 * Verifica role=toolbar + roving tabindex (un unico tab stop) y navegacion por
 * flechas/Home/End — el patron WAI-ARIA que cierra H-UI-BTN-01.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import Toolbar from './Toolbar';

function Fixture() {
  return (
    <Toolbar ariaLabel="Formato">
      <button type="button">Bold</button>
      <button type="button">Italic</button>
      <button type="button">Underline</button>
    </Toolbar>
  );
}

describe('Toolbar', () => {
  it('expone role=toolbar con un unico tab stop (roving tabindex)', () => {
    render(<Fixture />);
    expect(screen.getByRole('toolbar', { name: 'Formato' })).toBeInTheDocument();
    const btns = screen.getAllByRole('button');
    expect(btns[0]).toHaveAttribute('tabindex', '0');
    expect(btns[1]).toHaveAttribute('tabindex', '-1');
    expect(btns[2]).toHaveAttribute('tabindex', '-1');
  });

  it('ArrowRight mueve el foco y el tab stop al siguiente control', () => {
    render(<Fixture />);
    const btns = screen.getAllByRole('button');
    btns[0].focus();
    fireEvent.keyDown(screen.getByRole('toolbar'), { key: 'ArrowRight' });
    expect(btns[1]).toHaveFocus();
    expect(btns[1]).toHaveAttribute('tabindex', '0');
    expect(btns[0]).toHaveAttribute('tabindex', '-1');
  });

  it('End va al ultimo y Home al primero', () => {
    render(<Fixture />);
    const btns = screen.getAllByRole('button');
    btns[0].focus();
    fireEvent.keyDown(screen.getByRole('toolbar'), { key: 'End' });
    expect(btns[2]).toHaveFocus();
    fireEvent.keyDown(screen.getByRole('toolbar'), { key: 'Home' });
    expect(btns[0]).toHaveFocus();
  });
});
