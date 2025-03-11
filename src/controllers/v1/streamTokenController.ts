import { Request } from "express";
import { Types } from "mongoose";

import { ARU_INSTANCE, Instance } from "../../constants";
import { streamKeyModel } from "../../models/streamKey";
import { notificationSocket } from "../../socket";
import { AuthResponse } from "../../utils/interfaceUtils";
import { WiproInterface } from "../../utils/wipro";

export const streamKeyGen = async (
  req: Request<
    {},
    {},
    {
      missionID: string;
      flightID: string;
      assetID: string;
      locationID: string;
    }
  >,
  res: AuthResponse,
) => {
  const tenantId = String(res.locals.user.tenantId._id);
  //extract user, MissionID, FlightId and asset from body of the post request
  const { missionID, flightID, assetID, locationID } = req.body;

  //generate a Stream token by encoding the missionID and flightID in base64
  const token = generateToken(missionID, flightID, locationID, tenantId);

  notificationSocket.emit("STREAM_GENERATED", token);

  //Save the generated token to the database
  const newStreamKey = new streamKeyModel({
    isActive: false,
    pStatus: false,
    createdBy: res.locals.user._id,
    createdAt: new Date(),
    streamKey: token,
    tenantID: res.locals.user.tenantId._id,
    assetID: assetID,
    missionID: missionID,
    flightID: flightID,
    locationID: locationID,
  });

  await newStreamKey.save();
  const resp: StreamResponse = {
    token: token,
    flightID: flightID,
    missionID: missionID,
    message: "Sucessfully generated a token",
    status: 200,
  };
  req.log.info(
    `${res.locals.user.name} generated stream key with token ${token}`,
  );
  return res.json(resp);
};

export const streamTokenValidator = async (req: Request, res: AuthResponse) => {
  //name is the streamKey which we recieve from the rtmp server
  const streamKey = await streamKeyModel.findOneAndUpdate(
    {
      streamKey: req.body.name,
    },
    {
      isActive: true,
    },
  );
  if (streamKey) {
    // const message = `token[${req.body.name}] is authorised`;
    // res.locals.log = logger(req, res, message, 200);
    // #region WIPRO
    if (ARU_INSTANCE == Instance.NKDA) {
      req.log.info("Sending livestream to Wipro...");
      setTimeout(() => {
        void WiproInterface.SendLive(streamKey, req.ip)
          .then((sent) => console.info("Send update to wipro", sent))
          .catch(console.error);
      }, 10_000);
    }
    // #endregion
    return res.sendStatus(200);
  } else {
    const message = `Invalid stream key ${req.body.name}`;
    req.log.error(message);
    return res.sendStatus(401);
  }
};

export const getActiveStreams = async (req: Request, res: AuthResponse) => {
  const tenantId = res.locals.user.tenantId._id;
  const activeStreams = await streamKeyModel.find(
    { tenantID: tenantId, isActive: true },
    "streamKey createdAt createdBy missionID flightID",
  );
  if (activeStreams) {
    res.status(200).send(activeStreams);
  } else {
    res.sendStatus(404);
  }
};

export const getActiveStreamByFlightId = async (
  req: Request,
  res: AuthResponse,
) => {
  const flightID = new Types.ObjectId(String(req.query.flightID));
  const activeStream = await streamKeyModel.find(
    { flightID: flightID, tenantID: res.locals.user.tenantId._id },
    "streamKey createdAt createdBy missionID flightID",
  );
  if (activeStream.length) {
    res.json({
      activeStream: {
        ...activeStream,
      },
    });
  } else {
    res.status(404).json({
      status: false,
      message: "Stream Key doesn't exist",
    });
  }
};

export const removeStreamKey = async (
  req: Request<
    {},
    {},
    {
      name: string;
    }
  >,
  res: AuthResponse,
) => {
  const streamKey = String(req.body.name);
  const resp = await streamKeyModel.findOneAndDelete({
    streamKey: streamKey,
  });
  if (resp) {
    notificationSocket.emit("STREAM_REMOVED", streamKey);
    const message = `stream key[${streamKey}] removed by ${
      res.locals.user.name
    }[${res.locals.user._id.toString()}]`;
    req.log.info(message);
    res.json({
      status: true,
      message: "Successfully removed token",
      data: resp,
    });
  } else {
    const message = `stream key[${streamKey}] doesnt exist`;
    req.log.warn(message);
    res.status(404).json({
      status: false,
      message: "Stream Key doesn't exist",
    });
  }
};

//Helper Functions
export const generateToken = (
  missionID: string,
  flightID: string,
  locationID: string,
  tenantId: string,
) => {
  return Buffer.from(
    `${missionID}-${flightID}-${locationID}-${tenantId}`,
    "utf-8",
  )
    .toString("base64")
    .replace(/=/g, "");
};

//Key Generation Interface

interface StreamResponse {
  token: string | null;
  message: string;
  status: number;
  flightID: string;
  missionID: string;
}
