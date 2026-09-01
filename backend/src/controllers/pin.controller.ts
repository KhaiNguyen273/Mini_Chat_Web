import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as PinService from "../services/pin.service";

export const pin = async (req: AuthRequest, res: Response) => {
  try {
    const { messageId } = req.body;
    const result = await PinService.pinMessage(Number(req.params.id), messageId, req.userId!);
    res.status(201).json({ data: result });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const unpin = async (req: AuthRequest, res: Response) => {
  try {
    await PinService.unpinMessage(Number(req.params.id), Number(req.params.messageId), req.userId!);  
    res.json({ message: "Unpinned" });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const list = async (req: AuthRequest, res: Response) => {
  try {
    const pins = await PinService.listPinned(Number(req.params.id), req.userId!);
    res.json({ data: pins });
  } catch (err: any) {
    res.status(403).json({ message: err.message });
  }
};