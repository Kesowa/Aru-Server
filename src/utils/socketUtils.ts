import { Types } from "mongoose";

export interface SocketUserObject {
  id: string;
}

export interface sIDMap {
  client_sid: string;
  AI_sid: string;
  flightID: string;
}

export interface AIRequest {
  threshold: number;
  missionId: Types.ObjectId;
  flightId: Types.ObjectId;
  tenantId: Types.ObjectId;
  assetId: Types.ObjectId;
  locationId: Types.ObjectId;
  time: Date;
  streamKey: string;
}

export interface AIResponse {
  createdBy: Types.ObjectId;
  pcount: number;
  image: string;
  missionId: Types.ObjectId;
  flightId: Types.ObjectId;
  tenantId: Types.ObjectId;
  type: string;
  timeStamp: Date;
  streamKey: string;
}

export interface droneStat {
  index: number;
  flightID: string;
  location: {
    long: number;
    lat: number;
  };
  battery: number;
  timestamp: string;
  streamKey: string;
  compass: number;
  altitude: number;
  velocity: number;
  pitch: number;
  yaw: number;
  roll: number;
}

export interface mavStat {
  location: {
    lat: number;
    long: number;
  };
  battery: number;
  timestamp: Date;
  streamKey: string;
  compass: number;
  altitude: number;
  velocity: number;
}

export const addUser = (
  userArray: Array<SocketUserObject>,
  user: SocketUserObject
) => {
  const u = searchUser(userArray, user.id);
  if (!u) {
    userArray.push(user);
  }
};

export const removeUser = (
  userArray: Array<SocketUserObject>,
  user: SocketUserObject
) => {
  const index = userArray.findIndex((u) => u.id === user.id);
  if (index !== -1) {
    userArray.splice(index, 1);
  }
};

export const searchUser = (userArray: Array<SocketUserObject>, id: string) => {
  const result = userArray.filter((u) => u.id === id);
  const toReturn = result.length > 0 ? result[0] : undefined;
  return toReturn;
};
