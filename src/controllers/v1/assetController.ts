import { Request } from "express";
import { Types } from "mongoose";

import Asset from "../../models/asset";
import AssetClass from "../../models/assetClass";
import manufacturerModel from "../../models/manufacturer";
import Model from "../../models/model";
import { IManufacturer } from "../../schemas/manufacturer";
import { IModel } from "../../schemas/model";
import { ITenant } from "../../schemas/tenant";
import { IUser } from "../../schemas/user";

import { AuthResponse } from "../../utils/interfaceUtils";

type CreateAssetBody = {
  assetName: string;
  userID: string;
  assetInfo: AssetInfo[];
  model: string;
  assetOwner: string;
  manufactureDate: string;
  manufactureID: string;
};

type AssetInfo = {
  UIN: string;
  FCID: string;
  serialNo: string;
};

export const createAsset = async (
  req: Request<null, null, CreateAssetBody>,
  res: AuthResponse
) => {
  const asset = new Asset({
    assetName: req.body.assetName,
    userID: new Types.ObjectId(req.body.userID),
    tenantID: new Types.ObjectId(res.locals.user.tenantId._id),
    assetInfo: req.body.assetInfo,
    createdAt: new Date(),
    createdBy: res.locals.user._id,
    isActive: false,
    modelID: new Types.ObjectId(req.body.model),
    assetOwner: new Types.ObjectId(req.body.assetOwner),
    manufactureDate: req.body.manufactureDate,
    manufactureID: new Types.ObjectId(req.body.manufactureID),
    serialNo: req.body.assetInfo[0].serialNo,
  });

  const savePromise = await asset.save();

  if (savePromise) {
    res.status(201).json({
      status: true,
      message: "Successfully saved the asset",
      data: savePromise,
    });
  } else {
    res.status(501).json({
      status: false,
      message: "Failed to save the asset",
    });
  }
};

export const getAsset = async (req: Request, res: AuthResponse) => {
  const assetID = req.query.assetID;
  const gotDoc = await Asset.find({
    _id: assetID,
    $or: [
      { tenantID: res.locals.user.tenantId._id },
      { userID: res.locals.user._id },
      { createdBy: res.locals.user._id },
      { assetOwner: res.locals.user._id },
    ],
  })
    .populate<{ userID: IUser }>("userID")
    .populate<{ tenantID: ITenant }>("tenantID")
    .populate<{ createdBy: IUser }>("createdBy")
    .populate<{ assetOwner: IUser }>("assetOwner")
    .populate<{ manufactureID: IManufacturer }>("manufactureID")
    .lean();
  if (!gotDoc.length) {
    res.status(404).json({
      status: false,
      message: "Asset doesnt exist",
    });
  } else {
    res.status(200).json({
      status: true,
      message: "Asset fetched",
      data: {
        gotDoc,
      },
    });
  }
};

export const updateAsset = async (req: Request, res: AuthResponse) => {
  const toUpdate = {
    userID: req.body.userID,
    tenantID: req.body.tenantID,
    assetInfo: req.body.assetInfo,
  };
  const updatedAsset = await Asset.findOneAndUpdate(
    {
      _id: req.body.assetID,
      tenantID: res.locals.user.tenantId._id,
    },
    toUpdate,
    { new: true, useFindAndModify: false }
  )
    .populate<{ userID: IUser }>("userID", "tenantID")
    .populate<{ createdBy: IUser }>("createdBy")
    .populate<{ assetOwner: IUser }>("assetOwner");
  if (!updatedAsset) {
    res.status(500).json({
      status: false,
      message: "Asset could not be updated",
    });
    return;
  }

  res.json({
    status: true,
    message: "Successfully updated Asset",
    data: updatedAsset,
  });
};

