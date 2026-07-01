/**
 * StatusTimeline — historial de transiciones (UC-ADM-04).
 */
import { render, screen } from '@testing-library/react';
import StatusTimeline from './index';

const LOGS = [
  { id: 1, previous_status: 'PENDING', new_status: 'PAID', changed_by_username: 'ana', created_at: '2026-07-01' },
  { id: 2, previous_status: 'PAID', new_status: 'SHIPPED', notes: 'guía 123', changed_by_username: null, created_at: '2026-07-02' },
];

describe('StatusTimeline', () => {
  it('no renderiza nada sin logs', () => {
    const { container } = render(<StatusTimeline logs={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('muestra las transiciones, notas y autor (Sistema si null)', () => {
    render(<StatusTimeline logs={LOGS} />);
    expect(screen.getByText(/PENDING/)).toBeInTheDocument();
    expect(screen.getByText(/SHIPPED/)).toBeInTheDocument();
    expect(screen.getByText(/guía 123/)).toBeInTheDocument();
    expect(screen.getByText(/Sistema/)).toBeInTheDocument(); // changed_by_username null
  });

  it('ordena el más reciente primero', () => {
    render(<StatusTimeline logs={LOGS} />);
    const items = screen.getAllByRole('listitem');
    // LOGS invertido: el último (PAID→SHIPPED) va primero.
    expect(items[0]).toHaveTextContent('SHIPPED');
    expect(items[1]).toHaveTextContent('PAID');
  });

  it('aplica formatDate al timestamp', () => {
    render(<StatusTimeline logs={[LOGS[0]]} formatDate={() => '1 jul 2026'} />);
    expect(screen.getByText(/1 jul 2026/)).toBeInTheDocument();
  });
});
