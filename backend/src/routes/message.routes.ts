import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import * as MessageController from "../controllers/message.controller";
import { upload } from "../middlewares/upload.middleware";

const router = Router();

// nested dưới conversations
router.post("/conversations/:id/messages", authenticate, MessageController.send);
router.get("/conversations/:id/messages", authenticate, MessageController.list);

// thao tác trực tiếp trên message
router.delete("/messages/:id", authenticate, MessageController.remove);
router.put("/messages/:id", authenticate, MessageController.edit);
router.post("/messages/:id/read", authenticate, MessageController.markRead);
router.get("/messages/:id/reads", authenticate, MessageController.getReaders);

// gửi tin nhắn kèm file (multipart/form-data)
router.post(
  "/conversations/:id/messages/upload",
  authenticate,
  upload.array("files", 5), // tối đa 5 file 1 lần gửi
  MessageController.sendWithFiles
);

export default router;