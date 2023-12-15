import { Namespace, Socket } from "socket.io";
import { SocketUserObject, addUser, droneStat } from "../../utils/socketUtils";
import fs from "fs";
import { Directory } from "../../constants";
import { ExtendedError } from "socket.io/dist/namespace";
import { saveFile } from "../../utils/dataUtils";

const streamers: Array<SocketUserObject> = [];
const receivers: Array<SocketUserObject> = [];

type StreamKey = string;
type FlightPath = {
  features: {
    properties: {
      battery: number;
      timestamp: string;
      compass: number;
      altitude: number;
      velocity: number;
    };
  }[];
};
type FlightLog = {
  features: {
    geometry: {
      coordinates: number[][];
    }[];
  }[];
};
class TelemetryLogger {
  private logFiles: Map<StreamKey, fs.WriteStream>;
  constructor() {
    this.logFiles = new Map();
  }
  private create(streamKey: StreamKey) {
    const tmp_log = `/tmp/${streamKey}.csv`;
    const log_stream = fs.createWriteStream(tmp_log, { flags: "a" });
    // log_stream.write(
    //   "index, location.lat, location.long, battery, timestamp, compass, altitude, velocity\n" // Add CSV headers
    // );
    this.logFiles.set(streamKey, log_stream);
    console.info("Temp log created for streamkey", streamKey);
    return log_stream;
  }
  private write(logFile: fs.WriteStream, data: droneStat) {
    logFile.write(
      `index, location.lat, location.long, battery, timestamp, compass, altitude, velocity\n
      ${data.index}, ${data.location.long}, ${data.location.lat}, ${data.battery}, ${data.timestamp}, ${data.compass}, ${data.altitude}, ${data.velocity}\n`
    );
  }
  public log(streamKey: StreamKey, data: droneStat) {
    let logFile: fs.WriteStream;
    const tmp = this.logFiles.get(streamKey);
    if (tmp) {
      logFile = tmp;
    } else {
      logFile = this.create(streamKey);
    }
    this.write(logFile, data);
  }
  private async convert(
    streamKey: StreamKey
  ): Promise<{ flightLog: FlightLog; flightPath: FlightPath }> {
    const log_file = await fs.promises.readFile(`/tmp/${streamKey}.csv`, {
      encoding: "utf-8",
    });
    const log_lines = log_file.split("\n");
    const flightLog: FlightLog = {
      features: [
        {
          geometry: [
            {
              coordinates: [],
            },
          ],
        },
      ],
    };
    const flightPath: FlightPath = {
      features: [],
    };
    // log_lines.shift();
    log_lines.pop(); // Remove trailing newline
    for (let index = 0; index < log_lines.length; index++) {
      const line = log_lines[index];
      const [_, long, lat, battery, timestamp, compass, altitude, velocity] =
        line.split(",");
      const num_index = Number(index);
      const properties = {
        battery: Number(battery),
        timestamp: timestamp,
        compass: Number(compass),
        altitude: Number(altitude),
        velocity: Number(velocity),
      };
      const coordinates = [Number(lat), Number(long)];
      flightLog.features[0].geometry[0].coordinates[num_index] = coordinates;
      flightPath.features[num_index] = { properties };
    }
    return { flightLog, flightPath };
  }
  public async end(streamKey: StreamKey) {
    const log_file = this.logFiles.get(streamKey);
    if (!log_file) return;
    log_file.end();
    const { flightLog, flightPath } = await this.convert(streamKey);
    await saveFile(
      Directory.FLIGHT_LOGS,
      `${streamKey}.geojson`,
      JSON.stringify(flightLog)
    );
    await saveFile(
      Directory.FLIGHT_LOGS,
      `Path_${streamKey}.geojson`,
      JSON.stringify(flightPath)
    );
    // await fs.promises.copyFile(
    //   `/tmp/${streamKey}.csv`,
    //   DirPath(Directory.FLIGHT_LOGS, `${streamKey}.csv`)
    // );
    await fs.promises.rm(`/tmp/${streamKey}.csv`);
    this.logFiles.delete(streamKey);
  }
}

const OneLoggerToRuleThemAll = new TelemetryLogger();

export let stat: droneStat;
export const droneLocationIoController = (io: Namespace) => {
  //Auth middleware
  io.use(Auth);

  //Join Room By streamKey
  io.use(joinRoomByStreamKey);

  io.on("connect", (socket: Socket) => {
    socket.on("DRONE_STAT", (droneStatData: droneStat) => {
      const streamKey = droneStatData?.streamKey;
      if (streamKey) {
        OneLoggerToRuleThemAll.log(streamKey, droneStatData);
        stat = { ...droneStatData };
        io.to(droneStatData.streamKey).emit("TELEMETRY", droneStatData);
      }
    });
    socket.on("GEN_LOG", () => {
      const streamkey: string =
        typeof socket.handshake.query.streamKey == "string"
          ? socket.handshake.query.streamKey
          : socket.handshake.query.streamKey[0];
      void OneLoggerToRuleThemAll.end(streamkey).then().catch(console.error);
      console.log("generating flight logs", streamkey);
    });
  });
};

const Auth = (socket: Socket, next: (err?: ExtendedError) => void) => {
  //console.log(socket.handshake.query);
  if (socket.handshake.query && socket.handshake.query.token === "streamer") {
    //  console.log('Authenticated');
    const usertype =
      socket.handshake.query.type === "streamer" ? "streamer" : "receiver";
    if (usertype === "streamer") {
      addUser(streamers, { id: socket.id });
    } else {
      addUser(receivers, { id: socket.id });
    }
    //   console.log(streamers,receivers)
    next();
  } else {
    next(new Error("Auth failed"));
  }
};

const joinRoomByStreamKey = (socket: Socket, next: Function) => {
  const streamKey: string =
    typeof socket.handshake.query.streamKey == "string"
      ? socket.handshake.query.streamKey
      : socket.handshake.query.streamKey[0];
  if (streamKey) {
    void socket.join(streamKey);
    console.log(
      `streamKey : ${streamKey} joined stream key specific Socket with sid: ${socket.id}`
    );
    next();
  } else {
    next(new Error("No stream Key passed"));
  }
  next();
};
