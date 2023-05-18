import { Router } from "express";
import openApi from "./openApi";
import { Types } from "ts-openapi";
import Alert from "../../models/alert";

const alertApi = Router();
const alertSchema = {
  name: Types.String(),
  date: Types.Date(),
}

alertApi.get("/", async (req, res) => {
  if (req.query.name) throw new Error("Oh noes!");
  res.json({
    name: req.query.name,
    date: new Date(),
  })
});

openApi.addPath("/alert", {
  get: {
    summary: "Get an alert data",
    description: "This operation retrives alert/drone image information",
    operationId: "GetAlert",
    requestSchema: {
      query: {
        name: Types.String({
          description: "Alert Name",
          required: true,
          example: "Taj Mahal Photo"
        })
      }
    },
    tags: ["Alert API"],
    responses: {
      200: openApi.declareSchema("successful response",
        Types.Object({
          description: "Successful Operation",
          properties: alertSchema,
        })
      )
    }
  }
}, true)

export default alertApi;
