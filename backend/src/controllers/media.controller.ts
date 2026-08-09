import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as MediaService from "../services/media.service";

export const list = async (req: AuthRequest, res: Response) => {
  try {
    const category = req.query.category as string | undefined; // 'image' | 'video' | 'file' | undefined
    const cursor = (req.query.cursor as string) || null;
    const limit = Number(req.query.limit) || 30;
    const media = await MediaService.listMedia(Number(req.params.id), req.userId!, category, cursor, limit);
    res.json({ data: media });
  } catch (err: any) {
    res.status(403).json({ message: err.message });
  }
};

export const summary = async (req: AuthRequest, res: Response) => {
  try {
    const result = await MediaService.getMediaSummary(Number(req.params.id), req.userId!);
    res.json({ data: result });
  } catch (err: any) {
    res.status(403).json({ message: err.message });
  }
};