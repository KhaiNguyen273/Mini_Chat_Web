import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import * as BlockController from "../controllers/block.controller";

const router = Router();

// /blocked PHẢI đứng trước /:id/block để không bị route "/:id" của user.routes nuốt mất
router.get("/blocked", authenticate, BlockController.list);
router.post("/:id/block", authenticate, BlockController.block);
router.delete("/:id/block", authenticate, BlockController.unblock);

export default router;