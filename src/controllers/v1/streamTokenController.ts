import { Request } from "express";
import { streamKeyModel } from "../../models/streamKey";
import { Types } from "mongoose";
import { notificationSocket } from "../../socket";
import { AuthResponse } from "../../utils/interfaceUtils";
import { WiproInterface } from "../../utils/wipro";
import {
  ARU_INSTANCE,
  Instance,
  ACCESS_KEY,
  AWS_SECRET_KEY,
  AWS_MEDIACONVERT_ENDPOINT,
} from "../../constants";
import mongoose from "mongoose";
//import dotenv config
import { v4 as uuidv4 } from "uuid";
import AWS from "aws-sdk";

export const waitForIdleState_channelCreation = (resolve, channelId) => {
  const medialive = new AWS.MediaLive();
  medialive.describeChannel(
    { ChannelId: channelId },
    (describeErr, describeData) => {
      if (describeErr) {
        console.log(describeErr, describeErr.stack);
        resolve("Error: " + describeErr.stack);
      } else {
        console.log("Channel state:", describeData.State);
        if (describeData.State === "IDLE") {
          // Start the channel once it is in the IDLE state
          medialive.startChannel(
            { ChannelId: channelId },
            (startErr, startData) => {
              if (startErr) {
                console.log(startErr, startErr.stack);
                resolve("Error: " + startErr.stack);
              } else {
                console.log("Channel started successfully:", startData);
              }
            }
          );
          setTimeout(
            () => waitForIdleState_channelCreation(resolve, channelId),
            3000
          );
        } else if (describeData.State === "RUNNING") {
          // Channel is already running, exit the function
          console.log("Channel is running");
          resolve("SUCCESS");
        } else {
          // Poll every 5 seconds until the channel is in the IDLE state
          setTimeout(
            () => waitForIdleState_channelCreation(resolve, channelId),
            3000
          );
        }
      }
    }
  );
};

