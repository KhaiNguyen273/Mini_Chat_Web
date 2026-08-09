import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import * as MediaController from "../controllers/media.controller";

const router = Router();

router.get("/conversations/:id/media", authenticate, MediaController.list);
router.get("/conversations/:id/media/summary", authenticate, MediaController.summary);

export default router;