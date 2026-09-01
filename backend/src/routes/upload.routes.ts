import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middleware";
import * as UploadController from "../controllers/upload.controller";

const router = Router();

router.post("/image", authenticate, upload.single("file"), UploadController.uploadImage);

export default router;