export const channelCreationAWS = async (
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
  res: AuthResponse
) => {
  //  const tenantID = String(res.locals.user.tenantId._id);
  const { missionID, flightID, assetID, locationID } = req.body;
  const token = generateToken(missionID, flightID, locationID, assetID);
  notificationSocket.emit("Creating Channel", token);
  console.log(typeof token);

  AWS.config.update({
    region: "ap-south-1",
    accessKeyId: ACCESS_KEY,
    secretAccessKey: AWS_SECRET_KEY,
  });

  let uuid = uuidv4();
  const medialive = new AWS.MediaLive();
  console.log(medialive);
  const inputConfig = {
    Name: "input_" + token,
    Destinations: [
      {
        StreamName: "test-stream-" + uuid,
      },
    ],
    InputSecurityGroups: ["7573707"],
    Type: "RTMP_PUSH",
  };

  medialive.createInput(inputConfig, async function (err, data) {
    if (err) {
      console.error(err);
    } else {
      console.log(`Input created with ID '${data.Input.Id}'`);
      // Define the channel configuration
      console.log(data.Input.Destinations);
      const streamURLRTMP = data.Input.Destinations[0].Url;
      // convert to string
      uuid = uuid.toString();

      const channelConfig_ = {
        Name: "channel_" + uuid,
        InputAttachments: [
          {
            InputAttachmentName: "input_" + data.Input.Id,
            InputId: "",
            InputSettings: {
              SourceEndBehavior: "CONTINUE",
              InputFilter: "AUTO",
              FilterStrength: 1,
              DeblockFilter: "DISABLED",
              DenoiseFilter: "DISABLED",
              Smpte2038DataPreference: "IGNORE",
            },
          },
        ],
        InputSpecification: {
          Codec: "AVC",
          Resolution: "SD",
          MaximumBitrate: "MAX_10_MBPS",
        },
        Destinations: [
          {
            Settings: [
              {
                Url:
                  "s3://bucketmediaconvertdemo" +
                  "/vod/" +
                  uuid +
                  "/" +
                  "index",
              },
            ],
            Id: "destination1",
          },
        ],
        EncoderSettings: {
          AudioDescriptions: [],
          OutputGroups: [
            {
              Name: "TN2224",
              OutputGroupSettings: {
                HlsGroupSettings: {
                  CaptionLanguageSetting: "OMIT",
                  HlsCdnSettings: {
                    HlsBasicPutSettings: {
                      NumRetries: 5,
                      ConnectionRetryInterval: 30,
                      RestartDelay: 5,
                      FilecacheDuration: 300,
                    },
                  },
                  InputLossAction: "EMIT_OUTPUT",
                  ManifestCompression: "NONE",
                  Destination: {
                    DestinationRefId: "destination1",
                  },
                  IvInManifest: "INCLUDE",
                  IvSource: "FOLLOWS_SEGMENT_NUMBER",
                  ClientCache: "ENABLED",
                  TsFileMode: "SEGMENTED_FILES",
                  ManifestDurationFormat: "FLOATING_POINT",
                  SegmentationMode: "USE_SEGMENT_DURATION",
                  OutputSelection: "MANIFESTS_AND_SEGMENTS",
                  StreamInfResolution: "INCLUDE",
                  IndexNSegments: 10,
                  ProgramDateTime: "INCLUDE",
                  ProgramDateTimePeriod: 600,
                  KeepSegments: 21,
                  SegmentLength: 6,
                  TimedMetadataId3Frame: "PRIV",
                  TimedMetadataId3Period: 10,
                  CodecSpecification: "RFC_4281",
                  DirectoryStructure: "SINGLE_DIRECTORY",
                  SegmentsPerSubdirectory: 10000,
                  Mode: "LIVE",
                  IFrameOnlyPlaylists: "DISABLED",
                  ProgramDateTimeClock: "INITIALIZE_FROM_OUTPUT_TIMECODE",
                  RedundantManifest: "DISABLED",
                  IncompleteSegmentBehavior: "AUTO",
                  DiscontinuityTags: "INSERT",
                  HlsId3SegmentTagging: "DISABLED",
                },
              },
              Outputs: [
                {
                  OutputSettings: {
                    HlsOutputSettings: {
                      NameModifier: "_1280x720_5000k",
                      HlsSettings: {
                        StandardHlsSettings: {
                          M3u8Settings: {
                            AudioPids: "492-498",
                            EcmPid: "8182",
                            PcrControl: "PCR_EVERY_PES_PACKET",
                            PmtPid: "480",
                            Scte35Pid: "500",
                            Scte35Behavior: "NO_PASSTHROUGH",
                            TimedMetadataBehavior: "NO_PASSTHROUGH",
                            VideoPid: "481",
                            ProgramNum: 1,
                            AudioFramesPerPes: 4,
                            TimedMetadataPid: "502",
                            NielsenId3Behavior: "NO_PASSTHROUGH",
                          },
                          AudioRenditionSets: "program_audio",
                        },
                      },
                      H265PackagingType: "HVC1",
                    },
                  },
                  VideoDescriptionName: "video_1280_720",
                },
              ],
            },
          ],
          VideoDescriptions: [
            {
              Name: "video_1280_720",
              CodecSettings: {
                H264Settings: {
                  ColorMetadata: "INSERT",
                  AdaptiveQuantization: "HIGH",
                  Bitrate: 1200000,
                  EntropyEncoding: "CABAC",
                  FlickerAq: "ENABLED",
                  FramerateControl: "SPECIFIED",
                  FramerateNumerator: 30000,
                  FramerateDenominator: 1001,
                  GopBReference: "ENABLED",
                  GopNumBFrames: 3,
                  GopSize: 60,
                  GopSizeUnits: "FRAMES",
                  Level: "H264_LEVEL_4_1",
                  LookAheadRateControl: "HIGH",
                  ParControl: "INITIALIZE_FROM_SOURCE",
                  Profile: "MAIN",
                  RateControlMode: "CBR",
                  Syntax: "DEFAULT",
                  SceneChangeDetect: "ENABLED",
                  SpatialAq: "ENABLED",
                  TemporalAq: "ENABLED",
                  AfdSignaling: "NONE",
                  ScanType: "PROGRESSIVE",
                  ForceFieldPictures: "DISABLED",
                  GopClosedCadence: 1,
                  NumRefFrames: 1,
                  SubgopLength: "FIXED",
                  TimecodeInsertion: "DISABLED",
                },
              },
              Height: 720,
              ScalingBehavior: "DEFAULT",
              Width: 1280,
              Sharpness: 50,
              RespondToAfd: "NONE",
            },
          ],
          TimecodeConfig: {
            Source: "SYSTEMCLOCK",
          },
        },
        LogLevel: "DISABLED",
        ChannelClass: "SINGLE_PIPELINE",
      };

      channelConfig_.InputAttachments[0].InputId = data.Input.Id;
      const inputId = data.Input.Id;
      // console.log(channelConfig_.InputAttachments[0])
      medialive.createChannel(channelConfig_, async function (err, data) {
        if (err) {
          console.error(err);
        } else {
          console.log(
            `Channel created with name '${data.Channel.Name}' and ID '${data.Channel.Id}'`
          );
          // Fetch the stream URL and key
          const streamURL = data.Channel.Destinations[0].Settings[0].Url;
          const streamKey = data.Channel.Id;
          console.log(`Stream URL: ${streamURL}`);
          console.log(`Stream key: ${streamKey}`);
          //concatenate streamURL and key

          const message = await new Promise((resolve) => {
            waitForIdleState_channelCreation(resolve, data.Channel.Id);
          });

          //check if message is Error message
          console.log(message);
          console.log(typeof message);

          const newStream = new streamKeyModel({
            isActive: false,
            pStatus: false,
            createdBy: new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"),
            createdAt: new Date(),
            streamKey: token,
            tenantID: new mongoose.Types.ObjectId("602c6d8d1e00c26d7a6a0c6e"),
            assetID: assetID,
            missionID: missionID,
            flightID: flightID,
            locationID: locationID,
            inputID: inputId,
            channelID: data.Channel.Id,
            uuid: uuid,
          });

          const dbSavePromise = await newStream.save();

          const response: streamResponse = {
            token: token,
            flightID: flightID,
            missionID: missionID,
            message: "Sucessfully generated a token",
            status: 200,
            streamUrl: streamURLRTMP,
          };

          res.status(200).json(response);
        }
      });
    }
  });
};

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
  res: AuthResponse
) => {
  {
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

    const dbSavePromise = await newStreamKey.save();
    const resp: streamResponse = {
      token: token,
      flightID: flightID,
      missionID: missionID,
      message: "Sucessfully generated a token",
      status: 200,
      streamUrl: "",
    };
    req.log.info(
      `${res.locals.user.name} generated stream key with token ${token}`
    );
    return res.json(resp);
  }
};

