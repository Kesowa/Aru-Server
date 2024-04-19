import type { NextFunction, RequestHandler, Response, Request } from "express";
import { validationResult } from "express-validator";
import { MODE, Mode } from "../constants";
export const serverError = (res: Response) => {
  return res.status(500).json({
    status: false,
    message: "Server error",
  });
};

export const validator: RequestHandler = (req, res, next) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) {
    const errMap = errs.array();
    req.log.error(errMap);
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
  return (req: Request, res: Response) => {
    handler(req as Request<A, B, C, D>, res as T)
      .then()
      .catch((err) => {
        req.log.error(err);
        if (!res.headersSent)
          res.status(500).json({
            status: false,
            message: "Server error!",
          });
      });
  };
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

export type SchemaTranslator<Param, Query, Body> = Request<
  Param,
  unknown,
  Body,
  Query
>;
