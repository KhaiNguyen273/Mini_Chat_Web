import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import * as FriendshipController from "../controllers/friendship.controller";

const router = Router();

router.post("/", authenticate, FriendshipController.send);
router.put("/:id/accept", authenticate, FriendshipController.accept);
router.put("/:id/reject", authenticate, FriendshipController.reject);
router.put("/:id/block", authenticate, FriendshipController.block);
router.delete("/:id", authenticate, FriendshipController.remove);
router.get("/", authenticate, FriendshipController.list);
router.get("/requests", authenticate, FriendshipController.requests);

export default router;