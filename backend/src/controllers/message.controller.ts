import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as MessageService from "../services/message.service";
import { uploadBufferToCloudinary } from "../services/upload.service";

export const send = async (req: AuthRequest, res: Response) => {
  try {
    const { content, type, attachments } = req.body;
    const message = await MessageService.sendMessage(
      Number(req.params.id),
      req.userId!,
      content,
      type,
      attachments
    );
    res.status(201).json({ data: message });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const list = async (req: AuthRequest, res: Response) => {
  try {
    const cursor = (req.query.cursor as string) || null;
    const limit = Number(req.query.limit) || 30;
    const messages = await MessageService.getMessages(Number(req.params.id), req.userId!, cursor, limit);
    res.json({ data: messages });
  } catch (err: any) {
    res.status(403).json({ message: err.message });
  }
};

export const remove = async (req: AuthRequest, res: Response) => {
  try {
    await MessageService.deleteMessage(Number(req.params.id), req.userId!);
    res.json({ message: "Message deleted" });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const edit = async (req: AuthRequest, res: Response) => {
  try {
    const { content } = req.body;
    const message = await MessageService.editMessage(Number(req.params.id), req.userId!, content);
    res.json({ data: message });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const markRead = async (req: AuthRequest, res: Response) => {
  await MessageService.markMessageRead(Number(req.params.id), req.userId!);
  res.json({ message: "Marked as read" });
};

export const getReaders = async (req: AuthRequest, res: Response) => {
  const readers = await MessageService.getReaders(Number(req.params.id));
  res.json({ data: readers });
};

export const sendWithFiles = async (req: AuthRequest, res: Response) => {
  try {
    const { content, type } = req.body;
    const files = (req.files as Express.Multer.File[]) || [];

    const attachments = [];
    for (const file of files) {
      const isImage = file.mimetype.startsWith("image/");
      const result = await uploadBufferToCloudinary(
        file.buffer,
        "minichat/messages",
        isImage ? "image" : "raw"
      );
      attachments.push({
        url: result.url,
        name: file.originalname,
        size: file.size,
        fileType: file.mimetype,
      });
    }

    const message = await MessageService.sendMessage(
      Number(req.params.id),
      req.userId!,
      content || null,
      type || (attachments.length ? "file" : "text"),
      attachments
    );

    res.status(201).json({ data: message });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};