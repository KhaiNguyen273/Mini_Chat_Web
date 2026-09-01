import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { uploadBufferToCloudinary } from "../services/upload.service";

export const uploadImage = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) throw new Error("No file uploaded");

    if (!req.file.mimetype.startsWith("image/")) {
      throw new Error("Only image files are allowed");
    }

    const result = await uploadBufferToCloudinary(
      req.file.buffer,
      "minichat/general",
      "image"
    );

    res.json({
      data: {
        url: result.url,
        public_id: result.publicId,
        bytes: result.bytes,
        format: result.format,
      },
    });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};