import mongoose from "mongoose";
import { Server } from "socket.io";
import { ioHandler } from "../src/socket";

class MockSocketServer {
  of(_name: string) {
    return new MockNamespace();
  }
}

class MockNamespace {
  use = jest.fn();
  to(_event: string) {
    return { emit: jest.fn() };
  }
  on = jest.fn();
  in = jest.fn();
  emit = jest.fn();
}

beforeAll(async () => {
  ioHandler(new MockSocketServer() as unknown as Server);
  if (process.env.MONGODB_CONNECTION_STRING == undefined)
    throw new Error("mongodb connection string not defined!");
  await mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
});
afterAll(async () => {
  await mongoose.disconnect();
});

jest.spyOn(global.console, "log").mockImplementation(() => jest.fn());
jest.spyOn(global.console, "info").mockImplementation(() => jest.fn());
jest.mock("node-fetch", () => {
  // eslint-disable-next-line @typescript-eslint/require-await
  return async (args) => {
    return {
      // eslint-disable-next-line @typescript-eslint/require-await
      json: async () => {
        return {
          "1": {
            min: 22,
            max: 44,
          },
        };
      },
    };
  };
});
