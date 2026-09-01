import * as ConversationModel from "../models/conversation.model";
import * as FriendshipModel from "../models/friendship.model";
import * as BlockModel from "../models/block.model";
import * as UserModel from "../models/user.model";
import * as MessageModel from "../models/message.model";
import * as NotificationService from "./notification.service";
import { getIO } from "../sockets/io-registry";
import { isUserOnline } from "../sockets/presence";

function mapConversationRow(row: any) {
  const isPrivate = row.type === "private";

  // MỚI — tối đa 2 avatar đầu tiên theo joined_at tăng dần, CHỈ áp dụng cho
  // group. avatar_url có thể null (user chưa set avatar) -> lọc bỏ trước khi
  // trả về, tránh mảng có phần tử null làm FE render vỡ collage
  const member_avatars = !isPrivate && row.member_avatars_raw
    ? String(row.member_avatars_raw).split("||").filter((url: string) => url && url !== "null")
    : undefined;

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
    last_message: row.last_message_content !== null || row.last_message_type
      ? {
          content: row.last_message_content,
          type: row.last_message_type,
          sender_id: row.last_message_sender_id,
          created_at: row.last_message_created_at,
        }
      : null,
    last_read_at: row.my_last_read_at,
    member_avatars, // MỚI — chỉ có mặt (không phải undefined) khi type === 'group'
  };
}


export const joinConversationRoom = (conversationId: number, targetUserId: number) => {
  try {
    getIO().in(`user:${targetUserId}`).socketsJoin(`conversation:${conversationId}`);
  } catch {
    // io chưa init hoặc user không có socket đang mở — bỏ qua
  }
};

export const emitNewConversation = async (conversationId: number, targetUserId: number) => {
  try {
    const row = await ConversationModel.findDetailById(conversationId, targetUserId);
    if (!row) return;
    const conv = mapConversationRow(row);
    getIO().to(`user:${targetUserId}`).emit("conversation:new", conv);
  } catch {
    // io chưa init hoặc user không có socket đang mở — bỏ qua
  }
};

const notifyNewConversation = (conversationId: number, targetUserId: number) => {
  joinConversationRoom(conversationId, targetUserId);
  emitNewConversation(conversationId, targetUserId);
};

// MỚI (Bug 1) — 2 người vừa chính thức thành bạn: nếu trước đó đã có conversation
// private đang pending/rejected (do 1 bên từng nhắn làm quen), phải chuyển
// active NGAY, không để kẹt lại chờ có ai gõ tiếp mới active
export const activateExistingPrivate = async (userA: number, userB: number) => {
  const existed: any = await ConversationModel.findPrivateBetween(userA, userB);
  if (!existed) return;
  if (existed.status === "active") return;

  await ConversationModel.updateStatus(existed.id, "active");

  await NotificationService.clearPendingNotification(userA, existed.id);
  await NotificationService.clearPendingNotification(userB, existed.id);

  try {
    getIO().to(`conversation:${existed.id}`).emit("conversation:status", {
      conversationId: existed.id,
      status: "active",
    });
  } catch {
    // io chưa init — không fail luồng chính
  }
};

export const getOrCreatePrivate = async (userId: number, otherUserId: number) => {
  const blocked = await BlockModel.isBlockedEitherWay(userId, otherUserId);
  if (blocked) throw new Error("Cannot start conversation with this user");

  const existed = await ConversationModel.findPrivateBetween(userId, otherUserId);
  if (existed) {
    const row = await ConversationModel.findDetailById(existed.id, userId);
    return mapConversationRow(row);
  }

  const friendship = await FriendshipModel.findBetween(userId, otherUserId);
  const isFriend = friendship?.status === "accepted";
  const initialStatus = isFriend ? "active" : "pending";

  const id = await ConversationModel.create("private", null, userId, initialStatus);
  await ConversationModel.addMember(id, userId, "member");
  await ConversationModel.addMember(id, otherUserId, "member");

  if (isFriend) {
    notifyNewConversation(id, otherUserId);
  } else {
    joinConversationRoom(id, otherUserId);
  }

  const row = await ConversationModel.findDetailById(id, userId);
  return mapConversationRow(row);
};

