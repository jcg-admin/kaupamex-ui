/**
 * AdminPlatformProvisionPage — Consola L0 del operador Kaupamex (UC-PLT-05).
 *
 * "Asignar módulos al tenant": el operador de plataforma (capacidad
 * platform.provision) elige un tenant (Company L1) y enciende/apaga los
 * módulos contratables. Deriva del mockup `mockup-asignar-modulos-kaupamex`.
 *
 * Contrato real (api ya construido, /api/v2/platform/):
 *   - GET  /companies/                          directorio de tenants (L0 cross-company)
 *   - GET  /modules/                            catálogo L0 (ERP families, is_application)
 *   - GET  /module-subscriptions/?company=<id>  suscripciones del tenant
 *   - POST /module-subscriptions/               contratar (status active)
 *   - PATCH /module-subscriptions/<id>/         dar de baja (suspended) / re-activar
 *
 * Alcance de esta rebanada: módulo on/off + ciclo de facturación + vigencia.
 * Los add-ons cuantificados del mockup (subsidiarias/sucursales) NO tienen
 * modelo en api todavía (TenantEntitlementQuota inexistente) — quedan fuera y
 * se documentan en el interfaz-*.rst como pendientes.
 */
import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import apiService from '@services/apiService';
import {
  usePlatformCompanies,
  usePlatformModules,
  useCompanySubscriptions,
  PLATFORM_SUBSCRIPTIONS_QUERY_KEY,
} from '@hooks/domain/usePlatformProvision';
import { MetaTag, Select, Button, Card } from '@components/common/primitives';
import Switch from '@components/common/Switch/Switch';
import Alert from '@components/common/Alert/Alert';
import Loader from '@components/common/Loader/Loader';
import styles from './AdminPlatformProvisionPage.module.scss';

const SUBS_URL = '/api/v2/platform/module-subscriptions/';

const CYCLES = [
  { value: 'monthly', label: 'Mensual' },
  { value: 'annual', label: 'Anual' },
];

/** Suscripción activa si status active y sin expirar (el api deriva is_active). */
function subsByCode(subs) {
  const map = {};
  for (const s of subs) map[s.module_code] = s;
  return map;
}

