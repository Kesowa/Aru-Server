import { Log } from "../utils/logUtils";

declare module "express" {
  interface Response {
    locals: {
      logger: Log;
    };
  }
}
