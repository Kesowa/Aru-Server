import { Request, Router } from "express";
import openApi from "./openApi";
import { Types } from "ts-openapi";
import { AuthResponse } from "../../utils/interfaceUtils";
import User from "../../models/user";
import { UserType } from "../../schemas/user";
import Mission from "../../models/mission";
import { MissionType} from "../../schemas/mission";
import Tenant from "../../models/tenant";
import ObjectsToCsv from "objects-to-csv";
import path from "path";
import { DirPath, Directory } from "../../constants";
import { createDirIfNotExists } from "../../utils/fileUtils";

const clientApi = Router();

clientApi.get("/", async (req: Request<null, {}, null, {
    clientId?: string,
    email?: string,
    generateCSV?: boolean,
    missionStatus?: string,
    limit: number,
    offset: number,
    orderBy: string,
    asc: boolean,
    populate: string[],
  }>, res: AuthResponse) => {
    const { clientId, email, generateCSV, missionStatus, limit, offset, orderBy, asc, populate } = req.query;
    const data = await User.find(
      {
        tenantId: res.locals.user.tenantId._id,
        [clientId && "_id"]: clientId,
        userType: "tenant-client",
        [email && "email"]: email
      }, {}, {
        sort: {
          [orderBy]: asc ? "asc" : "desc",
        }
      })
      .skip(offset)
      .limit(limit)
      .populate(populate)
      .lean();
    
    const tenant = await Tenant.findById(res.locals.user.tenantId._id, {
      actualClientCount: 1,
    });

    const resp:any = {
        data,
        pagination: {
            limit,
            offset,
            count: data.length
        },
        total: tenant.actualClientCount
    };

    if(clientId) {
        const missions = await Mission.find({
            clientId: clientId,
            tenantId: res.locals.user.tenantId,
            [missionStatus && "status"]: missionStatus
          });
        resp.missions = missions;
    }

    if(generateCSV) {
        const savedResult: any = [];
        const ws = DirPath(Directory.CSV);
        await createDirIfNotExists(ws, req.log);
        for (let i = 0; i < data.length; i++) {
            const d = {
            name: data[i].name,
            email: data[i].email,
            phoneNumber: data[i].phoneNo,
            };
            savedResult.push(d);
        }
        const csv = new ObjectsToCsv(savedResult);
        const file = path.join(ws, `${Math.floor(Math.random() * 62000000)}.csv`);
        await csv.toDisk(file);
        resp.csvPath = "/" + file.split(/[\\\/]/).slice(8).join("/");
    }
    
    res.json(resp);
  });

openApi.addPath("/client", {
  get: {
    summary: "Get client data",
    description: "This operation retrives client information",
    operationId: "GetClient",
    requestSchema: {
      query: {
        clientId: Types.String(),
        email: Types.String(),
        generateCSV: Types.Boolean(),
        missionStatus: Types.String(),
        limit: Types.Integer({ minValue: 0, maxValue: 100, default: 10, required: true }),
        offset: Types.Integer({ minValue: 0, default: 0, required: true }),
        orderBy: Types.String({ default: "createdAt", required: true }),
        asc: Types.Boolean({ default: false, required: true }),
        populate: Types.Array({ arrayType: Types.String() }),
      }
    },
    tags: ["Client API"],
    responses: {
      200: openApi.declareSchema("successful response",
        Types.Object({
          description: "Successful Operation",
          properties: {
            data: Types.Array({ arrayType: UserType }), 
            pagination: Types.Object({
              description: "pagination information for data",
              properties: {
                offset: Types.Integer({ minValue: 0 }),
                limit: Types.Integer({ minValue: 0, maxValue: 100, default: 10 }),
                count: Types.Integer({ minValue: 0, maxValue: 100, default: 10 })
              }
            }),
            total: Types.Number({ description: "Total number of clients under currently logged in tenant" }),
            missions: Types.Array({ 
                description: "Missions associated with a single client, returned only when clientId is given in request",
                arrayType: MissionType 
            }), 
            csvPath: Types.String({ description: "Path to csv file, returned only when generateCSV option was true in request" }),
          },
        })
      )
    }
  }
}, true)

export default clientApi;