export const createGroup = async (
  userId: number,
  name: string,
  memberIds: number[],
  avatarUrl: string | null = null
) => {
  const id = await ConversationModel.create("group", name, userId, "active", avatarUrl);
  await ConversationModel.addMember(id, userId, "admin");

  const otherMemberIds = memberIds.filter((memberId) => memberId !== userId);
  for (const memberId of otherMemberIds) {
    await ConversationModel.addMember(id, memberId, "member");
  }

  for (const memberId of otherMemberIds) {
    notifyNewConversation(id, memberId);
  }

  const row = await ConversationModel.findDetailById(id, userId);
  return mapConversationRow(row);
};

export const listConversations = async (userId: number) => {
  const rows = await ConversationModel.listForUser(userId);
  return rows.map(mapConversationRow);
};

export const listPending = async (userId: number) => {
  const rows = await ConversationModel.listPendingForUser(userId);
  return rows.map(mapConversationRow);
};

export const getConversation = async (id: number, userId: number) => {
  const wasMember = await ConversationModel.wasMember(id, userId);
  if (!wasMember) throw new Error("Not a member of this conversation");

  const row: any = await ConversationModel.findDetailById(id, userId);
  if (!row) throw new Error("Conversation not found");

  const conv = mapConversationRow(row);

  let is_blocked_by_other = false;
  let is_online = false;
  let last_seen_at = null; // MỚI

  if (conv.type === "private" && conv.other_user_id) {
    is_blocked_by_other = await BlockModel.isBlockedByUser(userId, conv.other_user_id);
    is_online = isUserOnline(conv.other_user_id);

    // chỉ query DB khi offline — đang online thì UI ưu tiên hiện "Đang hoạt
    // động", không cần last_seen_at, tránh 1 lượt query thừa cho case phổ
    // biến hơn
    if (!is_online) {
      const otherUser = await UserModel.findById(conv.other_user_id);
      last_seen_at = otherUser?.last_seen_at ?? null;
    }
  }

  return { ...conv, is_blocked_by_other, is_online, last_seen_at };
};

export const acceptPending = async (conversationId: number, userId: number) => {
  const conv: any = await ConversationModel.findById(conversationId);
  if (!conv) throw new Error("Conversation not found");
  if (conv.status !== "pending") throw new Error("Conversation is not pending");
  if (conv.created_by === userId) throw new Error("Cannot accept your own request");

  const isMember = await ConversationModel.isMember(conversationId, userId);
  if (!isMember) throw new Error("Not authorized");

  await ConversationModel.updateStatus(conversationId, "active");
  await NotificationService.clearPendingNotification(userId, conversationId);

  try {
    getIO().to(`conversation:${conversationId}`).emit("conversation:status", {
      conversationId,
      status: "active",
    });
  } catch {
    // io chưa init — không fail REST
  }

  return { id: conversationId, status: "active" };
};

export const rejectPending = async (conversationId: number, userId: number) => {
  const conv: any = await ConversationModel.findById(conversationId);
  if (!conv) throw new Error("Conversation not found");
  if (conv.status !== "pending") throw new Error("Conversation is not pending");
  if (conv.created_by === userId) throw new Error("Cannot reject your own request");

  const isMember = await ConversationModel.isMember(conversationId, userId);
  if (!isMember) throw new Error("Not authorized");

  await ConversationModel.updateStatus(conversationId, "rejected");
  await NotificationService.clearPendingNotification(userId, conversationId);

  try {
    getIO().to(`conversation:${conversationId}`).emit("conversation:status", {
      conversationId,
      status: "rejected",
    });
  } catch {
    // io chưa init — không fail REST
  }

  return { id: conversationId, status: "rejected" };
};

