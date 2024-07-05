// /* eslint-disable @typescript-eslint/no-misused-promises */
// import { Request, Router } from "express";
// import openApi from "./openApi";
// import { Types } from "ts-openapi";
// import Vector from "../../models/vectorprops";
// import { VectorType } from "../../schemas/vectorprops";
// import { AuthResponse } from "../../utils/interfaceUtils";

// const vectorApi = Router();

// vectorApi.get(
//   "/",
//   async (
//     req: Request & {
//       query: {
//         vectorPropId?: string;
//         limit: number;
//         offset: number;
//         orderBy: string;
//         asc: boolean;
//         populate: string[];
//       };
//     },
//     res: AuthResponse
//   ) => {
//     const { vectorPropId, limit, offset, orderBy, asc, populate } = req.query;
//     const data = await Vector.find(
//       {
//         [vectorPropId && "_id"]: vectorPropId,
//       },
//       {},
//       {
//         sort: {
//           [orderBy]: asc ? "asc" : "desc",
//         },
//       }
//     )
//       .skip(offset)
//       .limit(limit)
//       .populate(populate)
//       .lean();
//     res.json({
//       data,
//       pagination: {
//         limit,
//         offset,
//         count: data.length,
//       },
//     });
//   }
// );

// openApi.addPath(
//   "/vectorProp",
//   {
//     get: {
//       summary: "Get vector prop data",
//       description:
//         "This operation retrieves information about different types of vectors",
//       operationId: "GetVectorProp",
//       requestSchema: {
//         query: {
//           vectorPropId: Types.String(),
//           limit: Types.Integer({
//             minValue: 0,
//             maxValue: 100,
//             default: 10,
//             required: true,
//           }),
//           offset: Types.Integer({ minValue: 0, default: 0, required: true }),
//           orderBy: Types.String({ default: "createdAt", required: true }),
//           asc: Types.Boolean({ default: false, required: true }),
//           populate: Types.Array({ arrayType: Types.String() }),
//         },
//       },
//       tags: ["Vector Prop API"],
//       responses: {
//         200: openApi.declareSchema(
//           "successful response",
//           Types.Object({
//             description: "Successful Operation",
//             properties: {
//               data: Types.Array({ arrayType: VectorType }),
//               pagination: Types.Object({
//                 description: "pagination information for data",
//                 properties: {
//                   offset: Types.Integer({ minValue: 0 }),
//                   limit: Types.Integer({
//                     minValue: 0,
//                     maxValue: 100,
//                     default: 10,
//                   }),
//                   count: Types.Integer({
//                     minValue: 0,
//                     maxValue: 100,
//                     default: 10,
//                   }),
//                 },
//               }),
//             },
//           })
//         ),
//       },
//     },
//   },
//   true
// );

// export default vectorApi;
