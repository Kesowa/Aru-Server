import { exec } from "child_process"
import { promisify } from "util"
import * as pathUtils from "./pathUtils";
import path from "path";

const asyncExec = promisify(exec);

/**
 * Takes pointcloud file path, returns web view index page path or undefined
 */
export const savePointcloud = async (doc: pathUtils.DirPath | pathUtils.DocPath) => {
  const absDocPath = pathUtils.absPath(pathUtils.Directory.ROOT, doc);
  const filename = path.parse(doc).name;
  const outputDirPath = pathUtils.docPath(pathUtils.Directory.DOCUMENTS, "/");
  const absOutputPath = pathUtils.absPath(pathUtils.Directory.ROOT, outputDirPath);
  await asyncExec(
    `/bin/PotreeConverter ${absDocPath} -o ${absOutputPath} --generate-page ${filename}`
  );
  return outputDirPath + ".html"
}
