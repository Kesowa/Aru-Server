import { SuperAgentTest } from "supertest";
import { CurriedUrl } from "./utils";
import path from "path";
import { openAsBlob } from "fs";

export enum DocModel {
  VOD = "VOD",
  USER_AVATARS = "user",
  ALERT_IMAGES = "alert",
  VECTOR = "vector",
  RASTER = "raster",
  DOCUMENTS = "document",
  LAYER_FILES = "layerFiles",
}

export async function uploadFile(
  agent: SuperAgentTest,
  filePath: string,
  rename?: string,
) {
  const fileBlob = await openAsBlob(filePath);
  const res = await agent
    .post(CurriedUrl("common")("upload-url"))
    .send({
      name: rename ?? path.basename(filePath),
      size: fileBlob.size,
      type: "application/octect-stream",
      model: DocModel.ALERT_IMAGES,
    })
    .expect(201);

  const { postURL, formData } = res.body.data.presigned;

  expect(postURL).toBeDefined()
  expect(formData).toBeDefined()

  const body = new FormData();
  Object.entries(formData).forEach(([key, val]) => body.set(key, String(val)));
  body.set("file", fileBlob);

  const uploadRes = await fetch(postURL, {
    method: "POST",
    body,
  })

  expect(uploadRes.status).toBe(204);
  expect(res.body.data._id).toBeDefined();

  return res.body.data._id;
}
