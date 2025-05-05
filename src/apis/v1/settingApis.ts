import { Router } from "express";

import { getSettings } from "../../controllers/v1/settingController";

const router = Router();

router.get("/url", (req, res, next) => {
  res.json(getSettings());
});

export default router;
