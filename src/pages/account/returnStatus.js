/**
 * returnStatus — PracticaYoruba
 * Etiquetas y clases compartidas para los estados de ReturnRequest.
 */

export const RETURN_STATUS_LABEL = {
  PENDIENTE_REVISION:    'Pendiente de revisión',
  PENDIENTE_INFORMACION: 'Pendiente de información',
  APROBADA:              'Aprobada',
  RECHAZADA:             'Rechazada',
  COMPLETADA:            'Completada',
};

export const RETURN_STATUS_CLASS = {
  PENDIENTE_REVISION:    'badgePending',
  PENDIENTE_INFORMACION: 'badgeInfo',
  APROBADA:              'badgeApproved',
  RECHAZADA:             'badgeRejected',
  COMPLETADA:            'badgeCompleted',
};

export const REASON_LABEL = {
  PRODUCTO_DANADO:         'Producto dañado',
  NO_COINCIDE_DESCRIPCION: 'No coincide con la descripción',
  CAMBIO_OPINION:          'Cambio de opinión',
  OTRO:                    'Otro motivo',
};

export const REFUND_STATUS_LABEL = {
  PENDIENTE:        'Pendiente',
  EN_PROCESO:       'En proceso',
  APPROVED:         'Procesado',
  REFUNDED:         'Reembolsado',
  PARTIALLY_REFUNDED: 'Reembolso parcial',
  FAILED:           'Fallido',
};
