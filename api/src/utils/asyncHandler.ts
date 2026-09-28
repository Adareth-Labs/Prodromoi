import type { NextFunction, Request, Response } from 'express'

type AsyncRouteHandler<Req extends Request = Request> = (
  req:  Req,
  res:  Response,
  next: NextFunction
) => Promise<void>

// Express 4 does not catch rejections thrown inside an async handler — an
// unguarded `await` that fails just hangs the request. Wrapping every async
// handler here forwards the rejection to `next(err)` so it always reaches
// errorHandler, instead of relying on each handler to remember its own
// try/catch.
export function asyncHandler<Req extends Request = Request>(
  handler: AsyncRouteHandler<Req>
) {
  return (req: Req, res: Response, next: NextFunction): void => {
    handler(req, res, next).catch(next)
  }
}
