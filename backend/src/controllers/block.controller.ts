import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as BlockService from "../services/block.service";

export const block = async (req: AuthRequest, res: Response) => {
  try {
    const result = await BlockService.blockUser(req.userId!, Number(req.params.id));
    res.status(201).json({ data: result });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const unblock = async (req: AuthRequest, res: Response) => {
  try {
    const result = await BlockService.unblockUser(req.userId!, Number(req.params.id));
    res.json({ data: result });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const list = async (req: AuthRequest, res: Response) => {
  const data = await BlockService.getBlockedList(req.userId!);
  res.json({ data });
};