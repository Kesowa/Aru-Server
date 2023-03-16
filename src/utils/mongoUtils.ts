import mongoose from "mongoose";

export const findSize = async (
  model: mongoose.Model<any & {
    fileSize: number;
    tenantId: mongoose.Types.ObjectId;
  }>,
  tenantId: mongoose.Types.ObjectId
) => {
  const data = await model.aggregate<{ totalSize: number }>([
    {
      $match: { tenantId: tenantId },
    },
    {
      $group: {
        _id: null,
        totalSize: { $sum: "$fileSize" },
      },
    },
  ]);

  if (data[0] != undefined) {
    return data[0].totalSize;
  } else {
    return 0;
  }
};

export const findCount = async (
  model: mongoose.Model<any & { tenantId: mongoose.Types.ObjectId }>,
  tenantId: mongoose.Types.ObjectId,
  extra: Record<string, string> = {}
) => {
  const data = await model.aggregate<{ count: number }>([
    {
      $match: { tenantId: tenantId, ...extra },
    },
    {
      $count: "count",
    },
  ]);

  if (data[0] != undefined) {
    return data[0].count;
  } else {
    return 0;
  }
};
