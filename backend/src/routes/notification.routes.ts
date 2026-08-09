import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import * as NotificationController from "../controllers/notification.controller";

const router = Router();

router.get("/", authenticate, NotificationController.list);
router.put("/read-all", authenticate, NotificationController.markAllRead);
router.put("/:id/read", authenticate, NotificationController.markRead);

export default router;