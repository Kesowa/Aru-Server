import { Request } from "express";
import assetClassModel from "../../models/assetClass";
import { AuthResponse } from "../../utils/interfaceUtils";
import { notificationSocket } from "../../socket";
import { serverError } from "../../utils/requestHelpers";

export const createAssetClass = async (req: Request, res: AuthResponse) => {
  {
    const assetClass = new assetClassModel({
      typeName: String(req.body.typeName),
      createdAt: req.body.createdAt || new Date(),
      createdBy: res.locals.user._id,
    });
    const dbResp = await assetClass.save();
    notificationSocket
      .to(String(res.locals.user.tenantId._id))
      .emit("CREATE_ASSET", dbResp);
    if (dbResp) {
      return res.status(201).json({
        status: true,
        message: "Sucessfully created asset class",
        data: dbResp,
      });
    }
    return serverError(res);
  }
};

export const getAssetClass = async (req: Request, res: AuthResponse) => {
  {
    const dbResp = await assetClassModel.find().lean();
    res.json({
      status: true,
      message: "Sucessfully fetched Asset classes",
      data: dbResp,
    });
  }
};

export const updateAssetClass = async (req: Request, res: AuthResponse) => {
  {
    const docFound = await assetClassModel.findById(req.body.id);
    if (docFound) {
      docFound.typeName = req.body.typeName;
      const savedDoc = await docFound.save();
      notificationSocket
        .to(String(res.locals.user.tenantId._id))
        .emit("UPDATE_ASSET", savedDoc);
      res.json({
        status: true,
        message: "Sucessfully updated the assetClass",
        data: savedDoc,
      });
    } else {
      res.status(404).json({
        status: false,
        message: "Asset class doesnt exist",
      });
    }
  }
};

export const removeAssetClass = async (req: Request, res: AuthResponse) => {
  {
    const deletedDoc = await assetClassModel.findByIdAndDelete(req.body.id);
    if (deletedDoc) {
      notificationSocket
        .to(String(res.locals.user.tenantId._id))
        .emit("DELETE_ASSET", deletedDoc);
      res.json({
        status: true,
        message: "Doc successfully deleted",
      });
    } else {
      res.status(404).json({
        status: false,
        message: "Asset class doesnt exist",
      });
    }
  }
};

export const fetchAssetbyId = async (req: Request, res: AuthResponse) => {
  {
    const gotdoc = await assetClassModel.findById(req.query._id);
    if (gotdoc) {
      res.json({
        status: true,
        message: "Asset fetched sucessfully.",
        data: gotdoc,
      });
    } else {
      res.status(404).json({
        status: false,
        message: "Could not fetch",
      });
    }
  }
};