export const updateGroup = async (
  id: number,
  userId: number,
  name?: string,
  avatar_url?: string
) => {
  const isAdmin = await ConversationModel.isAdmin(id, userId);
  if (!isAdmin) throw new Error("Only admin can update group info");

  const current: any = await ConversationModel.findById(id);
  if (!current) throw new Error("Conversation not found");

  // MỚI — chặn đổi tên/avatar cho conversation private. Về mặt hiển thị
  // private luôn lấy tên/avatar từ other_user (mapConversationRow), nên ghi
  // vào cột name/avatar_url của bảng conversations ở đây chỉ tạo dữ liệu rác
  // và tin nhắn hệ thống vô nghĩa — chặn sớm ở service, không phụ thuộc UI
  if (current.type !== "group") {
    throw new Error("Only group conversations can be updated");
  }

  const finalName = name !== undefined ? name : current.name;
  const finalAvatarUrl = avatar_url !== undefined ? avatar_url : current.avatar_url;

  const nameChanged = name !== undefined && name !== current.name;
  const avatarChanged = avatar_url !== undefined && avatar_url !== current.avatar_url;

  await ConversationModel.updateInfo(id, finalName, finalAvatarUrl);

  if (nameChanged || avatarChanged) {
    const actorUser = await UserModel.findById(userId);

    let content: string;
    if (nameChanged && avatarChanged) {
      content = `${actorUser?.name} đã đổi tên nhóm thành "${finalName}" và cập nhật ảnh nhóm.`;
    } else if (nameChanged) {
      content = `${actorUser?.name} đã đổi tên nhóm thành "${finalName}".`;
    } else {
      content = `${actorUser?.name} đã cập nhật ảnh nhóm.`;
    }

    const messageId = await MessageModel.create(id, userId, content, "system");
    const message = await MessageModel.findById(messageId);
    const fullMessage = {
      ...message,
      attachments: [],
      system_meta: { event: "updated_info", targetUserId: null },
    };

    try {
      const io = getIO();
      io.to(`conversation:${id}`).emit("message:new", fullMessage);
      io.to(`conversation:${id}`).emit("conversation:updated", {
        conversationId: id,
        name: finalName,
        avatar_url: finalAvatarUrl,
      });
    } catch {
      // io chưa init — không fail REST
    }
  }

  return ConversationModel.findById(id);
};

export const addMember = async (conversationId: number, userId: number, newMemberId: number) => {
  const isAdmin = await ConversationModel.isAdmin(conversationId, userId);
  if (!isAdmin) throw new Error("Only admin can add member");
  await ConversationModel.addMember(conversationId, newMemberId);

  notifyNewConversation(conversationId, newMemberId);

  const actorUser = await UserModel.findById(userId);
  const newMemberUser = await UserModel.findById(newMemberId);
  const content = `${actorUser?.name} đã thêm ${newMemberUser?.name} vào nhóm.`;

  const messageId = await MessageModel.create(conversationId, userId, content, "system");
  const message = await MessageModel.findById(messageId);
  // MỚI — system_meta để FE phân biệt đúng sự kiện, không đoán qua sender_id
  // (không lưu DB, chỉ tồn tại trong payload emit lúc real-time)
  const fullMessage = {
    ...message,
    attachments: [],
    system_meta: { event: "added", targetUserId: newMemberId },
  };

  try {
    getIO().to(`conversation:${conversationId}`).emit("message:new", fullMessage);
  } catch {
    // io chưa init — không fail REST
  }
};


export const removeMember = async (
  conversationId: number,
  userId: number,
  targetId: number,
  newAdminId?: number
) => {
  const isAdmin = await ConversationModel.isAdmin(conversationId, userId);
  if (!isAdmin && userId !== targetId) throw new Error("Not authorized");

  const isSelfLeave = userId === targetId;

  if (isSelfLeave && isAdmin) {
    const members = await ConversationModel.listMembers(conversationId);
    const otherAdmins = members.filter((m: any) => m.role === "admin" && m.id !== userId);
    const otherMembers = members.filter((m: any) => m.id !== userId);

    if (otherAdmins.length === 0 && otherMembers.length > 0) {
      if (!newAdminId) {
        throw new Error("MUST_ASSIGN_NEW_ADMIN");
      }
      const targetIsMember = otherMembers.some((m: any) => m.id === newAdminId);
      if (!targetIsMember) throw new Error("Người được chọn không phải thành viên nhóm");
      await ConversationModel.updateMemberRole(conversationId, newAdminId, "admin");
    }
  }

  const targetUser = await UserModel.findById(targetId);
  const actorUser = isSelfLeave ? targetUser : await UserModel.findById(userId);

  await ConversationModel.removeMember(conversationId, targetId, isSelfLeave ? "left" : "kicked");

  const content = isSelfLeave
    ? `${targetUser?.name} đã rời khỏi nhóm.`
    : `${actorUser?.name} đã xoá ${targetUser?.name} khỏi nhóm.`;

  const messageId = await MessageModel.create(conversationId, targetId, content, "system");
  const message = await MessageModel.findById(messageId);
  // MỚI — system_meta cho cả 2 case, event khác nhau ("left" | "kicked")
  const fullMessage = {
    ...message,
    attachments: [],
    system_meta: { event: isSelfLeave ? "left" : "kicked", targetUserId: targetId },
  };

  try {
    const io = getIO();
    io.to(`conversation:${conversationId}`).emit("message:new", fullMessage);

    // REVERT — luôn socketsLeave cho CẢ 2 trường hợp (tự rời VÀ bị kick).
    // Người bị kick không nhận tin nhắn mới sau khi bị xoá, vẫn xem lịch sử
    // cũ bình thường qua REST (wasMember không phụ thuộc room này)
    io.in(`user:${targetId}`).socketsLeave(`conversation:${conversationId}`);
  } catch {
    // io chưa init — không fail REST
  }
};

