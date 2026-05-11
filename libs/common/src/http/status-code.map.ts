const STATUS_CODE_MAP: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'VALIDATION_FAILED',
  504: 'UPSTREAM_TIMEOUT',
};

export function statusToCode(status: number): string {
  return STATUS_CODE_MAP[status] ?? (status >= 500 ? 'INTERNAL_ERROR' : 'CLIENT_ERROR');
}
