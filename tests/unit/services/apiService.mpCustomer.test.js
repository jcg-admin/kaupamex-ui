/**
 * Tests — getMpCustomer (apiService)
 * Verifica que GET /api/v2/payments/customer/ se llama correctamente.
 */
import apiService, { getMpCustomer } from '../../../src/services/apiService';

afterEach(() => jest.restoreAllMocks());

describe('getMpCustomer', () => {
  it('llama GET /api/v2/payments/customer/', async () => {
    jest.spyOn(apiService, 'get').mockResolvedValue({
      data: { has_customer: false, mp_customer_id: '' },
      status: 200,
    });
    await getMpCustomer();
    expect(apiService.get).toHaveBeenCalledWith('/api/v2/payments/customer/');
  });

  it('retorna has_customer=true cuando existe el customer', async () => {
    jest.spyOn(apiService, 'get').mockResolvedValue({
      data: { has_customer: true, mp_customer_id: 'TEST-CUST-123' },
      status: 200,
    });
    const result = await getMpCustomer();
    expect(result.data.has_customer).toBe(true);
    expect(result.data.mp_customer_id).toBe('TEST-CUST-123');
  });

  it('retorna has_customer=false cuando no existe el customer', async () => {
    jest.spyOn(apiService, 'get').mockResolvedValue({
      data: { has_customer: false, mp_customer_id: '' },
      status: 200,
    });
    const result = await getMpCustomer();
    expect(result.data.has_customer).toBe(false);
    expect(result.data.mp_customer_id).toBe('');
  });

  it('propaga error del backend', async () => {
    jest.spyOn(apiService, 'get').mockRejectedValue(new Error('Network error'));
    await expect(getMpCustomer()).rejects.toThrow('Network error');
  });
});
