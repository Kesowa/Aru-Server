import {
  API_SERVER,
  CDN_URL,
  LIVE_URL,
  PUBLIC_SERVER,
  RTMP_PUBLIC,
  TITILER_PUBLIC,
  TITILER_STATIC,
} from "../../constants";

export const getSettings = () => {
  return {
      API_SERVER,
      PUBLIC_SERVER,
      CDN_URL,
      LIVE_URL,
      TITILER_STATIC,
      TITILER_PUBLIC,
      RTMP_PUBLIC,
  };
};
