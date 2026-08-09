import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import * as UserController from "../controllers/user.controller";
import { upload } from "../middlewares/upload.middleware";

const router = Router();

router.get("/me", authenticate, UserController.getMe);
router.put("/me", authenticate, UserController.updateMe);
router.put("/me/password", authenticate, UserController.changePassword);
router.delete("/me", authenticate, UserController.deleteMe);
router.get("/search", authenticate, UserController.searchUsers);
router.get("/:id", authenticate, UserController.getUserById);
router.post("/me/avatar", authenticate, upload.single("avatar"), UserController.uploadAvatar);

export default router;