import { fetchWithFallback } from './utils/fetchWithFallback';
import { cloneData } from './utils/cloneUtils';
import { recordMockUsage } from './utils/mockUsageTracker';

const DEFAULT_SHOULD_USE_MOCK = () => false;

const validateArguments = ({ id, endpoint, mockDataLoader }) => {
  if (!id) {
    throw new Error('createResilientService requiere un identificador de dominio');
  }

  if (!endpoint) {
    throw new Error(`createResilientService(${id}) requiere un endpoint`);
  }

  if (typeof mockDataLoader !== 'function') {
    throw new Error(`createResilientService(${id}) requiere mockDataLoader`);
  }
};

export const createResilientService = ({
  id,
  endpoint,
  mockDataLoader,
  shouldUseMock = DEFAULT_SHOULD_USE_MOCK,
  errorMessage,
  isPayloadValid,
}) => {
  validateArguments({ id, endpoint, mockDataLoader });

  const fetchFromMock = async () => cloneData(await mockDataLoader());

  const fetchFromApi = async ({ fetchImpl, signal } = {}) => {
    const effectiveFetch = typeof fetchImpl === 'function' ? fetchImpl : typeof fetch === 'function' ? fetch : null;

    if (!effectiveFetch) {
      throw new Error(`createResilientService(${id}) requiere fetchImpl cuando fetch no esta disponible`);
    }

    const response = await effectiveFetch(endpoint, { signal });

    if (!response.ok) {
      throw { status: response.status, statusText: response.statusText };
    }

    const payload = await response.json();

    if (typeof isPayloadValid === 'function' && !isPayloadValid(payload)) {
      throw new Error('payload invalido');
    }

    return payload;
  };

  const fetchData = async ({ fetchImpl, signal } = {}) => {
    const result = await fetchWithFallback({
      url: endpoint,
      fetchImpl,
      signal,
      shouldUseMock,
      mockDataLoader,
      errorMessage,
      isPayloadValid,
    });

    recordMockUsage(id, result.source);

    return { ...result, metadata: { domain: id } };
  };

  return {
    id,
    endpoint,
    fetchFromApi,
    fetchFromMock,
    shouldUseMock,
    fetch: fetchData,
  };
};
