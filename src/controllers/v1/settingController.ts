import {
  API_SERVER,
  LIVE_URL,
  RTMP_PUBLIC,
  TITILER_PUBLIC,
} from "../../constants";

export const getSettings = () => {
  return {
    RTMP_URL: RTMP_PUBLIC,
    STREAM_URL: LIVE_URL,
    COG_URL: TITILER_PUBLIC,
    SERVER_URL: API_SERVER,
  };
};
