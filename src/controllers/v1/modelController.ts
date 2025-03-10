import { Request } from "express";

import deviceModel from "../../models/model";
import { IAssetClass } from "../../schemas/assetClass";
import { IManufacturer } from "../../schemas/manufacturer";
import { IUser } from "../../schemas/user";
import { AuthResponse } from "../../utils/interfaceUtils";

export const createModel = async (req: Request, res: AuthResponse) => {
  const newModel = new deviceModel({
    modelName: req.body.modelName,
    modelNumber: req.body.modelNumber,
    assetClassID: req.body.assetClassID,
    dimensions: req.body.dimensions,
    manufacturerID: req.body.manufacturerID,
    website: req.body.website,
    createdAt: new Date(),
    createdBy: res.locals.user._id,
    tenantID: res.locals.user.tenantId,
    props: req.body.props,
  });

  const savePromise = await newModel.save();

  if (savePromise) {
    res.status(201).json({
      status: true,
      message: "Successfully saved the Model",
      data: savePromise,
    });
  }
};

export const getModel = async (req: Request, res: AuthResponse) => {
  const dbResp = await deviceModel
    .find({ tenantID: res.locals.user.tenantId._id })
    .populate<{ createdBy: IUser }>("createdBy")
    .populate<{ assetClassID: IAssetClass }>({
      path: "assetClassID",
      select: "typeName",
    })
    .populate<{ manufacturerID: IManufacturer }>({
      path: "manufacturerID",
      select: "name",
    })
    .lean();
  res.json({
    status: true,
    message: "Models fetched sucessfully.",
    data: dbResp,
  });
};

export const updateModel = async (req: Request, res: AuthResponse) => {
  const updatedDoc = await deviceModel.findOneAndUpdate(
    {
      _id: req.body.id,
      tenantID: res.locals.user.tenantId._id,
    },
    { ...req.body.update }
  );
  if (updatedDoc === null) {
    res.status(404).json({
      status: false,
      message: "Device Model doesnt exist",
    });
  } else {
    res.json({
      status: true,
      message: "Model updated sucessfully.",
      data: updatedDoc,
    });
  }
};

export const removeModel = async (req: Request, res: AuthResponse) => {
  const deletedDoc = await deviceModel.deleteOne({
    _id: req.body.id,
    tenantID: res.locals.user.tenantId._id,
  });
  if (deletedDoc) {
    res.json({
      status: true,
      message: "Model successfully deleted",
    });
  } else {
    res.status(404).json({
      status: false,
      message: "Model class doesnt exist",
    });
  }
};

export const fetchModelbyId = async (req: Request, res: AuthResponse) => {
  const gotdoc = await deviceModel
    .findOne({ _id: req.query._id, tenantID: res.locals.user.tenantId._id })
    .populate<{ assetClassID: IAssetClass }>("assetClassID", "typeName")
    .populate<{ manufacturerID: IManufacturer }>("manufacturerID", "name")
    .populate<{ createdBy: IUser }>("createdBy", "name");
  if (gotdoc) {
    res.json({
      status: true,
      message: "Model fetched sucessfully.",
      data: gotdoc,
    });
  } else {
    res.status(404).json({
      status: false,
      message: "Could not fetch",
    });
  }
};
