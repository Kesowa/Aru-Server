import { Request } from "express";
import { AuthResponse } from "../../utils/interfaceUtils";

export const testController = (req: Request, res: AuthResponse) => {
  // res.json({
  //     status : true,
  //     message : "hello from test."
  // })
  res.render("pages/socketTest");
};

export const broadcasterTest = (req: Request, res: AuthResponse) => {
  res.render("pages/streamer");
};

export const viewerTest = (req: Request, res: AuthResponse) => {
  res.render("pages/viewer", { msg: "hi" });
};

// export const permTest = (
//   req: Request,
//   res: AuthResponse,
//   next: NextFunction
// ) => {
//   res.status(200).json({
//     status: true,
//     message: "Granted Access"
//   });
// }
