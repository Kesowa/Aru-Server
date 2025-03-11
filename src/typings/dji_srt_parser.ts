declare module "dji_srt_parser" {
  interface AllFunctions {
    toGeoJSON(
      raw: boolean,
      waypoints: boolean,
      elevationOffset: boolean,
    ): string;
    metadata(): {
      stats: {
        GPS: {
          LONGITUDE: {
            avg: number;
          };
          LATITUDE: {
            avg: number;
          };
        };
      };
    };
  }
  export default function (
    file: string | string[],
    fileName: string | string[],
    isPreparedData?: boolean,
  ): AllFunctions;
}
