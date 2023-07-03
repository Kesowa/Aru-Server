const thermalStatusEnum = <const>["failed", "converted", "null"];
export const thermalStatus = {
  default: "null",
  enum: thermalStatusEnum,
  type: String,
};
export type thermalStatusType = typeof thermalStatusEnum[number];
