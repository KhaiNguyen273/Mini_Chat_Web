import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import * as ConversationController from "../controllers/conversation.controller";

const router = Router();

router.post("/private", authenticate, ConversationController.createPrivate);
router.post("/group", authenticate, ConversationController.createGroup);
router.get("/", authenticate, ConversationController.list);
router.get("/pending", authenticate, ConversationController.listPending);
router.put("/:id/accept", authenticate, ConversationController.accept);
router.put("/:id/reject", authenticate, ConversationController.reject);
router.get("/:id", authenticate, ConversationController.getOne);
router.put("/:id", authenticate, ConversationController.update);
router.put("/:id/read", authenticate, ConversationController.markRead);
router.put("/:id/mute", authenticate, ConversationController.mute);
router.get("/:id/members", authenticate, ConversationController.listMembers);
router.post("/:id/members", authenticate, ConversationController.addMember);
router.delete("/:id/members/:userId", authenticate, ConversationController.removeMember);
router.put("/:id/members/:userId/role", authenticate, ConversationController.updateRole);

export default router;