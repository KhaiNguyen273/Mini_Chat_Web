import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import * as PinController from "../controllers/pin.controller";

const router = Router();

router.post("/conversations/:id/pins", authenticate, PinController.pin);
router.delete("/conversations/:id/pins/:messageId", authenticate, PinController.unpin);
router.get("/conversations/:id/pins", authenticate, PinController.list);

export default router;