export default function AdminPlatformProvisionPage() {
  const qc = useQueryClient();
  const [companyId, setCompanyId] = useState('');
  const [draft, setDraft] = useState(null); // { code: bool } | null (sin tenant)
  const [cycle, setCycle] = useState('monthly');
  const [validUntil, setValidUntil] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null); // { variant, text }

  const companies = usePlatformCompanies();
  const modules = usePlatformModules();
  const subscriptions = useCompanySubscriptions(companyId);

  // Sólo los módulos vendibles (is_application) son contratables por el operador.
  const appModules = useMemo(
    () => (modules.data || []).filter((m) => m.is_application),
    [modules.data],
  );

  // Agrupar por category (familia funcional ERP) para pintar la rejilla.
  const byCategory = useMemo(() => {
    const groups = {};
    for (const m of appModules) {
      (groups[m.category] ||= []).push(m);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [appModules]);

  const subMap = useMemo(() => subsByCode(subscriptions.data || []), [subscriptions.data]);

  // Al cambiar de tenant, sembrar el draft desde las suscripciones actuales.
  function onSelectCompany(e) {
    const id = e.target.value;
    setCompanyId(id);
    setFeedback(null);
    setDraft(null); // se rehidrata cuando lleguen las subs (ver seedDraft)
  }

  // Sembrar el draft una vez que hay subs cargadas y no hay draft aún.
  const seededDraft = useMemo(() => {
    if (draft) return draft;
    if (!companyId || subscriptions.isLoading || !appModules.length) return null;
    const seed = {};
    for (const m of appModules) seed[m.code] = Boolean(subMap[m.code]?.is_active);
    return seed;
  }, [draft, companyId, subscriptions.isLoading, appModules, subMap]);

  // Un módulo sólo puede encenderse si TODAS sus dependencias están on en el draft.
  function depsSatisfied(mod) {
    if (!mod.depends?.length) return true;
    return mod.depends.every((dep) => seededDraft?.[dep]);
  }

  function toggle(code, next) {
    setDraft((prev) => ({ ...(prev || seededDraft || {}), [code]: next }));
    setFeedback(null);
  }

  async function onSave() {
    if (!companyId || !seededDraft) return;
    setSaving(true);
    setFeedback(null);
    const modByCode = Object.fromEntries(appModules.map((m) => [m.code, m]));
    try {
      for (const [code, want] of Object.entries(seededDraft)) {
        const current = subMap[code];
        const isOn = Boolean(current?.is_active);
        if (want === isOn) continue; // sin cambio
        if (want) {
          const body = { status: 'active', billing_cycle: cycle };
          if (validUntil) body.expires_at = validUntil;
          if (current) {
            await apiService.patch(`${SUBS_URL}${current.id}/`, body);
          } else {
            await apiService.post(SUBS_URL, {
              company: companyId, module: modByCode[code].id, ...body,
            });
          }
        } else if (current) {
          await apiService.patch(`${SUBS_URL}${current.id}/`, { status: 'suspended' });
        }
      }
      await qc.invalidateQueries({
        queryKey: [...PLATFORM_SUBSCRIPTIONS_QUERY_KEY, companyId],
      });
      setDraft(null); // rehidratar desde el servidor
      setFeedback({ variant: 'success', text: 'Provisión guardada.' });
    } catch (err) {
      const detail = err?.data?.module || err?.data?.detail || err?.message
        || 'No se pudo guardar la provisión.';
      setFeedback({ variant: 'danger', text: String(detail) });
    } finally {
      setSaving(false);
    }
  }

  const companyOptions = (companies.data || []).map((c) => ({
    value: String(c.id), label: `${c.name} (${c.code})`,
  }));
  const selectedCompany = (companies.data || []).find((c) => String(c.id) === String(companyId));

  return (
    <div className={styles.page}>
      <MetaTag tone="bronze">Kaupamex · Operador L0</MetaTag>
      <h1 className={styles.title}>Provisión de tenant</h1>
      <p className={styles.lead}>
        Enciende o apaga los módulos contratados por cada empresa (L1). Requiere
        la capacidad <code>platform.provision</code>.
      </p>

      <Card title="Tenant" className={styles.card}>
        <Select
          label="Empresa"
          name="company"
          value={companyId}
          onChange={onSelectCompany}
          placeholder={companies.isLoading ? 'Cargando…' : 'Selecciona un tenant'}
          options={companyOptions}
        />
      </Card>

      {feedback && (
        <Alert variant={feedback.variant} dismissible onClosed={() => setFeedback(null)}>
          {feedback.text}
        </Alert>
      )}

      {companyId && (
        <Card
          title="Módulos contratados"
          subtitle={selectedCompany ? `${selectedCompany.name}` : undefined}
          className={styles.card}
        >
          {(modules.isLoading || subscriptions.isLoading || !seededDraft) ? (
            <Loader />
          ) : (
            <div aria-label="Módulos contratables" className={styles.grid}>
              {byCategory.map(([category, mods]) => (
                <section key={category} className={styles.group}>
                  <h3 className={styles.groupTitle}>{category}</h3>
                  {mods.map((m) => {
                    const enabled = depsSatisfied(m);
                    const on = Boolean(seededDraft[m.code]) && enabled;
                    return (
                      <div key={m.code} className={styles.row}>
                        <Switch
                          checked={on}
                          disabled={saving || !enabled}
                          ariaLabel={m.name}
                          onChange={(e) => toggle(m.code, e.target.checked)}
                        />
                        <span className={styles.rowName}>{m.name}</span>
                        {!enabled && (
                          <span className={styles.rowHint}>
                            requiere {m.depends.join(', ')}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </section>
              ))}
            </div>
          )}
        </Card>
      )}

      {companyId && seededDraft && (
        <Card title="Suscripción" className={styles.card}>
          <div className={styles.subForm}>
            <Select
              label="Ciclo de facturación"
              name="cycle"
              value={cycle}
              onChange={(e) => setCycle(e.target.value)}
              options={CYCLES}
            />
            <label className={styles.dateField}>
              <span className={styles.dateLabel}>Vigencia (fin)</span>
              <input
                type="date"
                name="validUntil"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className={styles.dateInput}
                aria-label="Vigencia de la suscripción"
              />
            </label>
          </div>
          <div className={styles.actions}>
            <Button variant="primary" onClick={onSave} disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar provisión'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => { setDraft(null); setFeedback(null); }}
              disabled={saving}
            >
              Cancelar
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
