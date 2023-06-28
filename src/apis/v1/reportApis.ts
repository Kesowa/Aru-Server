import express from "express";

import { isAuthenticated } from "../../utils/authUtils";
import { generateReport } from "../../controllers/v1/reportController";
import { body } from "express-validator";
import { validator } from "../../utils/requestHelpers";

const router = express.Router();

router.post("/", 
    isAuthenticated, 
    body("missionId").notEmpty().isMongoId(),
    validator,
    generateReport
);

export default router;
