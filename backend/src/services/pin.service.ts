import * as PinModel from "../models/pin.model";
import * as ConversationModel from "../models/conversation.model";
import * as MessageModel from "../models/message.model";

const MAX_PINS_PER_CONVERSATION = 20; // giới hạn tránh spam ghim vô hạn

export const pinMessage = async (conversationId: number, messageId: number, userId: number) => {
  const isMember = await ConversationModel.isMember(conversationId, userId);
  if (!isMember) throw new Error("Not a member of this conversation");

  const message = await MessageModel.findById(messageId);
  if (!message || message.conversation_id !== conversationId) {
    throw new Error("Message not found in this conversation");
  }

  const existed = await PinModel.findByMessage(conversationId, messageId);
  if (existed) throw new Error("Message already pinned");

  const total = await PinModel.countByConversation(conversationId);
  if (total >= MAX_PINS_PER_CONVERSATION) {
    throw new Error(`Cannot pin more than ${MAX_PINS_PER_CONVERSATION} messages`);
  }

  const id = await PinModel.create(conversationId, messageId, userId);
  return { id, conversationId, messageId };
};

export const unpinMessage = async (conversationId: number, messageId: number, userId: number) => {
  const isMember = await ConversationModel.isMember(conversationId, userId);
  if (!isMember) throw new Error("Not a member of this conversation");

  const existed = await PinModel.findByMessage(conversationId, messageId);
  if (!existed) throw new Error("Message is not pinned");

  await PinModel.remove(conversationId, messageId);
};

export const listPinned = async (conversationId: number, userId: number) => {
  const isMember = await ConversationModel.isMember(conversationId, userId);
  if (!isMember) throw new Error("Not a member of this conversation");
  const rows = await PinModel.listByConversation(conversationId);
  return rows.map((row: any) => ({
    pin_id: row.pin_id,
    pinned_at: row.pinned_at,
    pinned_by: { id: row.pinned_by, name: row.pinned_by_name },
    message: {
      id: row.message_id,
      content: row.content,
      type: row.message_type,
      created_at: row.message_created_at,
      sender: { id: row.sender_id, name: row.sender_name, avatar_url: row.sender_avatar_url },
    },
  }));
};