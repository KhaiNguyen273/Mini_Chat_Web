import * as MessageModel from "../models/message.model";
import * as ConversationModel from "../models/conversation.model";
import * as BlockModel from "../models/block.model";
import * as NotificationService from "./notification.service"; // dùng cho cả 2 nhánh giờ
import * as PinModel from "../models/pin.model";
import * as UserModel from "../models/user.model";
import { getIO } from "../sockets/io-registry";
import { emitNewConversation, joinConversationRoom } from "./conversation.service";

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

  let conversation: any = await ConversationModel.findById(conversationId);

  if (conversation?.type === "private" && conversation?.status === "rejected") {
    await ConversationModel.reopenAsPending(conversationId, senderId);
    conversation = await ConversationModel.findById(conversationId);
  }

  const members = await ConversationModel.listMembers(conversationId);

  if (conversation?.type === "private") {
    const otherMember = members.find((m: any) => m.id !== senderId);
    if (otherMember) {
      const blocked = await BlockModel.isBlockedEitherWay(senderId, otherMember.id);
      if (blocked) throw new Error("Cannot send message — user is blocked");

      const otherUser = await UserModel.findByIdIncludingDeleted(otherMember.id);
      if (otherUser?.is_deleted) throw new Error("Cannot send message — user is deactivated");
    }
  }

  const messageId = await MessageModel.create(conversationId, senderId, content, type);

  for (const file of attachments) {
    await MessageModel.addAttachment(
      messageId, conversationId, file.url, file.name, file.size, file.fileType, getCategory(file.fileType)
    );
  }

  await ConversationModel.touchUpdatedAt(conversationId);

  // MỚI — gửi tin nghiễm nhiên là bằng chứng người gửi đã "đọc" tới thời
  // điểm đó. Nếu không tự bump, last_read_at của họ vẫn dừng ở tin cuối
  // cùng của phía đối phương, khiến avatar đọc-tin không bao giờ nhảy lên
  // tin mới nhất mà chính họ vừa gửi — phải cập nhật NGAY tại nguồn dữ
  // liệu, không thể vá ở tầng hiển thị FE
  const senderLastReadAt = await ConversationModel.markRead(conversationId, senderId);

  const preview = content
    ? content.length > 100 ? content.slice(0, 100) + "…" : content
    : attachments.length > 0 ? "[Đã gửi file đính kèm]" : "";

  const isPendingRequest = conversation?.status === "pending" && conversation?.created_by === senderId;

  for (const member of members) {
    if (member.id !== senderId && !member.is_muted) {
      if (isPendingRequest) {
        await NotificationService.upsertPendingNotification(member.id, senderId, conversationId, preview);
      } else {
        await NotificationService.create(member.id, senderId, "new_message", messageId, "message", preview, conversationId);
      }
    }
  }

  const message = await MessageModel.findById(messageId);
  const messageAttachments = await MessageModel.getAttachments(messageId);
  const fullMessage = { ...message, attachments: messageAttachments };

  try {
    const io = getIO();
    io.to(`conversation:${conversationId}`).emit("message:new", fullMessage);
    // MỚI — báo cho cả room biết last_read_at của SENDER vừa bump, để
    // avatar đọc-tin ở phía người kia (nếu họ đang mở sẵn conversation)
    // cập nhật ngay, không cần đợi F5
    io.to(`conversation:${conversationId}`).emit("conversation:read", {
      conversationId,
      userId: senderId,
      lastReadAt: senderLastReadAt,
    });
  } catch {
    // io chưa init — không fail REST
  }

  if (isPendingRequest) {
    for (const member of members) {
      if (member.id !== senderId) {
        joinConversationRoom(conversationId, member.id);
        emitNewConversation(conversationId, member.id);
      }
    }
  }

  return fullMessage;
};

export const getMessages = async (
  conversationId: number,
  userId: number,
  cursor: string | null,
  limit = 30,
  q?: string | null
) => {
  const wasMember = await ConversationModel.wasMember(conversationId, userId);
  if (!wasMember) throw new Error("Not a member of this conversation");
  return MessageModel.listByConversation(conversationId, userId, cursor, limit, q); // thêm userId
};

export const deleteMessage = async (messageId: number, userId: number) => {
  const message = await MessageModel.findById(messageId);
  if (!message) throw new Error("Message not found");
  if (message.sender_id !== userId) throw new Error("Not authorized");

  const attachments = await MessageModel.getAttachments(messageId);

  await MessageModel.softDelete(messageId);

  const wasPinned = await PinModel.findByMessage(message.conversation_id, messageId);
  if (wasPinned) {
    await PinModel.remove(message.conversation_id, messageId);
  }

  try {
    const io = getIO();
    io.to(`conversation:${message.conversation_id}`).emit("message:deleted", {
      conversationId: message.conversation_id,
      messageId,
    });
    if (wasPinned) {
      io.to(`conversation:${message.conversation_id}`).emit("conversation:unpin", {
        conversationId: message.conversation_id,
        messageId,
      });
    }
    // MỚI — tin bị thu hồi có đính kèm: InfoPanel/MediaFilePanel/ContactWindow
    // fetch media qua REST riêng, không tự nghe message:deleted — báo riêng
    // để các nơi đó tự refetch, tránh ảnh/file thu hồi vẫn còn hiện
    if (attachments.length > 0) {
      io.to(`conversation:${message.conversation_id}`).emit("conversation:media-changed", {
        conversationId: message.conversation_id,
      });
    }
  } catch {
    // io chưa init — không fail REST
  }
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

export const getMessageById = async (messageId: number, userId: number) => {
  const message: any = await MessageModel.findByIdWithAttachments(messageId);
  if (!message) throw new Error("Message not found");

  // sửa — check theo giai đoạn thành viên thay vì wasMember thô, để chặn
  // xem lén tin nhắn trong khoảng thời gian bị kick qua đường vòng notification
  const isVisible = await ConversationModel.isMessageVisibleToUser(
    message.conversation_id, userId, message.created_at
  );
  if (!isVisible) throw new Error("Message not found");

  return message;
};

export const getMessagesAfter = async (conversationId: number, userId: number, afterCursor: string, limit = 15) => {
  const wasMember = await ConversationModel.wasMember(conversationId, userId);
  if (!wasMember) throw new Error("Not a member of this conversation");
  return MessageModel.listAfter(conversationId, userId, afterCursor, limit); // thêm userId
};