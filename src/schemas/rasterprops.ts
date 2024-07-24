export enum rasterProps {
  POINT_CLOUD = "POINT_CLOUD",
  CESIUM_3D = "CESIUM_3D",
  ORTHO = "ORTHO",
  DEM = "DEM",
  NDWI = "NDWI",
  NDVI = "NDVI",
}

export const defaultRasterSettings = {
  [rasterProps.POINT_CLOUD]: {
    bidx: null,
    bandExp: null,
    colorMap: null,
    resamplingMethod: null,
  },
  [rasterProps.CESIUM_3D]: {
    bidx: null,
    bandExp: null,
    colorMap: null,
    resamplingMethod: null,
  },
  [rasterProps.ORTHO]: {
    bidx: null,
    bandExp: null,
    colorMap: null,
    resamplingMethod: null,
  },
  [rasterProps.DEM]: {
    bidx: "1",
    bandExp: null,
    colorMap: "plasma",
    resamplingMethod: "nearest",
  },
  [rasterProps.NDWI]: {
    bidx: "1%2C2%2C4",
    bandExp: null,
    colorMap: null,
    resamplingMethod: "nearest",
  },
};
