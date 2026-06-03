/**
 * Tests: Popover — extiende Tooltip (ui-core popover.js)
 * Iniciativa: implementar-componentes-diferidos-ui-core
 */
import { render, screen, fireEvent } from '@testing-library/react';
import Popover from './Popover';

describe('Popover', () => {
  it('no muestra el panel por defecto', () => {
    render(<Popover content="Cuerpo"><button>Trigger</button></Popover>);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('trigger=click abre el panel al hacer click (default de ui-core)', () => {
    render(<Popover content="Contenido"><button>Abrir</button></Popover>);
    fireEvent.click(screen.getByText('Abrir').closest('span'));
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(screen.getByText('Contenido')).toBeInTheDocument();
  });

  it('segundo click cierra el panel (toggle)', () => {
    render(<Popover content="Info"><button>Toggle</button></Popover>);
    const wrapper = screen.getByText('Toggle').closest('span');
    fireEvent.click(wrapper);
    fireEvent.click(wrapper);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('muestra header (popover-header) cuando se pasa title', () => {
    render(<Popover content="Cuerpo" title="Título"><button>T</button></Popover>);
    fireEvent.click(screen.getByText('T').closest('span'));
    expect(screen.getByText('Título')).toBeInTheDocument();
    expect(screen.getByText('Cuerpo')).toBeInTheDocument();
  });

  it('sin title no renderiza header (equivale a _isWithContent)', () => {
    render(<Popover content="Solo cuerpo"><button>T</button></Popover>);
    fireEvent.click(screen.getByText('T').closest('span'));
    expect(screen.queryByText('Título')).not.toBeInTheDocument();
  });

  it('content como función se resuelve al abrir', () => {
    const contentFn = () => 'Contenido dinámico';
    render(<Popover content={contentFn}><button>T</button></Popover>);
    fireEvent.click(screen.getByText('T').closest('span'));
    expect(screen.getByText('Contenido dinámico')).toBeInTheDocument();
  });

  it('Escape cierra el panel', () => {
    render(<Popover content="Info"><button>T</button></Popover>);
    fireEvent.click(screen.getByText('T').closest('span'));
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('trigger=hover abre con mouseenter', () => {
    render(<Popover content="Info" trigger="hover"><button>T</button></Popover>);
    fireEvent.mouseEnter(screen.getByText('T').closest('span'));
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });
});
