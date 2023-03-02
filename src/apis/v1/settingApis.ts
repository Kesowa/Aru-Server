import { Router } from "express";
import { isAuthenticated } from "../../utils/authUtils";
import { getSettings } from "../../controllers/v1/settingController";

const router = Router();

router.get("/url", isAuthenticated, (req, res, next) => {
  res.json(getSettings());
});

export default router;
