/**
 * Tests — NonCardPaymentForm
 * UC-PAY-13: pago con OXXO, SPEI, Paycash, cajeros, Cuenta Mercado Pago.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import NonCardPaymentForm from './NonCardPaymentForm';

const defaultProps = {
  methodId:    'oxxo',
  orderNumber: 'ORD-001',
  onSubmit:    jest.fn(),
  onCancel:    jest.fn(),
};

afterEach(() => jest.clearAllMocks());

describe('NonCardPaymentForm', () => {
  it('renders method label and description for OXXO', () => {
    render(<NonCardPaymentForm {...defaultProps} />);
    expect(screen.getByText('OXXO')).toBeInTheDocument();
    expect(screen.getByText(/tienda OXXO/i)).toBeInTheDocument();
    expect(screen.getByTestId('non-card-payment-form')).toBeInTheDocument();
  });

  it('renders email input', () => {
    render(<NonCardPaymentForm {...defaultProps} />);
    const input = screen.getByTestId('payer-email-input');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('placeholder', 'tu@email.com');
  });

  it('pre-fills email from defaultEmail prop', () => {
    render(<NonCardPaymentForm {...defaultProps} defaultEmail="pre@test.com" />);
    expect(screen.getByTestId('payer-email-input')).toHaveValue('pre@test.com');
  });

  it('shows validation error on empty email submit', () => {
    render(<NonCardPaymentForm {...defaultProps} />);
    fireEvent.click(screen.getByTestId('non-card-submit-btn'));
    expect(screen.getByTestId('email-error')).toBeInTheDocument();
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('shows validation error with invalid email format', () => {
    render(<NonCardPaymentForm {...defaultProps} />);
    fireEvent.change(screen.getByTestId('payer-email-input'), { target: { value: 'not-an-email' } });
    fireEvent.click(screen.getByTestId('non-card-submit-btn'));
    expect(screen.getByTestId('email-error')).toBeInTheDocument();
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('clears error and calls onSubmit with valid email', () => {
    render(<NonCardPaymentForm {...defaultProps} />);
    fireEvent.change(screen.getByTestId('payer-email-input'), { target: { value: 'user@test.com' } });
    fireEvent.click(screen.getByTestId('non-card-submit-btn'));
    expect(screen.queryByTestId('email-error')).not.toBeInTheDocument();
    expect(defaultProps.onSubmit).toHaveBeenCalledWith({
      order_number:      'ORD-001',
      payment_method_id: 'oxxo',
      payer_email:       'user@test.com',
    });
  });

  it('calls onCancel when cancel button clicked', () => {
    render(<NonCardPaymentForm {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /Cambiar método/i }));
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('shows Procesando text when isSubmitting=true', () => {
    render(<NonCardPaymentForm {...defaultProps} isSubmitting />);
    expect(screen.getByTestId('non-card-submit-btn')).toHaveTextContent('Procesando…');
  });

  it('disables both buttons when isSubmitting=true', () => {
    render(<NonCardPaymentForm {...defaultProps} isSubmitting />);
    expect(screen.getByTestId('non-card-submit-btn')).toBeDisabled();
    expect(screen.getByRole('button', { name: /Cambiar método/i })).toBeDisabled();
  });

  it('disables email input when isSubmitting=true', () => {
    render(<NonCardPaymentForm {...defaultProps} isSubmitting />);
    expect(screen.getByTestId('payer-email-input')).toBeDisabled();
  });

  it('renders Transferencia SPEI for clabe method', () => {
    render(<NonCardPaymentForm {...defaultProps} methodId="clabe" />);
    expect(screen.getByText('Transferencia SPEI')).toBeInTheDocument();
    expect(screen.getByText(/CLABE/i)).toBeInTheDocument();
  });

  it('renders Paycash correctly', () => {
    render(<NonCardPaymentForm {...defaultProps} methodId="paycash" />);
    expect(screen.getByText('Paycash')).toBeInTheDocument();
  });

  it('renders account_money (Cuenta Mercado Pago)', () => {
    render(<NonCardPaymentForm {...defaultProps} methodId="account_money" />);
    expect(screen.getByText('Cuenta Mercado Pago')).toBeInTheDocument();
    expect(screen.getByText(/inmediatamente/i)).toBeInTheDocument();
  });

  it('renders unknown methodId without crashing', () => {
    render(<NonCardPaymentForm {...defaultProps} methodId="unknown_xyz" />);
    expect(screen.getByText('unknown_xyz')).toBeInTheDocument();
    expect(screen.getByTestId('non-card-payment-form')).toBeInTheDocument();
  });

  it('submit button shows method name', () => {
    render(<NonCardPaymentForm {...defaultProps} methodId="oxxo" />);
    expect(screen.getByTestId('non-card-submit-btn')).toHaveTextContent(/Pagar con OXXO/i);
  });

  it('error message has role=alert for accessibility', () => {
    render(<NonCardPaymentForm {...defaultProps} />);
    fireEvent.click(screen.getByTestId('non-card-submit-btn'));
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
