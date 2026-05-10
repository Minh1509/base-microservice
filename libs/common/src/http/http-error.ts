export interface HttpErrorResponse {
  code: string;
  message: string;
  details?: unknown;
  timestamp: string;
  path: string;
}
