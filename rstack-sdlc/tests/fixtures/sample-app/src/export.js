// Synthetic application for the RSTACK SDLC fixtures. It is not real product code.
//
// handleExport(request, deps) runs an export for an authorized user.
//   request: { user: { authorized: boolean } | null, params: object }
//   deps:    { exporter: (params) => unknown, flags: { exportsEnabled?: boolean } }

export function handleExport(request, deps) {
  if (!request.user || request.user.authorized !== true) {
    return { status: 401, code: 'UNAUTHORIZED' };
  }
  const data = deps.exporter(request.params);
  return { status: 200, data };
}