export const streamTokenValidator = async (req: Request, res: AuthResponse) => {
  {
    //name is the streamKey which we recieve from the rtmp server
    const streamKey = await streamKeyModel.findOneAndUpdate(
      {
        streamKey: req.body.name,
      },
      {
        isActive: true,
      }
    );
    if (streamKey) {
      const message = `token[${req.body.name}] is authorised`;
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
  }
};

export const getActiveStreams = async (req: Request, res: AuthResponse) => {
  {
    const tenantId = res.locals.user.tenantId._id;
    // if (tenantId != String(res.locals.user.tenantId._id)) {
    //     res.status(401).json({
    //         message:"mismatced the tenantId with user's tenantId"
    //     });
    //     return;
    // }
    const activeStreams = await streamKeyModel.find(
      { tenantID: tenantId, isActive: true },
      "streamKey createdAt createdBy missionID flightID"
    );
    if (activeStreams) {
      res.status(200).send(activeStreams);
    } else {
      res.sendStatus(404);
    }
  }
};

export const getActiveStreamByFlightId = async (
  req: Request,
  res: AuthResponse
) => {
  {
    const flightID = new Types.ObjectId(String(req.query.flightID));
    const activeStream = await streamKeyModel.find(
      { flightID: flightID, tenantID: res.locals.user.tenantId._id },
      "streamKey createdAt createdBy missionID flightID"
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
  }
};

//make deleteinput function async, to delete a input of aws media live
export const deleteInput = async (inputId: string) => {
  console.log("inputId ", inputId);
  const params = {
    InputId: inputId,
  };

  AWS.config.update({
    region: "ap-south-1",
    accessKeyId: ACCESS_KEY,
    secretAccessKey: AWS_SECRET_KEY,
  });

  const medialive = new AWS.MediaLive();

  try {
    const data = await medialive.deleteInput(params).promise();
    return "SUCCESS";
  } catch (err) {
    console.log("FAIL ", err);
    return "FAIL";
  }
};

export const deleteChannel = async (channelID: string) => {
  console.log("channelID ", channelID);
  const params = {
    ChannelId: channelID,
  };

  const medialive = new AWS.MediaLive();

  try {
    const data = await medialive.deleteChannel(params).promise();
    return "SUCCESS";
  } catch (err) {
    console.log("FAIL", err);
    return err;
  }
};

export const stopChannel = async (channelID: string) => {
  console.log("channelID ", channelID);
  const params = {
    ChannelId: channelID,
  };

  const medialive = new AWS.MediaLive();

  try {
    const data = await medialive.stopChannel(params).promise();
    return "SUCCESS";
  } catch (err) {
    console.log("FAIL", err);
    return err;
  }
};

export const checkInputState = async (resolve, inputId: string) => {
  try {
    const medialive = new AWS.MediaLive();
    const input = await medialive.describeInput({ InputId: inputId }).promise();
    console.log("Input state:", input.State);

    if (input.State === "DETACHED") {
      // Input is detached, delete the input
      await deleteInput(inputId);
    } else {
      // Input is not detached, wait and check again
      setTimeout(() => checkInputState(resolve, inputId), 3000);
      resolve("SUCCESS");
    }
  } catch (error) {
    console.error(error);
  }
};

export const removeChannelandInput = async (
  req: Request<
    {},
    {},
    {
      name: string;
    }
  >,
  res: AuthResponse
) => {
  const streamKey = String(req.body.name);
  console.log(streamKey);
  const resp = await streamKeyModel.find(
    {
      streamKey: streamKey,
    },
    "inputID channelID uuid"
  );

  await streamKeyModel.deleteOne({
    streamKey: streamKey,
  });

  AWS.config.update({
    region: "ap-south-1",
    accessKeyId: ACCESS_KEY,
    secretAccessKey: AWS_SECRET_KEY,
  });

  if (resp) {
    console.log("in if loop");
    const inputId = resp[0].inputID;
    const channelId = resp[0].channelID;
    // convert String to string

    //stop the channel
    const channelStop = await stopChannel(String(channelId));

    const medialive = new AWS.MediaLive();
    let channelDelete = "";
    const waitForIdleState = async (resolve) => {
      medialive.describeChannel(
        { ChannelId: String(channelId) },
        async (describeErr, describeData) => {
          if (describeErr) {
            console.log(describeErr, describeErr.stack);
          } else {
            console.log("Channel state:", describeData.State);
            if (describeData.State === "IDLE") {
              // delete channel then input.
              channelDelete = await deleteChannel(String(channelId));
              resolve();
            } else {
              // Poll every 5 seconds until the channel is in the IDLE state
              setTimeout(() => waitForIdleState(resolve), 3000);
            }
          }
        }
      );
    };

    await new Promise((resolve) => {
      waitForIdleState(resolve);
    });

    const inputDelete = await new Promise((resolve) =>
      checkInputState(resolve, String(inputId))
    );

    await mediaconvert(req, res, String(resp[0].uuid));

    if (inputDelete == "SUCCESS" && channelDelete == "SUCCESS") {
      res.status(200).json({
        message: "Successfully removed input and channel",
      });
    } else {
      res.status(400).json({
        message: "Failed to remove input and channel",
      });
    }
  } else {
    res.status(401).json({ message: "Stream key doesn't exist" });
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
  res: AuthResponse
) => {
  {
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
  }
};

export const mediaconvert = async (
  req: Request,
  res: AuthResponse,
  uuid: string
) => {
  AWS.config.update({
    accessKeyId: ACCESS_KEY,
    secretAccessKey: AWS_SECRET_KEY,
    region: "ap-south-1",
  });

  const mediaconvert = new AWS.MediaConvert({
    endpoint: AWS_MEDIACONVERT_ENDPOINT,
    region: "ap-south-1",
  });

  const params = {
    Settings: {
      Inputs: [
        {
          TimecodeSource: "ZEROBASED",
          VideoSelector: {},
          FileInput:
            "s3://bucketmediaconvertdemo" + "/vod/" + uuid + "/index.m3u8",
        },
      ],
      OutputGroups: [
        {
          Name: "File Group",
          OutputGroupSettings: {
            Type: "FILE_GROUP_SETTINGS",
            FileGroupSettings: {
              Destination:
                "s3://bucketmediaconvertdemo/" + "vod/" + uuid + "/converted/",
            },
          },
          Outputs: [
            {
              VideoDescription: {
                CodecSettings: {
                  Codec: "H_264",
                  H264Settings: {
                    RateControlMode: "QVBR",
                    SceneChangeDetect: "TRANSITION_DETECTION",
                    MaxBitrate: 96000,
                  },
                },
              },
              ContainerSettings: {
                Container: "MP4",
                Mp4Settings: {},
              },
              NameModifier: "_converted",
              Extension: "mp4",
            },
          ],
        },
      ],
      TimecodeConfig: {
        Source: "ZEROBASED",
      },
    },
    Role: "arn:aws:iam::947803314455:role/service-role/MediaConvert_Default_Role",
  };
  // Submit MediaConvert job
  mediaconvert.createJob(params, function (err, data) {
    if (err) {
      console.log(err, err.stack);
    } else {
      console.log(data);
    }
  });
};

//Helper Functions
export const generateToken = (
  missionID: string,
  flightID: string,
  locationID: string,
  tenantId: string
) => {
  return Buffer.from(
    `${missionID}-${flightID}-${locationID}-${tenantId}`,
    "utf-8"
  )
    .toString("base64")
    .replace(/=/g, "");
};

//Key Generation Interface

interface streamResponse {
  token: String | null;
  message: String;
  status: number;
  flightID: String;
  missionID: String;
  streamUrl: String | null;
}
