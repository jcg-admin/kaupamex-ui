/**
 * Tests — MpCardForm
 * Tests the CardForm component with a mocked useMpCardForm hook.
 */
import { render, screen, fireEvent } from '@testing-library/react';

let mockStatus = 'ready';
let mockError  = null;
let mockSubmit;

jest.mock('@hooks/useMpCardForm', () => ({
  useMpCardForm: jest.fn(({ onPayment }) => {
    mockSubmit = () => onPayment({
      token: 'tok-test',
      payment_method_id: 'master',
      issuerId: '100',
      installments: 3,
      payer: { email: 'u@test.com', identification: { type: 'CPF', number: '999' } },
    });
    return { status: mockStatus, error: mockError, submit: mockSubmit };
  }),
}));

import MpCardForm from './MpCardForm';

afterEach(() => {
  jest.clearAllMocks();
  mockStatus = 'ready';
  mockError  = null;
});

describe('MpCardForm', () => {
  it('renders all iframe placeholders', () => {
    render(<MpCardForm amount="199.00" onPayment={jest.fn()} />);
    expect(document.getElementById('mp-card-number')).toBeInTheDocument();
    expect(document.getElementById('mp-expiration-date')).toBeInTheDocument();
    expect(document.getElementById('mp-security-code')).toBeInTheDocument();
    expect(document.getElementById('mp-cardholder-name')).toBeInTheDocument();
    expect(document.getElementById('mp-cardholder-email')).toBeInTheDocument();
    expect(document.getElementById('mp-issuer')).toBeInTheDocument();
  });

  it('no pide documento (MX); installments existe pero oculto (1 cuota)', () => {
    render(<MpCardForm amount="100.00" onPayment={jest.fn()} />);
    // MX no requiere identificación del pagador para tarjeta.
    expect(document.getElementById('mp-id-type')).not.toBeInTheDocument();
    expect(document.getElementById('mp-id-number')).not.toBeInTheDocument();
    // installments SÍ está en el DOM: MP.js lo exige para completar el montaje
    // (sin él onFormMounted nunca dispara — H-PP-07), pero vive oculto porque
    // no ofrecemos meses sin intereses.
    const installments = document.getElementById('mp-installments');
    expect(installments).toBeInTheDocument();
    expect(installments.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('muestra boton habilitado cuando status=ready', () => {
    render(<MpCardForm amount="100.00" onPayment={jest.fn()} />);
    const btn = screen.getByRole('button', { name: /Pagar con tarjeta/i });
    expect(btn).not.toBeDisabled();
  });

  it('deshabilita el boton cuando status=loading', () => {
    mockStatus = 'loading';
    render(<MpCardForm amount="100.00" onPayment={jest.fn()} />);
    const btn = screen.getByRole('button', { name: /Procesando/i });
    expect(btn).toBeDisabled();
  });

  it('usa el término universal "Código de seguridad" y no "CVV"', () => {
    render(<MpCardForm amount="100.00" onPayment={jest.fn()} />);
    expect(screen.getByText(/Código de seguridad/i)).toBeInTheDocument();
    expect(screen.queryByText(/^CVV$/)).not.toBeInTheDocument();
  });

  it('muestra el monto en el botón de pago (confirmación secundaria)', () => {
    render(<MpCardForm amount="199.00" onPayment={jest.fn()} />);
    expect(
      screen.getByRole('button', { name: /Pagar con tarjeta.*199/i }),
    ).toBeInTheDocument();
  });

  it('muestra la nota de pago cifrado (refuerzo de seguridad)', () => {
    render(<MpCardForm amount="100.00" onPayment={jest.fn()} />);
    expect(screen.getByText(/Pago cifrado con MercadoPago/i)).toBeInTheDocument();
  });

  it('muestra error cuando el hook reporta error', () => {
    mockError = 'Error al cargar MP.js';
    render(<MpCardForm amount="100.00" onPayment={jest.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Error al cargar MP.js');
  });

  it('llama a onPayment con los datos al hacer submit', () => {
    const onPayment = jest.fn();
    render(<MpCardForm amount="100.00" onPayment={onPayment} />);
    fireEvent.click(screen.getByRole('button', { name: /Pagar con tarjeta/i }));
    expect(onPayment).toHaveBeenCalledWith(expect.objectContaining({
      token: 'tok-test',
      payment_method_id: 'master',
    }));
  });

  it('llama a onCancel al hacer click en Cancelar', () => {
    const onCancel = jest.fn();
    render(<MpCardForm amount="100.00" onPayment={jest.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('no muestra boton Cancelar si onCancel no se pasa', () => {
    render(<MpCardForm amount="100.00" onPayment={jest.fn()} />);
    expect(screen.queryByRole('button', { name: /Cancelar/i })).not.toBeInTheDocument();
  });
});
