/**
 * useNewsletter — hooks de React Query del newsletter.
 *
 *   UC-NEW-03 — Listar suscriptores (admin)
 *   UC-NEW-04 — Listar campanas enviadas
 *
 * Las mutaciones (suscribir, desuscribir, enviar campana) viven en
 * `newsletterSlice` + `lastAction`.
 */
import { useQuery } from '@tanstack/react-query';
import apiService from '@services/apiService';

const ADMIN_SUBSCRIBERS_URL = '/api/v1/admin/newsletter/subscribers/';
const ADMIN_CAMPAIGNS_URL   = '/api/v1/admin/newsletter/campaigns/';

export const NEWSLETTER_SUBSCRIBERS_KEY = ['newsletter', 'admin', 'subscribers'];
export const NEWSLETTER_CAMPAIGNS_KEY   = ['newsletter', 'admin', 'campaigns'];

export function useNewsletterSubscribers(params = {}) {
  return useQuery({
    queryKey: [...NEWSLETTER_SUBSCRIBERS_KEY, params],
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get(ADMIN_SUBSCRIBERS_URL, {
        params,
        signal,
      });
      return data ?? {};
    },
  });
}

export function useNewsletterCampaigns(params = {}) {
  return useQuery({
    queryKey: [...NEWSLETTER_CAMPAIGNS_KEY, params],
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get(ADMIN_CAMPAIGNS_URL, {
        params,
        signal,
      });
      return data ?? {};
    },
  });
}

export default useNewsletterSubscribers;
