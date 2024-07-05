// import { Request } from "express";
// import { AuthResponse } from "../../utils/interfaceUtils";
// import RasterProps from "../../models/rasterprops";

// // create function
// export const createRasterProps = async (req: Request, res: AuthResponse) => {
//   {
//     const { name, bidx, bandExp, colorMap, resamplingMethod } = req.body;
//     const rasterProps = new RasterProps({
//       name,
//       bidx,
//       bandExp,
//       colorMap,
//       resamplingMethod,
//       //tenantId: res.locals.user.tenantId,
//       createdBy: res.locals.user._id,
//       updatedBy: res.locals.user._id,
//     });
//     const data = await rasterProps.save();
//     res.status(201).json({
//       status: true,
//       message: "New rasterProps Created",
//       data: data,
//     });
//   }
// };

// export const getRasterPropsById = async (req: Request, res: AuthResponse) => {
//   {
//     let data: any;
//     if (req.query.id == "" || req.query.id == undefined) {
//       data = await RasterProps.find({});
//     } else {
//       data = await RasterProps.findById(req.query.id);
//     }

//     if (data) {
//       res.json({
//         status: true,
//         message: "fetch raster data successfully",
//         result: data,
//       });
//     } else {
//       res.json({
//         status: false,
//         message: "wrong user input",
//       });
//     }
//   }
// };

// export const getAllRasterProps = async (req: Request, res: AuthResponse) => {
//   {
//     const rasterData = await RasterProps.find({});
//     const result: any[] = [];
//     for (let i = 0; i < rasterData.length; i++) {
//       result.push({
//         _id: rasterData[i]._id,
//         name: rasterData[i].name,
//       });
//     }
//     if (rasterData) {
//       res.json({
//         status: true,
//         message: "raster data fetched successfully",
//         data: result,
//       });
//     } else {
//       res.json({
//         status: false,
//         message: "wrong user input",
//       });
//     }
//   }
// };
