import express from "express";

import { getAllPilots } from "../../controllers/v1/pilotController";
import { isAuthenticated } from "../../utils/authUtils";
import { RobustRunner } from "../../utils/requestHelpers";

const router = express.Router();

// This endpoint returns no response, so it eventually times out and gives 500 status
// TODO: Is this endpoint required?
router.post("/login", isAuthenticated, (_, res) => res.sendStatus(200));

router.get("/get-all-pilots", isAuthenticated, RobustRunner(getAllPilots));

export default router;
