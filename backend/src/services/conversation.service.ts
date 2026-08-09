import * as ConversationModel from "../models/conversation.model";
import * as FriendshipModel from "../models/friendship.model";
import * as NotificationService from "./notification.service";

// map 1 row DB thô → object phẳng trả cho FE, dùng chung cho MỌI hàm trả về conversation
function mapConversationRow(row: any) {
  const isPrivate = row.type === "private";
  return {
    id: row.id,
    type: row.type,
    status: row.status,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    name: isPrivate ? row.other_user_name : row.group_name,
    avatar_url: isPrivate ? row.other_user_avatar_url : row.group_avatar_url,
    other_user_id: isPrivate ? row.other_user_id : null,
    pinned_count: Number(row.pinned_count) || 0,
    last_message: row.last_message_content
      ? {
          content: row.last_message_content,
          sender_id: row.last_message_sender_id,
          created_at: row.last_message_created_at,
        }
      : null,
  };
}

export const getOrCreatePrivate = async (userId: number, otherUserId: number) => {
  const existed = await ConversationModel.findPrivateBetween(userId, otherUserId);
  if (existed) return existed;

  // đã là bạn bè → tạo active ngay; chưa là bạn → tạo pending (chờ receiver duyệt)
  const friendship = await FriendshipModel.findBetween(userId, otherUserId);
  const status = friendship?.status === "accepted" ? "active" : "pending";

  const id = await ConversationModel.create("private", null, userId, status);
  await ConversationModel.addMember(id, userId, "member");
  await ConversationModel.addMember(id, otherUserId, "member");
  return ConversationModel.findById(id);
};

export const createGroup = async (userId: number, name: string, memberIds: number[]) => {
  const id = await ConversationModel.create("group", name, userId);
  await ConversationModel.addMember(id, userId, "admin");
  for (const memberId of memberIds) {
    if (memberId !== userId) await ConversationModel.addMember(id, memberId, "member");
  }
  return ConversationModel.findById(id);
};

export const listConversations = async (userId: number) => {
  const rows = await ConversationModel.listForUser(userId);
  return rows.map(mapConversationRow);
};

// mới — danh sách chờ duyệt (mình là receiver, không phải người tạo)
export const listPending = async (userId: number) => {
  const rows = await ConversationModel.listPendingForUser(userId);
  return rows.map(mapConversationRow);
};

export const getConversation = async (id: number, userId: number) => {
  const isMember = await ConversationModel.isMember(id, userId);
  if (!isMember) throw new Error("Not a member of this conversation");

  const row: any = await ConversationModel.findDetailById(id, userId);
  if (!row) throw new Error("Conversation not found");

  return mapConversationRow(row);
};



export const acceptPending = async (conversationId: number, userId: number) => {
  const conv: any = await ConversationModel.findById(conversationId);
  if (!conv) throw new Error("Conversation not found");
  if (conv.status !== "pending") throw new Error("Conversation is not pending");
  if (conv.created_by === userId) throw new Error("Cannot accept your own request");

  const isMember = await ConversationModel.isMember(conversationId, userId);
  if (!isMember) throw new Error("Not authorized");

  await ConversationModel.updateStatus(conversationId, "active");
  await NotificationService.clearPendingNotification(userId, conversationId); // xoá khỏi notification profile

  return { id: conversationId, status: "active" };
};

export const rejectPending = async (conversationId: number, userId: number) => {
  const conv: any = await ConversationModel.findById(conversationId);
  if (!conv) throw new Error("Conversation not found");
  if (conv.status !== "pending") throw new Error("Conversation is not pending");
  if (conv.created_by === userId) throw new Error("Cannot reject your own request");

  await ConversationModel.updateStatus(conversationId, "rejected");
  await NotificationService.clearPendingNotification(userId, conversationId); // xoá khỏi notification profile

  return { id: conversationId, status: "rejected" };
};

export const updateGroup = async (id: number, userId: number, name: string, avatar_url: string) => {
  const isAdmin = await ConversationModel.isAdmin(id, userId);
  if (!isAdmin) throw new Error("Only admin can update group info");
  await ConversationModel.updateInfo(id, name, avatar_url);
  return ConversationModel.findById(id);
};

export const addMember = async (conversationId: number, userId: number, newMemberId: number) => {
  const isAdmin = await ConversationModel.isAdmin(conversationId, userId);
  if (!isAdmin) throw new Error("Only admin can add member");
  await ConversationModel.addMember(conversationId, newMemberId);
};

export const removeMember = async (conversationId: number, userId: number, targetId: number) => {
  const isAdmin = await ConversationModel.isAdmin(conversationId, userId);
  if (!isAdmin && userId !== targetId) throw new Error("Not authorized");
  await ConversationModel.removeMember(conversationId, targetId);
};

export const updateRole = async (conversationId: number, userId: number, targetId: number, role: string) => {
  const isAdmin = await ConversationModel.isAdmin(conversationId, userId);
  if (!isAdmin) throw new Error("Only admin can change role");
  await ConversationModel.updateMemberRole(conversationId, targetId, role);
};

export const setMuted = (conversationId: number, userId: number, muted: boolean) =>
  ConversationModel.setMuted(conversationId, userId, muted);

export const markRead = (conversationId: number, userId: number) =>
  ConversationModel.markRead(conversationId, userId);

export const listMembers = (conversationId: number) => ConversationModel.listMembers(conversationId);