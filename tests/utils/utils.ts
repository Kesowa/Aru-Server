export const APP_URL = "http://localhost:5011";
export const MONGODB_CONNECTION_STRING = "mongodb://localhost:27017/test";
import request, { SuperAgentTest } from "supertest";
import mongoose, { Mongoose } from "mongoose";

const USER = {
  email: "admin@NKDA.com",
  password: "fsipl1@3$",
}

const SUPER_USER = {
  email: "admin@kesowa.com",
  password: "fsipl1@3$",
}

async function login(user: { email: string, password: string }) {
  const agent = request.agent(APP_URL);
  await agent
    .post(CurriedUrl("auth")("login"))
    .send(user)
    .expect(200);

  return agent;
};

export async function Login() {
  return await login(USER);
};

export async function LoginSuper() {
  return await login(SUPER_USER);
};

export const Logout = async (agent: SuperAgentTest) => {
  await agent
    .post(CurriedUrl("auth")("logout"))
    .expect(200);
};

export const clearAllClients = async () => {
};

export const CurriedUrl = (base: string) => (relative: string) =>
  `/apis/v1/${base}/${relative}`;

export async function ConnectDB() {
  const mongoClient = await mongoose.connect(MONGODB_CONNECTION_STRING);
  return mongoClient;
}

export async function DisconnectDB(mongoClient: Mongoose) {
  await mongoClient.disconnect();
}