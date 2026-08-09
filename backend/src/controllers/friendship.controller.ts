import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as FriendshipService from "../services/friendship.service";

export const send = async (req: AuthRequest, res: Response) => {
  try {
    const { receiverId } = req.body;
    const result = await FriendshipService.sendRequest(req.userId!, receiverId);
    res.status(201).json({ data: result });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const accept = async (req: AuthRequest, res: Response) => {
  try {
    const result = await FriendshipService.accept(Number(req.params.id), req.userId!);
    res.json({ data: result });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const reject = async (req: AuthRequest, res: Response) => {
  try {
    const result = await FriendshipService.reject(Number(req.params.id), req.userId!);
    res.json({ data: result });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const block = async (req: AuthRequest, res: Response) => {
  try {
    const result = await FriendshipService.block(Number(req.params.id), req.userId!);
    res.json({ data: result });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const remove = async (req: AuthRequest, res: Response) => {
  try {
    await FriendshipService.unfriend(Number(req.params.id), req.userId!);
    res.json({ message: "Removed" });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const list = async (req: AuthRequest, res: Response) => {
  const friends = await FriendshipService.getFriends(req.userId!);
  res.json({ data: friends });
};

export const requests = async (req: AuthRequest, res: Response) => {
  const requests = await FriendshipService.getPendingRequests(req.userId!);
  res.json({ data: requests });
};