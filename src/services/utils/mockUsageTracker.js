const metrics = {};
const subscribers = new Set();

const ensureDomain = (domain) => {
  if (!metrics[domain]) {
    metrics[domain] = { api: 0, mock: 0 };
  }

  return metrics[domain];
};

export const recordMockUsage = (domain, source) => {
  if (!domain) {
    return;
  }

  const normalizedSource = source === 'api' || source === 'mock' ? source : null;

  if (!normalizedSource) {
    return;
  }

  const entry = ensureDomain(domain);
  entry[normalizedSource] += 1;

  notifySubscribers();
};

export const getMockUsageMetrics = () => {
  return Object.keys(metrics).reduce((acc, domain) => {
    const { api = 0, mock = 0 } = metrics[domain] || {};
    acc[domain] = { api, mock };
    return acc;
  }, {});
};

export const resetMockUsageMetrics = () => {
  Object.keys(metrics).forEach((domain) => {
    delete metrics[domain];
  });

  notifySubscribers();
};

const notifySubscribers = () => {
  const snapshot = getMockUsageMetrics();
  subscribers.forEach((listener) => listener(snapshot));
};

export const subscribeMockUsage = (listener) => {
  if (typeof listener !== 'function') {
    return () => {};
  }

  listener(getMockUsageMetrics());
  subscribers.add(listener);

  return () => {
    subscribers.delete(listener);
  };
};
