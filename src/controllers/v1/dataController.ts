import { Request } from "express";
import { AuthResponse } from "../../utils/interfaceUtils";
import { DirPath, Directory } from "../../constants";
import path from "path";
import fs from "fs/promises";
import { exec } from "child_process";

export const genThermal = async (req: Request<{}, {}, { filePath: string }>, res: AuthResponse) => {
  const fullPath = DirPath(Directory.DEFAULT, req.body.filePath);
  const tmpPath = "/tmp/" + path.parse(req.body.filePath).name + ".raw";
  try {
    await new Promise((res, rej) => {
      exec(`dji_irp -s ${fullPath} -a measure --measurefmt float32 -o ${tmpPath}`, (err, sto, ste) => {
        if (err) {
          rej(err); req.log.error(ste);
        } res(sto)
      })
    });
    res.sendFile(tmpPath, () => {
      fs.rm(tmpPath);
    });
  } catch (err) {
    req.log.error(err, "thermal conversion failed");
    res.status(404).json({
      status: false,
      message: "not a thermal image"
    })
  };
}
