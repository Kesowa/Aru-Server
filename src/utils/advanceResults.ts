import { AuthResponse } from "./interfaceUtils";
import { Request, NextFunction } from "express";
import { getNumberOfTypesOfMissions } from "../pipelines/missionPipeline";
import moment from "moment";

const advancedResults =
  (missionModel: any, flightModel: any) =>
  async (req: Request, res: AuthResponse, next: NextFunction) => {
    try {
      const tenantId = res.locals.user.tenantId._id;
      const filter = req.query.filter;
      let missions;
      let total;
      const query: any = { tenantId };

      if (req.query.missionType) {
        query["missionType"] = req.query.missionType;
      }

      if (filter !== "all") {
        query["status"] = filter;
        missions = missionModel.find(query);
      } else if (req.query.client === "true") {
        missions = missionModel.find(query).populate("clientId", "name");
      } else {
        missions = missionModel.find({ tenantId });
      }

      // Sort
      if (req.query.sort && String(req.query.sort).split(":")[0] !== "flight") {
        let sortBy: string = String(req.query.sort).split(":")[0];
        const order: string = String(req.query.sort).split(":")[1];
        sortBy = order.toString() === "descend" ? `-${sortBy}` : `${sortBy}`;
        missions = missions.sort(sortBy);
      } else if (String(req.query.sort).split(":")[0] !== "flight") {
        missions = missions.sort("-createdAt");
      }

      missions
        .populate("user")
        .populate("missionType", "name")
        .populate("clientId");

      //Pagination
      const page = Number(req.query.page);
      const limit = Number(req.query.limit);
      const startIndex = (page - 1) * limit;

      // // Executing query
      let results = await missions.lean();

      if (req.query.client === "true") {
        results = results.filter(
          (m) => m.clientId !== null && m.clientId !== undefined
        );
      }

      let missionsList: any = await Promise.all(
        results.map(async (mission: any) => {
          const missionId = mission._id;
          const flight = await flightModel
            .findOne({ mission: missionId })
            .populate("pilotID")
            .populate("locationID")
            .lean();

          return {
            ...mission,
            ["flight"]: flight,
          };
        })
      );

      if (String(req.query.sort).split(":")[0] === "flight") {
        const order: string = String(req.query.sort).split(":")[1];

        missionsList.sort((a, b) => {
          if (order === "descend") {
            return (
              new Date(b.flight.createdAt).valueOf() -
              new Date(a.flight.createdAt).valueOf()
            );
          }

          return (
            new Date(a.flight.createdAt).valueOf() -
            new Date(b.flight.createdAt).valueOf()
          );
        });
      }

      // Searching
      if (String(req.query.searchFilters)) {
        let searchFilters: any = String(req.query.searchFilters);
        searchFilters = searchFilters.split(",");

        missionsList = missionsList.filter((mission: any) => {
          let shouldReturn = true;
          searchFilters.forEach((f: any) => {
            const q = f.split(":");
            // REGEX
            const re = RegExp(q[1], "i");
            if (q[0] === "user" && mission.user) {
              shouldReturn = shouldReturn && re.test(String(mission.user.name));
            } else if (q[0] === "createdAt" && mission["createdAt"]) {
              shouldReturn =
                shouldReturn &&
                re.test(moment(mission["createdAt"]).format("YYYY-MM-DD"));
            } else if (q[0] === "flight" && mission.flight) {
              shouldReturn =
                shouldReturn &&
                re.test(moment(mission.flight.date).format("YYYY-MM-DD"));
            } else if (q[0] === "clientId" && mission.clientId) {
              shouldReturn =
                shouldReturn && re.test(String(mission.clientId.name));
            } else {
              shouldReturn = shouldReturn && re.test(String(mission[q[0]]));
            }
          });
          return shouldReturn;
        });
      }

      total = missionsList.length;

      missionsList = missionsList.filter((mission, i) => {
        return i >= startIndex;
      });

      missionsList = missionsList.filter((mission, i) => {
        return i < limit;
      });

      const allMissionsCount = await missionModel.aggregate(
        getNumberOfTypesOfMissions(tenantId)
      );

      if (String(req.query.sort).split(":")[0] === "flight") {
        const order: string = String(req.query.sort).split(":")[1];

        if (order === "descend") {
          missionsList.reverse();
        }
      }

      res.locals.advancedResults = {
        status: true,
        message: "Here are all the missions",
        data: missionsList,
        total,
        missionCount: allMissionsCount,
      };

      next();
    } catch (err) {
      res.locals.logger.error(err);
      res.json({
        status: false,
        message: "Server error",
      });
    }
  };

export default advancedResults;
