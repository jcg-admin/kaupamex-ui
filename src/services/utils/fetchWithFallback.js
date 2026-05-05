import { cloneData } from './cloneUtils';

const DEFAULT_SHOULD_USE_MOCK = () => false;

const buildError = (errorMessage, details) => {
  if (details instanceof Error) {
    const enriched = new Error(`${errorMessage}: ${details.message}`);
    enriched.cause = details;
    return enriched;
  }

  if (typeof details === 'object' && details) {
    const { status, statusText } = details;
    return new Error(`${errorMessage}: ${status ?? 'unknown'} ${statusText ?? ''}`.trim());
  }

  return new Error(errorMessage);
};

/**
 * @template T
 * @param {Object} params
 * @param {string} params.url
 * @param {() => Promise<Response>} params.fetchImpl
 * @param {() => Promise<T>} params.mockDataLoader
 * @param {AbortSignal} [params.signal]
 * @param {() => boolean} [params.shouldUseMock]
 * @param {string} params.errorMessage
 * @param {(T) => boolean} [params.isPayloadValid]
 * @returns {Promise<{data: T, source: 'api' | 'mock', error: Error | null}>}
 */
export const fetchWithFallback = async ({
  url,
  fetchImpl,
  mockDataLoader,
  signal,
  shouldUseMock = DEFAULT_SHOULD_USE_MOCK,
  errorMessage,
  isPayloadValid,
}) => {
  const effectiveFetch = typeof fetchImpl === 'function' ? fetchImpl : typeof fetch === 'function' ? fetch : null;

  if (shouldUseMock()) {
    return {
      data: cloneData(await mockDataLoader()),
      source: 'mock',
      error: null,
    };
  }

  if (!effectiveFetch) {
    return {
      data: cloneData(await mockDataLoader()),
      source: 'mock',
      error: buildError(errorMessage, new Error('fetch no disponible en el entorno actual')),
    };
  }

  try {
    const response = await effectiveFetch(url, { signal });

    if (!response.ok) {
      throw { status: response.status, statusText: response.statusText };
    }

    const payload = await response.json();
    const payloadValid = typeof isPayloadValid === 'function' ? isPayloadValid(payload) : true;

    if (!payloadValid) {
      throw new Error('payload vacio o invalido');
    }

    return {
      data: payload,
      source: 'api',
      error: null,
    };
  } catch (error) {
    return {
      data: cloneData(await mockDataLoader()),
      source: 'mock',
      error: buildError(errorMessage, error),
    };
  }
};
