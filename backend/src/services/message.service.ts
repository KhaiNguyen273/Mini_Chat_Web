import * as MessageModel from "../models/message.model";
import * as ConversationModel from "../models/conversation.model";
import * as NotificationModel from "../models/notification.model";
import * as NotificationService from "./notification.service";

const getCategory = (mimeType: string): "image" | "video" | "file" => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "file";
};

export const sendMessage = async (
  conversationId: number,
  senderId: number,
  content: string | null,
  type: string,
  attachments: { url: string; name: string; size: number; fileType: string }[] = []
) => {
  const isMember = await ConversationModel.isMember(conversationId, senderId);
  if (!isMember) throw new Error("Not a member of this conversation");

  const messageId = await MessageModel.create(conversationId, senderId, content, type);

  for (const file of attachments) {
    await MessageModel.addAttachment(
      messageId,
      conversationId,
      file.url,
      file.name,
      file.size,
      file.fileType,
      getCategory(file.fileType)
    );
  }

  await ConversationModel.touchUpdatedAt(conversationId);

  // ... phần notification giữ nguyên như đã sửa trước đó
  const preview = content
    ? content.length > 100 ? content.slice(0, 100) + "…" : content
    : attachments.length > 0 ? "[Đã gửi file đính kèm]" : "";

  const members = await ConversationModel.listMembers(conversationId);
  for (const member of members) {
    if (member.id !== senderId && !member.is_muted) {
      await NotificationModel.create(member.id, senderId, "new_message", messageId, "message", preview);
    }
  }

  const message = await MessageModel.findById(messageId);
  const messageAttachments = await MessageModel.getAttachments(messageId);
  return { ...message, attachments: messageAttachments };
};

export const getMessages = async (conversationId: number, userId: number, cursor: string | null, limit = 30) => {
  const isMember = await ConversationModel.isMember(conversationId, userId);
  if (!isMember) throw new Error("Not a member of this conversation");
  return MessageModel.listByConversation(conversationId, cursor, limit);
};

export const deleteMessage = async (messageId: number, userId: number) => {
  const message = await MessageModel.findById(messageId);
  if (!message) throw new Error("Message not found");
  if (message.sender_id !== userId) throw new Error("Not authorized");
  await MessageModel.softDelete(messageId);
};

export const editMessage = async (messageId: number, userId: number, content: string) => {
  const message = await MessageModel.findById(messageId);
  if (!message) throw new Error("Message not found");
  if (message.sender_id !== userId) throw new Error("Not authorized");
  await MessageModel.updateContent(messageId, content);
  return MessageModel.findById(messageId);
};

export const markMessageRead = async (messageId: number, userId: number) => {
  await MessageModel.markRead(messageId, userId);
};

export const getReaders = (messageId: number) => MessageModel.getReaders(messageId);