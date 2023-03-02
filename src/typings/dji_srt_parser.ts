declare module "dji_srt_parser" {
  interface AllFunctions {
    toGeoJSON(raw, waypoints, elevationOffset): string;
  }
  export default function (
    file: string | string[],
    fileName: string | string[],
    isPreparedData?: boolean
  ): AllFunctions;
}
