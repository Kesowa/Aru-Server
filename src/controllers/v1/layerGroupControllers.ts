import { Request } from "express";
import { AuthResponse } from "../../utils/interfaceUtils";
import LayerGroup from "../../models/layerGroup";
import Layer from "../../models/layer";
import Tenant from "../../models/tenant";
import layerFiles from "../../models/layerFiles";
import { deletePublicFileUsingPath } from "../../utils/fileDeleteUtils";
import { ILayer } from "../../schemas/layer";

export const createLayerGroup = async (req: Request, res: AuthResponse) => {
  {
    const doc = new LayerGroup({
      name: req.body.name,
      createdBy: res.locals.user._id,
      tenantId: res.locals.user.tenantId,
      layers: req.body.layers,
    });
    const saveDoc = await doc.save();
    const layeraddGroups = await Layer.updateMany(
      {
        _id: { $in: req.body.layers },
        tenantId: res.locals.user.tenantId,
      },
      {
        layerGroupId: saveDoc._id,
      }
    );
    const data = await LayerGroup.find({ _id: saveDoc._id }).populate<{
      layer: ILayer;
    }>({ path: "layers", populate: { path: "layerGroupId" } });

    res.status(201).json({
      status: true,
      message: "Created a new layerGroup!",
      data: data,
    });
  }
};

export const editLayerGroup = async (req: Request, res: AuthResponse) => {
  {
    const doc = await LayerGroup.exists({
      _id: req.body._id,
      tenantId: res.locals.user.tenantId._id,
    });

    if (doc) {
      // Remove the layers from their existing groups
      for (const layerId of req.body.layers) {
        const layer = await Layer.findById(layerId);
        await LayerGroup.findOneAndUpdate(
          {
            _id: layer.layerGroupId,
            tenantId: res.locals.user.tenantId._id,
          },
          {
            $pull: {
              layers: layer._id,
            },
          }
        );
      }
      // Update layers
      await Layer.updateMany(
        {
          _id: { $in: req.body.layers },
          tenantId: res.locals.user.tenantId._id,
        },
        {
          layerGroupId: doc._id,
        }
      );
      // Update the new groups to which layers to be added
      const updatedLayerGroup = await LayerGroup.findOneAndUpdate(
        {
          _id: doc._id,
          tenantId: res.locals.user.tenantId._id,
        },
        {
          $addToSet: {
            layers: req.body.layers,
          },
          [req.body.name && "name"]: req.body.name,
        },
        {
          new: true,
        }
      );
      return res.status(200).json({
        status: true,
        message: "LayerGroup Updated Successfully!",
        data: updatedLayerGroup,
      });
    } else
      return res.status(400).json({
        status: false,
        message: "LayerGroup does not matched!",
      });
  }
};

export const fetchLayergroup = async (req: Request, res: AuthResponse) => {
  {
    const doc = req.body._id
      ? await LayerGroup.find({
          _id: req.body._id,
          tenantId: res.locals.user.tenantId._id,
        })
      : await LayerGroup.find({ tenantId: res.locals.user.tenantId._id });
    if (doc.length) {
      return res.status(200).json({
        status: true,
        message: "LayerGroup fetched Successfully!",
        data: doc,
      });
    } else
      return res.status(400).json({
        status: false,
        message: "LayerGroup does not matched!",
      });
  }
};

export const deleteLayerGroup = async (req: Request, res: AuthResponse) => {
  {
    const doc = await LayerGroup.findOneAndDelete({
      _id: req.query._id,
      tenantId: res.locals.user.tenantId._id,
    });
    if (doc) {
      for (let i = 0; i < doc.layers.length; i++) {
        // await Layer.deleteMany({ layerGroupId : Types.ObjectId(req.query._id) ,tenantId: Types.ObjectId(res.locals.user.tenantId._id) });
        const d = await Layer.findOne({
          _id: doc.layers[i],
          tenantId: res.locals.user.tenantId._id,
        });
        if (d) {
          const conf = await deletePublicFileUsingPath(d.layerpath);
          if (conf) {
            req.log.info("Files deleted");
          } else {
            req.log.warn("Files does not exist");
          }
          const data = await d.delete();
          const tenant = await Tenant.findOne({
            _id: res.locals.user.tenantId,
          });
          if (tenant.actualLayerCount) {
            tenant.actualLayerCount = Number(tenant.actualLayerCount) - 1;
            await tenant.save();
          }
          const layerFileData = await layerFiles.find({
            layerId: doc.layers[i],
            tenantId: res.locals.user.tenantId._id,
          });
          for (const f of layerFileData) {
            await f.delete();
          }
          // if (data) {
          //   res.status(200).json({
          //     status: true,
          //     message: "Layer successfully deleted",
          //     data: data,
          //   });
          // }
        }
      }
      return res.status(200).json({
        status: true,
        message: "LayerGroup deleted Successfully!",
        data: doc,
      });
    } else {
      return res.status(200).json({
        status: true,
        message: "LayerGroup does not exist!",
      });
    }
  }
};

export const deleteLayerId = async (req: Request, res: AuthResponse) => {
  {
    const doc = await LayerGroup.exists({
      _id: req.body._id,
      tenantId: res.locals.user.tenantId,
    });
    if (doc) {
      const docExist = await LayerGroup.exists({
        _id: req.body._id,
        layers: { $in: req.body.layers },
        tenantId: res.locals.user.tenantId,
      });
      if (docExist) {
        const updatedLayerGroup = await LayerGroup.updateOne(
          {
            _id: req.body._id,
            layers: { $in: req.body.layers },
            tenantId: res.locals.user.tenantId,
          },
          {
            $pullAll: {
              layers: req.body.layers,
            },
          }
        );
        const updatedLayers = await Layer.updateMany(
          {
            _id: { $in: req.body.layers },
            layerGroupId: docExist._id,
            tenantId: res.locals.user.tenantId._id,
          },
          {
            layerGroupId: null,
          }
        );
        return res.status(200).json({
          status: true,
          message: "LayersId deleted Successfully!",
        });
      } else
        return res.status(400).json({
          status: false,
          message: "LayerId does not matched!",
        });
    } else
      return res.status(400).json({
        status: false,
        message: "LayerGroup does not matched!",
      });
  }
};
