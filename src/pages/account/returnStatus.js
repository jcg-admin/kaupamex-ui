/**
 * returnStatus — Kaupamex
 * Etiquetas y clases compartidas para los estados de ReturnRequest.
 */

// Canon EN identifiers (DEC-DOC-005 + DEC-RET-02). Las etiquetas
// user-facing permanecen en ES; las claves de lookup coinciden con
// los enums del backend (apps.returns.models.ReturnRequest.Status).

export const RETURN_STATUS_LABEL = {
  PENDING_REVIEW:  'Pendiente de revisión',
  INFO_REQUESTED:  'Pendiente de información',
  APPROVED:        'Aprobada',
  REJECTED:        'Rechazada',
  RECEIVED:        'Recibida',
  REFUNDED:        'Completada',
};

export const RETURN_STATUS_CLASS = {
  PENDING_REVIEW:  'badgePending',
  INFO_REQUESTED:  'badgeInfo',
  APPROVED:        'badgeApproved',
  REJECTED:        'badgeRejected',
  RECEIVED:        'badgeReceived',
  REFUNDED:        'badgeCompleted',
};

export const REASON_LABEL = {
  DAMAGED_PRODUCT:  'Producto dañado',
  NOT_AS_DESCRIBED: 'No coincide con la descripción',
  CHANGED_MIND:     'Cambio de opinión',
  OTHER:            'Otro motivo',
};

export const PRODUCT_CONDITION_LABEL = {
  GOOD_CONDITION: 'Buenas condiciones',
  DAMAGED:        'Dañado',
  INCOMPLETE:     'Incompleto',
};

export const REFUND_STATUS_LABEL = {
  PENDING:            'Pendiente',
  APPROVED:           'Procesado',
  REFUNDED:           'Reembolsado',
  PARTIALLY_REFUNDED: 'Reembolso parcial',
  FAILED:             'Fallido',
};
