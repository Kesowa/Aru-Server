export const APP_URL = "http://localhost:5011";
import request, { SuperAgentTest } from "supertest";

const USER = {
  email: "admin@NKDA.com",
  password: "fsipl1@3$",
}

export const Login = async () => {
  const agent = request.agent(APP_URL);
  await agent
    .post(CurriedUrl("auth")("login"))
    .send(USER)
    .expect(200);

  return agent;
};

export const LoginSuper = Login;

export const Logout = async (agent: SuperAgentTest) => {
  await agent
    .post(CurriedUrl("auth")("logout"))
    .expect(200);
};

export const clearAllClients = async () => {
};

export const CurriedUrl = (base: string) => (relative: string) =>
  `/apis/v1/${base}/${relative}`;
