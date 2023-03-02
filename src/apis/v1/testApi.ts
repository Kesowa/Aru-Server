import express from "express";
import {
  broadcasterTest,
  // permTest,
  testController,
  viewerTest,
} from "../../controllers/v1/testController";
// import { isAuthenticated } from "../../utils/authUtils";
const router = express.Router();

router.get("/testt", testController);

router.get("/broadcast-test", broadcasterTest);

router.get("/viewer-test", viewerTest);

// router.post("/permTest",
//   isAuthenticated,
//   // enter perm guard middlewares here
//   permTest
// );
export default router;
