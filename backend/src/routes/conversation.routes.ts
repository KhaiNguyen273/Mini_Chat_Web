import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import * as ConversationController from "../controllers/conversation.controller";

const router = Router();

router.post("/private", authenticate, ConversationController.createPrivate);
router.post("/group", authenticate, ConversationController.createGroup);
router.get("/", authenticate, ConversationController.list);

router.get("/search", authenticate, ConversationController.search);
router.post("/private", authenticate, ConversationController.createPrivate);

router.get("/mutual-groups/:userId", authenticate, ConversationController.getMutualGroups);
router.get("/private-id/:userId", authenticate, ConversationController.getPrivateId);

// "/pending" PHẢI đứng TRƯỚC "/:id" để không bị Express hiểu "pending" là 1 giá trị :id
router.get("/pending", authenticate, ConversationController.listPending);

router.get("/:id", authenticate, ConversationController.getOne);
router.put("/:id/accept", authenticate, ConversationController.accept);
router.put("/:id/reject", authenticate, ConversationController.reject);
router.put("/:id", authenticate, ConversationController.update);
router.put("/:id/read", authenticate, ConversationController.markRead);
router.put("/:id/mute", authenticate, ConversationController.mute);
router.get("/:id/members", authenticate, ConversationController.listMembers);
router.post("/:id/members", authenticate, ConversationController.addMember);
router.delete("/:id/members/:userId", authenticate, ConversationController.removeMember);
router.put("/:id/members/:userId/role", authenticate, ConversationController.updateRole);



export default router;