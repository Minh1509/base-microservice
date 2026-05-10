export const RPC_DEFAULT_TIMEOUT_MS = 5_000;

export interface RpcErrorPayload {
  status: number;
  code: string;
  message: string;
  details?: unknown;
}

export function isRpcErrorPayload(value: unknown): value is RpcErrorPayload {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.status === 'number' &&
    typeof v.code === 'string' &&
    typeof v.message === 'string'
  );
}
