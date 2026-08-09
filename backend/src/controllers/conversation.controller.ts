import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as ConversationService from "../services/conversation.service";

export const createPrivate = async (req: AuthRequest, res: Response) => {
  try {
    const { otherUserId } = req.body;
    const conv = await ConversationService.getOrCreatePrivate(req.userId!, otherUserId);
    res.status(201).json({ data: conv });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const createGroup = async (req: AuthRequest, res: Response) => {
  try {
    const { name, memberIds } = req.body;
    const conv = await ConversationService.createGroup(req.userId!, name, memberIds);
    res.status(201).json({ data: conv });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const list = async (req: AuthRequest, res: Response) => {
  const list = await ConversationService.listConversations(req.userId!);
  res.json({ data: list });
};

export const getOne = async (req: AuthRequest, res: Response) => {
  try {
    // phải gọi qua service, KHÔNG gọi thẳng ConversationModel.findById
    const conv = await ConversationService.getConversation(Number(req.params.id), req.userId!);
    res.json({ data: conv });
  } catch (err: any) {
    res.status(403).json({ message: err.message });
  }
};

export const update = async (req: AuthRequest, res: Response) => {
  try {
    const { name, avatar_url } = req.body;
    const conv = await ConversationService.updateGroup(Number(req.params.id), req.userId!, name, avatar_url);
    res.json({ data: conv });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const addMember = async (req: AuthRequest, res: Response) => {
  try {
    const { userId: newMemberId } = req.body;
    await ConversationService.addMember(Number(req.params.id), req.userId!, newMemberId);
    res.json({ message: "Member added" });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const removeMember = async (req: AuthRequest, res: Response) => {
  try {
    await ConversationService.removeMember(Number(req.params.id), req.userId!, Number(req.params.userId));
    res.json({ message: "Member removed" });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const updateRole = async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.body;
    await ConversationService.updateRole(Number(req.params.id), req.userId!, Number(req.params.userId), role);
    res.json({ message: "Role updated" });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const mute = async (req: AuthRequest, res: Response) => {
  const { muted } = req.body;
  await ConversationService.setMuted(Number(req.params.id), req.userId!, muted);
  res.json({ message: "Updated" });
};

export const markRead = async (req: AuthRequest, res: Response) => {
  await ConversationService.markRead(Number(req.params.id), req.userId!);
  res.json({ message: "Marked as read" });
};

export const listMembers = async (req: AuthRequest, res: Response) => {
  const members = await ConversationService.listMembers(Number(req.params.id));
  res.json({ data: members });
};

export const listPending = async (req: AuthRequest, res: Response) => {
  const data = await ConversationService.listPending(req.userId!);
  res.json({ data });
};

export const accept = async (req: AuthRequest, res: Response) => {
  try {
    const data = await ConversationService.acceptPending(Number(req.params.id), req.userId!);
    res.json({ data });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const reject = async (req: AuthRequest, res: Response) => {
  try {
    const data = await ConversationService.rejectPending(Number(req.params.id), req.userId!);
    res.json({ data });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};