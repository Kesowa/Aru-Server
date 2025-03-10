import { Request } from "express";
import { AuthResponse } from "../../utils/interfaceUtils";
import manufacturerModel from "../../models/manufacturer";
import { IUser } from "../../schemas/user";

export const createManufacturer = async (req: Request, res: AuthResponse) => {
  const newManufacturerModel = new manufacturerModel({
    name: req.body.name,
    address: req.body.address,
    nationality: req.body.nationality,
    website: req.body.website,
    contacts: req.body.contacts,
    createdAt: new Date(),
    createdBy: res.locals.user._id,
    tenantID: res.locals.user.tenantId,
  });

  const savePromise = await newManufacturerModel.save();

  if (savePromise) {
    res.status(201).json({
      status: true,
      message: "Successfully saved the Manufacturer",
      data: savePromise,
    });
  }
};
export const getManufacturer = async (req: Request, res: AuthResponse) => {
  const dbResp = await manufacturerModel
    .find({ tenantID: res.locals.user.tenantId._id })
    .populate<{ createdBy: IUser }>("createdBy")
    .lean();
  res.json({
    status: true,
    message: "Manufacturers fetched sucessfully.",
    data: dbResp,
  });
};

export const updateManufacturer = async (req: Request, res: AuthResponse) => {
  const foundModel = await manufacturerModel.findOneAndUpdate(
    {
      _id: req.body.id,
      tenantID: res.locals.user.tenantId._id,
    },
    req.body.update,
    { new: true }
  );
  if (foundModel === null) {
    res.status(404).json({
      status: false,
      message: "Manufacturer doesnt exist",
    });
  } else {
    res.json({
      status: true,
      message: "Manufacturer updated sucessfully.",
      data: foundModel,
    });
  }
};

export const removeManufacturer = async (req: Request, res: AuthResponse) => {
  const deletedDoc = await manufacturerModel.findOneAndDelete({
    _id: req.body.id,
    tenantID: res.locals.user.tenantId._id,
  });
  if (deletedDoc) {
    res.json({
      status: true,
      message: "Manufacturer successfully deleted",
    });
  } else {
    res.status(404).json({
      status: false,
      message: "Manufacturer class doesnt exist",
    });
  }
};

export const fetchManufacturerbyId = async (
  req: Request,
  res: AuthResponse
) => {
  const gotdoc = await manufacturerModel
    .find({ _id: req.query._id, tenantID: res.locals.user.tenantId._id })
    .populate<{ createdBy: IUser }>("createdBy");
  if (gotdoc.length) {
    res.json({
      status: true,
      message: "Manufacturer fetched sucessfully.",
      data: gotdoc,
    });
  } else {
    res.status(404).json({
      status: false,
      message: "Could not fetch",
    });
  }
};
