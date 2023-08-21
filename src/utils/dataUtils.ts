import { exec } from "child_process"
import { promisify } from "util"
import * as pathUtils from "./pathUtils";
import path from "path";
import { Logger } from "pino";

const asyncExec = promisify(exec);

/**
 * Takes pointcloud file path, returns web view index page path or undefined
 */
export const savePointcloud = async (doc: pathUtils.DirPath | pathUtils.DocPath, log?: Logger) => {
  const absDocPath = pathUtils.absPath(pathUtils.Directory.ROOT, doc);
  const filename = path.parse(doc).name;
  const outputDirPath = pathUtils.docPath(pathUtils.Directory.DOCUMENTS, "/");
  const absOutputPath = pathUtils.absPath(pathUtils.Directory.ROOT, outputDirPath);
  try {
    await asyncExec(
      `/bin/PotreeConverter ${absDocPath} -o ${absOutputPath} --generate-page ${filename}`
    );
    return outputDirPath + ".html"
  } catch (err) {
    log && log.error(err);
    return undefined;
  }
}
