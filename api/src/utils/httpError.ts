// Thrown by services/routes when a request is well-formed but should be
// rejected with a specific HTTP status — e.g. a resource that doesn't
// exist, or exists but doesn't belong to the caller's supplier.
//
// We deliberately return 404 (not 403) for cross-supplier access attempts.
// A 403 confirms the resource exists but is forbidden, which itself leaks
// information across tenants. Returning the same "not found" response
// whether the ID is wrong or just belongs to someone else avoids that leak.
export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

export function notFound(resource: string): HttpError {
  return new HttpError(404, `${resource} not found`)
}
