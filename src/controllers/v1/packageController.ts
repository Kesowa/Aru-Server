import { Request } from "express";
import Package from "../../models/package";
import { AuthResponse } from "../../utils/interfaceUtils";
import Tenant from "../../models/tenant";
import { deletePublicFileUsingPath } from "../../utils/fileDeleteUtils";
import { copyFiled } from "../../utils/moveFileUtils";
import { IPackage } from "../../schemas/package";
//cretae package
export const createPackage = async (req: Request, res: AuthResponse) => {
  const pac = new Package({
    name: req.body.name,
    bandwidth: req.body.bandwidth,
    storage: req.body.storage,
    duration: req.body.duration,
    userCount: req.body.userCount,
    missionCount: req.body.missionCount,
    layerCount: req.body.layerCount,
    alertCount: req.body.alertCount,
    vodCount: req.body.vodCount,
    clientCount: req.body.clientCount,
    locationCount: req.body.locationCount,
    userGroupCount: req.body.userGroupCount,
    createdBy: res.locals.user._id,
    updatedBy: res.locals.user._id,
    poster: req.body.poster ? req.body.poster : undefined,
  });
  const createDoc = await pac.save();
  if (req.body.poster && createDoc) {
    copyFiled(
      req.body.poster,
      `/images/packagePosters/${req.body.poster.split(/[\\\/]/)[3]}`
    );
  }
  if (createDoc) {
    createDoc.poster = `/images/packagePosters/${
      req.body.poster.split(/[\\\/]/)[3]
    }`;
    await createDoc.save();
  }
  if (createDoc) {
    await deletePublicFileUsingPath(req.body.poster);
  }
  res.status(201).json({
    status: true,
    message: "Package created sucessfully.",
    data: createDoc,
  });
};

//fetch all packages
export const fetchAllPackages = async (req: Request, res: AuthResponse) => {
  const packages = await Package.find();
  res.json({
    status: true,
    message: "Package fetched sucessfully.",
    data: packages,
  });
};

//fetch package by id
export const fetchPackageById = async (req: Request, res: AuthResponse) => {
  const doc = await Package.findById(req.query.id);
  if (doc) {
    return res.json({
      status: true,
      message: "Package fetched sucessfully.",
      data: doc,
    });
  } else {
    return res.status(404).json({
      status: false,
      message: "Package not found.",
    });
  }
};

export const fetchActivePackages = async (req: Request, res: AuthResponse) => {
  const packages = await Package.find({ isActive: true });
  res.json({
    status: true,
    message: "Package fetched sucessfully.",
    data: packages,
  });
};

export const editPackageForId = async (req: Request, res: AuthResponse) => {
  const doc = await Package.findOne({ _id: req.body._id });
  if (doc) {
    let bSavePath;
    if (req.body.poster) {
      bSavePath = doc.poster;
    }
    await Package.updateOne({ _id: req.body._id }, req.body, {
      useFindAndModify: false,
    }).lean();
    const result = await Package.findOne({ _id: req.body._id });
    if (req.body.poster) {
      const a = String(req.body.poster);
      const b = String(bSavePath);
      if (a !== b) {
        copyFiled(
          req.body.poster,
          `/images/packagePosters/${req.body.poster.split(/[\\\/]/)[3]}`
        );
        result.poster = `/images/packagePosters/${
          req.body.poster.split(/[\\\/]/)[3]
        }`;
        await result.save();
        await deletePublicFileUsingPath(req.body.poster);
        await deletePublicFileUsingPath(bSavePath);
      }
    }

    return res.status(200).json({
      status: true,
      message: "Package updated sucessfully.",
      data: result,
    });
  } else {
    return res.status(404).json({
      status: false,
      message: "Data does not exist!.",
    });
  }
};

export const deletePackageForId = async (req: Request, res: AuthResponse) => {
  const doc = await Package.findOne({ _id: req.body._id });
  const tenant = await Tenant.findOne({ _id: res.locals.user.tenantId })
    .populate<{ activePackage: IPackage }>({
      path: "activePackage",
      select: "name",
    })
    .lean();

  if (doc && tenant) {
    if (String(tenant.activePackage.name) !== String(doc.name)) {
      const result = await Package.findOneAndDelete({
        _id: req.body._id,
      }).lean();
      await deletePublicFileUsingPath(doc.poster);
      return res.status(200).json({
        status: true,
        message: "Package deleted sucessfully.",
        data: result,
      });
    } else
      return res.status(404).json({
        status: false,
        message: "Package in use! Can't delete",
      });
  } else {
    return res.status(404).json({
      status: false,
      message: "Data does not exist!.",
    });
  }
};
