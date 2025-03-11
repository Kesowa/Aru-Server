import { Router } from "express";

import { getSettings } from "../../controllers/v1/settingController";
import { isAuthenticated } from "../../utils/authUtils";

const router = Router();

router.get("/url", isAuthenticated, (req, res, next) => {
  res.json(getSettings());
});

export default router;
