import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as NotificationService from "../services/notification.service";

export const list = async (req: AuthRequest, res: Response) => {
  const notifications = await NotificationService.list(req.userId!);
  res.json({ data: notifications });
};

export const markRead = async (req: AuthRequest, res: Response) => {
  await NotificationService.markRead(Number(req.params.id), req.userId!);
  res.json({ message: "Marked as read" });
};

export const markAllRead = async (req: AuthRequest, res: Response) => {
  await NotificationService.markAllRead(req.userId!);
  res.json({ message: "All marked as read" });
};