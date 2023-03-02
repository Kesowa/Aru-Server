import { spawn } from "child_process";

export function removeExifData(img_path: string) {
  return new Promise<void>((res, rej) => {
    const proc = spawn("mogrify", [img_path]);
    proc.once("error", rej);
    proc.once("close", (code) => {
      if (code == 0) {
        return res();
      }
      return rej(code);
    });
  });
}
