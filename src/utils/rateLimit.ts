import rateLimit from "express-rate-limit";
import { RATE_LIMIT } from "../constants";
export function RateLimiter(limit: number) {
  console.log("RATE LIMIT IS: ", RATE_LIMIT);
  if (RATE_LIMIT) {
    const limiter = rateLimit({
      windowMs: 5 * 60 * 1000,
      limit,
      standardHeaders: "draft-7",
      legacyHeaders: false,
    });

    return limiter;
  }

  return (req, res, next) => next();
}