export const removeAsset = async (req: Request, res: AuthResponse) => {
  const deletedAsset = await Asset.findOneAndDelete({
    _id: req.body.assetID,
    tenantID: res.locals.user.tenantId._id,
  });

  if (!deletedAsset) {
    res.status(404).json({
      status: false,
      message: "Asset doesnt exist",
    });
    return;
  }

  res.json({
    status: true,
    message: "Asset deleted",
    data: deletedAsset,
  });
};

export const toggleAsset = async (req: Request, res: AuthResponse) => {
  const assetID = req.body.assetID;
  const toUpdate = {
    isActive: req.body.isActive === true,
  };
  const toggledAsset = await Asset.findOneAndUpdate(
    { _id: assetID, tenantID: res.locals.user.tenantId._id },
    toUpdate,
    { new: true, useFindAndModify: false }
  );

  if (!toggledAsset) {
    res.status(404).json({
      status: false,
      message: "Asset couldn't be toggled",
    });
    return;
  }

  res.json({
    status: true,
    message: `Sucessfully toggled the asset to ${toggledAsset.isActive}`,
    data: toggledAsset,
  });
};

export const getallAsset = async (req: Request, res: AuthResponse) => {
  const gotDoc = await Asset.find({
    $or: [
      { tenantID: res.locals.user.tenantId._id },
      { userID: res.locals.user._id },
      { createdBy: res.locals.user._id },
      { assetOwner: res.locals.user._id },
    ],
  })
    .populate<{ createdBy: IUser }>({
      path: "createdBy",
      select: { _id: 1, name: 1 },
    })
    .populate<{ modelID: IModel }>({
      path: "modelID",
      populate: { path: "assetClassID", select: { _id: 1, typeName: 1 } },
      select: { _id: 1, modelName: 1 },
    })
    .populate<{ assetOwner: IUser }>("assetOwner")
    .populate<{ userID: IUser }>("userID");

  if (!gotDoc.length) {
    res.status(404).json({
      status: false,
      message: "Asset doesnt exist",
    });
  } else {
    res.status(200).json({
      status: true,
      message: "All assets fetched",
      data: {
        gotDoc,
      },
    });
  }
};

export const registerDrone = async (
  req: Request<{}, {}, { serialNo: string; modelName: string }>,
  res: AuthResponse
) => {
  const drone = await Asset.findOne({ serialNo: req.body.serialNo });
  if (drone) {
    res.status(200).json({
      status: false,
      message: "Drone already registered",
      data: drone,
    });
    return;
  }
  const assetClass = await AssetClass.findOneAndUpdate(
    {
      typeName: "drone",
    },
    {
      $setOnInsert: {
        typeName: "drone",
        createdAt: new Date(),
        createdBy: res.locals.user._id,
      },
    },
    {
      returnOriginal: false,
      upsert: true,
    }
  );
  const manufacturer = await manufacturerModel.findOneAndUpdate(
    {
      name: "unknown",
    },
    {
      $setOnInsert: {
        name: "unknown",
        createdBy: res.locals.user._id,
        tenantID: res.locals.user.tenantId._id,
      },
    },
    {
      returnOriginal: false,
      upsert: true,
    }
  );
  const model = await Model.findOneAndUpdate(
    { modelName: req.body.modelName },
    {
      $setOnInsert: {
        modelName: req.body.modelName,
        assetClassID: assetClass._id,
        manufacturerID: manufacturer._id,
        createdBy: res.locals.user._id,
        tenantID: res.locals.user.tenantId._id,
      },
    },
    {
      returnOriginal: false,
      upsert: true,
    }
  );
  const newDrone = await Asset.create({
    serialNo: req.body.serialNo,
    assetOwner: res.locals.user._id,
    createdBy: res.locals.user._id,
    isActive: true,
    tenantID: res.locals.user.tenantId._id,
    assetName: req.body.modelName,
    modelID: model._id,
    manufactureID: manufacturer._id,
    userID: res.locals.user._id,
    manufactureDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  res.status(201).json({
    status: true,
    message: "Drone registered",
    data: newDrone,
  });
};
