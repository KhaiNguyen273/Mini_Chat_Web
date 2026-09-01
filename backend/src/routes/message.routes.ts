import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middleware";
import * as MessageController from "../controllers/message.controller";

const router = Router();

router.get("/conversations/:id/messages/after", authenticate, MessageController.listAfter);
router.post("/conversations/:id/messages", authenticate, MessageController.send);
router.get("/conversations/:id/messages", authenticate, MessageController.list);
router.post(
  "/conversations/:id/messages/upload",
  authenticate,
  upload.array("files", 5),
  MessageController.sendWithFiles
);

// mới — lấy 1 message riêng lẻ theo id
router.get("/messages/:id", authenticate, MessageController.getOne);

router.delete("/messages/:id", authenticate, MessageController.remove);
router.put("/messages/:id", authenticate, MessageController.edit);
router.post("/messages/:id/read", authenticate, MessageController.markRead);
router.get("/messages/:id/reads", authenticate, MessageController.getReaders);

export default router;