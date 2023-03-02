import { Request } from "express";
import { AuthResponse } from "../../utils/interfaceUtils";
import VectorProps from "../../models/vectorprops";

export const createVectorProps = async (req: Request, res: AuthResponse) => {
  {
    const { name, type } = req.body;
    const vectorProps = new VectorProps({
      name,
      type,
      createdBy: res.locals.user._id,
      updatedBy: res.locals.user._id,
    });
    const data = await vectorProps.save();
    res.status(201).json({
      status: true,
      message: "New vectorProps created",
      data: data,
    });
  }
};

export const getAllVectorProps = async (req: Request, res: AuthResponse) => {
  {
    const vectorData = await VectorProps.find(
      {},
      {
        name: 1,
        type: 1,
      }
    ).lean();
    if (vectorData) {
      res.json({
        status: true,
        message: "vector data fetched successfully",
        data: vectorData,
      });
    } else {
      res.json({
        status: false,
        message: "Wrong Input",
      });
    }
  }
};
