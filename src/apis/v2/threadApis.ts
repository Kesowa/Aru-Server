import { Request, Router } from "express";
import openApi from "./openApi";
import { Types } from "ts-openapi";
import { Thread } from "../../models/thread";
import { ThreadType } from "../../schemas/thread";
import { AuthResponse } from "../../utils/interfaceUtils";

const threadApi = Router();

threadApi.get("/", async (req: Request<null, {}, null, {
  docId?: string,
  docType?: string
}>, res: AuthResponse) => {
  const { docId, docType } = req.query;
  const data = await Thread.findOne(
    {
      tenant: res.locals.user.tenantId._id,
      [docId && "doc"]: docId,
      [docType && "docModel"]: docType
    });
  
  if(!data) {
    throw new Error("Thread not found");
  } else {
    res.json({
      data
    })
  }
});

openApi.addPath("/thread", {
  get: {
    summary: "Get thread data",
    description: "This operation retrives thread information",
    operationId: "GetThread",
    requestSchema: {
      query: {
        docId: Types.String(),
        docType: Types.String()
      }
    },
    tags: ["Thread API"],
    responses: {
      200: openApi.declareSchema("successful response",
        Types.Object({
          description: "Successful Operation",
          properties: {
            data: ThreadType
          },
        })
      )
    }
  }
}, true)

export default threadApi;
