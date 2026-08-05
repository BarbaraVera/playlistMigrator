const BACKEND_PORT = '8000';

export function getBackendBaseUrl(): string {
  return `${window.location.protocol}//${window.location.hostname}:${BACKEND_PORT}`;
}
