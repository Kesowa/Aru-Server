import { NextFunction, RequestHandler, Response, Request } from "express";
import { validationResult } from "express-validator";
import { MODE, Mode } from "../constants";
export const serverError = (res: Response) => {
  return res.status(500).json({
    status: false,
    message: "Server error",
  });
};

export const validator: RequestHandler = (req, res, next) => {
  console.debug({ path: req.url, query: req.query, body: req.body });
  const errs = validationResult(req);
  if (!errs.isEmpty()) {
    const errMap = errs.array();
    console.error(errMap);
    return res.status(400).json({
      status: false,
      message: "request validation failed",
      data: errMap,
    });
  }
  next();
};

enum Sort {
  ASC = 1,
  DESC = -1,
}
export function sanitizeSort(query: string) {
  query = query.trim().toLowerCase();
  if (query.startsWith("desc")) return Sort.DESC;
  return Sort.ASC;
}
export const RobustRunner = <A, B, C, D, T extends Response>(
  handler: (req: Request<A, B, C, D>, res: T) => Promise<unknown>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req as Request<A, B, C, D>, res as T)
      .then(() => res.locals.logger.info("completed"))
      .catch((err) => {
        res.locals.logger.error(err);
        res.status(500).json({
          status: false,
          message: "Server error!",
        });
      });
  };
};

export const requestTimeout: (seconds: number) => RequestHandler =
  (seconds) => (req, _res, next) => {
    req.setTimeout(seconds * 1000);
    next();
  };

export const environmentGuard =
  (env: Mode) => (_: Request, res: Response, next: NextFunction) => {
    if (env != MODE) {
      res.status(404).json({
        status: false,
        message: "Endpoint disabled",
      });
      return;
    }
    next();
  };
