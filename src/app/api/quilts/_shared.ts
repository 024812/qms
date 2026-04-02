export function applyQuiltCompatibilityHeaders(response: Response) {
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  response.headers.set('X-QMS-API-Surface', 'compatibility');
  response.headers.set('X-QMS-Canonical-Path', 'src/lib/data/quilts.ts');
  return response;
}
