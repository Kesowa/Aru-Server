import express from "express";
import { isAuthenticated } from "../../utils/authUtils";
import { getAllPilots } from "../../controllers/v1/pilotController";
import { RobustRunner } from "../../utils/requestHelpers";

const router = express.Router();

// TODO: This endpoint returns no response, so it eventually times out and gives 500 status
router.post("/login", isAuthenticated, (_, res) => res.sendStatus(200));

router.get("/get-all-pilots", isAuthenticated, RobustRunner(getAllPilots));

export default router;
