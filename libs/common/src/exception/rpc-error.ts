export const RPC_DEFAULT_TIMEOUT_MS = 5_000;

export interface RpcErrorPayload {
  statusCode: number;
  errorCode: string;
  message: string;
  details?: object;
}

export function isRpcErrorPayload(value: unknown): value is RpcErrorPayload {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.statusCode === 'number' &&
    typeof v.errorCode === 'string' &&
    typeof v.message === 'string'
  );
}