export const updateRole = async (conversationId: number, userId: number, targetId: number, role: string) => {
  const isAdmin = await ConversationModel.isAdmin(conversationId, userId);
  if (!isAdmin) throw new Error("Only admin can change role");

  await ConversationModel.updateMemberRole(conversationId, targetId, role);

  const actorUser = await UserModel.findById(userId);
  const targetUser = await UserModel.findById(targetId);
  const content = role === "admin"
    ? `${actorUser?.name} đã chuyển quyền quản trị viên cho ${targetUser?.name}.`
    : `${actorUser?.name} đã đổi vai trò của ${targetUser?.name} thành thành viên.`;

  const messageId = await MessageModel.create(conversationId, userId, content, "system");
  const message = await MessageModel.findById(messageId);
  const fullMessage = {
    ...message,
    attachments: [],
    system_meta: { event: "role_changed", targetUserId: targetId },
  };

  try {
    const io = getIO();
    io.to(`conversation:${conversationId}`).emit("message:new", fullMessage);
    io.to(`conversation:${conversationId}`).emit("conversation:role-changed", {
      conversationId,
      userId: targetId, // người BỊ tác động (target) — không phải actor
      actorId: userId,  // MỚI — người thực hiện, để FE không cần parse content
      role,
    });
  } catch {
    // io chưa init — không fail REST
  }
};

export const setMuted = (conversationId: number, userId: number, muted: boolean) =>
  ConversationModel.setMuted(conversationId, userId, muted);

export const markRead = async (conversationId: number, userId: number) => {
  const isMember = await ConversationModel.isMember(conversationId, userId);
  if (!isMember) throw new Error("Not a member of this conversation");

  const lastReadAt = await ConversationModel.markRead(conversationId, userId);

  try {
    getIO().to(`conversation:${conversationId}`).emit("conversation:read", {
      conversationId,
      userId,
      lastReadAt,
    });
  } catch {
    // io chưa init — không fail REST
  }

  return { lastReadAt };
};

export const listMembers = async (conversationId: number) => {
  const rows = await ConversationModel.listMembers(conversationId);
  return rows.map((r: any) => ({ ...r, is_online: isUserOnline(r.id) }));
};

export const getMutualGroups = async (userId: number, otherUserId: number) => {
  const rows = await ConversationModel.listMutualGroups(userId, otherUserId);
  return rows.map((r: any) => {
    // đúng convention đã chốt ở mapConversationRow — luôn có field, null khi
    // không có avatar nào để hiện, không dùng undefined (undefined bị
    // JSON.stringify loại bỏ, khiến field biến mất khỏi response)
    const rawAvatars = r.member_avatars_raw
      ? String(r.member_avatars_raw).split("||").filter((url: string) => url && url !== "null")
      : [];

    return {
      id: r.id,
      name: r.name,
      avatar_url: r.avatar_url,
      member_count: r.member_count,
      member_avatars: rawAvatars.length > 0 ? rawAvatars : null,
    };
  });
};

export const findPrivateConversationId = async (userId: number, otherUserId: number) => {
  const conv: any = await ConversationModel.findPrivateBetween(userId, otherUserId);
  return conv ? conv.id : null;
};