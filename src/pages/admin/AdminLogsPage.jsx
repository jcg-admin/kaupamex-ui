/**
 * AdminLogsPage — UC-ADM-06 (SOL-011 T-09)
 *
 * Visor tecnico de logs (dev/forensics): consulta RequestLog (cada request) y
 * AppLog (errores/logger) del endpoint DRF read-only. Reemplaza al Django admin
 * (H-API-LOG-01: no disponible en prod; el backoffice es React + DRF).
 *
 *   GET /api/v2/admin/logs/?source=&correlation_id=&status_min=&level=&page=
 *
 * DEC-LOG-08 revisada. Hermano de AdminAuditLogPage (UC-ADM-03): mismo mecanismo
 * de visor, distinto dominio del dato (tecnico vs negocio; DEC-LOG-09).
 */
import { useState } from 'react';
import { useAdminLogs } from '@hooks/domain/useAdminLogs';
import { DataTable, Alert, Tabs, Tab, TabList } from '@components/common';
import { Button } from '@components/common/primitives';
import { formatDateTime } from '@lib/intl';
import styles from './AdminLogsPage.module.scss';

const REQUESTLOG_COLUMNS = [
  { key: 'created_at', header: 'Fecha', sortable: true,
    render: (r) => formatDateTime(r.created_at) },
  { key: 'method', header: 'Método' },
  { key: 'path', header: 'Ruta' },
  { key: 'status_code', header: 'Status', sortable: true },
  { key: 'duration_ms', header: 'ms' },
  { key: 'user_id', header: 'User', render: (r) => r.user_id ?? '—' },
  { key: 'correlation_id', header: 'Correlation ID',
    render: (r) => <span className={styles.correlationCell}>{r.correlation_id}</span> },
];

const APPLOG_COLUMNS = [
  { key: 'created_at', header: 'Fecha', sortable: true,
    render: (r) => formatDateTime(r.created_at) },
  { key: 'level', header: 'Nivel', sortable: true },
  { key: 'logger_name', header: 'Logger' },
  { key: 'msg', header: 'Mensaje',
    render: (r) => <span className={styles.msgCell}>{r.msg}</span> },
  { key: 'correlation_id', header: 'Correlation ID',
    render: (r) => <span className={styles.correlationCell}>{r.correlation_id}</span> },
];

const PAGE_SIZE_OPTIONS = [25, 50, 100];

export default function AdminLogsPage() {
  const [source, setSource]   = useState('requestlog');
  const [page, setPage]       = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [correlation, setCorrelation] = useState('');
  const [statusMin, setStatusMin]     = useState('');
  const [status, setStatus]           = useState('');
  const [path, setPath]               = useState('');
  const [level, setLevel]             = useState('');
  const [from, setFrom]               = useState('');
  const [to, setTo]                   = useState('');

  // El endpoint espera `from`/`to` como datetime ISO 8601 (parse_datetime
  // rechaza 'YYYY-MM-DD' a secas); un <input type=date> da la fecha → se
  // expande al día completo [00:00:00, 23:59:59].
  const params = { source, page, page_size: pageSize };
  if (correlation) params.correlation_id = correlation;
  if (from) params.from = `${from}T00:00:00`;
  if (to)   params.to   = `${to}T23:59:59`;
  if (source === 'requestlog') {
    if (statusMin) params.status_min = statusMin;
    if (status)    params.status     = status;
    if (path)      params.path       = path;
  }
  if (source === 'applog' && level) params.level = level;

  const { data, isLoading, isError } = useAdminLogs(params);
  const rows  = data?.results ?? [];
  const count = data?.count ?? 0;
  const pages = data?.pages ?? 1;

  const switchSource = (next) => {
    setSource(next);
    setPage(1);
  };

  const submit = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const changePageSize = (n) => {
    setPageSize(n);
    setPage(1);
  };

  return (
    <section className={styles.page} aria-labelledby="logs-title">
      <header className={styles.header}>
        <h1 id="logs-title" className={styles.title}>Logs técnicos</h1>
        <p className={styles.subtitle}>
          Bitácora técnica de requests y errores del sistema.
        </p>
      </header>

      <Tabs
        className={styles.sourceTabs}
        activeTab={source}
        onTabChange={switchSource}
      >
        <TabList label="Fuente de logs">
          <Tab id="requestlog">Requests</Tab>
          <Tab id="applog">Aplicación</Tab>
        </TabList>
      </Tabs>

      <form className={styles.filters} onSubmit={submit} role="search">
        <label>
          Correlation ID
          <input
            type="text"
            value={correlation}
            onChange={(e) => setCorrelation(e.target.value)}
            placeholder="ej. deadbeef…"
          />
        </label>
        <label>
          Desde
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label>
          Hasta
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        {source === 'requestlog' && (
          <>
            <label>
              Status ≥
              <input
                type="number"
                value={statusMin}
                onChange={(e) => setStatusMin(e.target.value)}
                placeholder="400"
              />
            </label>
            <label>
              Status ==
              <input
                type="number"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                placeholder="404"
              />
            </label>
            <label>
              Ruta contiene
              <input
                type="text"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="/api/v2/…"
              />
            </label>
          </>
        )}
        {source === 'applog' && (
          <label>
            Nivel
            <select value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="">Todos</option>
              <option value="DEBUG">DEBUG</option>
              <option value="INFO">INFO</option>
              <option value="WARNING">WARNING</option>
              <option value="ERROR">ERROR</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </label>
        )}
        <Button type="submit" variant="primary">Filtrar</Button>
      </form>

      {isError && <Alert variant="danger">No se pudo cargar el log.</Alert>}

      <DataTable
        columns={source === 'requestlog' ? REQUESTLOG_COLUMNS : APPLOG_COLUMNS}
        rows={rows}
        rowKey={(r) => r.id}
        loading={isLoading}
        emptyText="No hay entradas para los filtros aplicados."
        caption="Logs técnicos"
        captionHidden
        total={count}
        page={page}
        pageCount={pages}
        onPageChange={setPage}
        pageSize={pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        onPageSizeChange={changePageSize}
      />
    </section>
  );
}
