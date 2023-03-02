import { Types } from "mongoose";

export const getAlertsCount = (tenantId: any) => {
  return [
    {
      $match: {
        tenantId: new Types.ObjectId(tenantId),
      },
    },
    {
      $group: {
        _id: "$type",
        count: {
          $sum: 1,
        },
      },
    },
  ];
};
