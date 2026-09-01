import * as MediaModel from "../models/media.model";
import * as ConversationModel from "../models/conversation.model";

export const listMedia = async (
  conversationId: number,
  userId: number,
  category: string | undefined,
  cursor: string | null,
  limit = 30
) => {
  const wasMember = await ConversationModel.wasMember(conversationId, userId);
  if (!wasMember) throw new Error("Not a member of this conversation");

  return MediaModel.listByConversation(conversationId, category, cursor, limit);
};

export const getMediaSummary = async (conversationId: number, userId: number) => {
  const wasMember = await ConversationModel.wasMember(conversationId, userId);
  if (!wasMember) throw new Error("Not a member of this conversation");

  const rows = await MediaModel.countByCategory(conversationId);
  const summary = { image: 0, video: 0, file: 0 };
  for (const row of rows as any[]) {
    summary[row.category as "image" | "video" | "file"] = row.total;
  }
  return summary;
};