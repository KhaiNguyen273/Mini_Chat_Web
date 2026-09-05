// import { pool } from "../config/db";
// import * as NotificationModel from "../models/notification.model";

// export const list = async (userId: number) => {
//   const rows = await NotificationModel.listByUser(userId);
//   return rows.map((row: any) => ({
//     id: row.id,
//     type: row.type,
//     reference_id: row.reference_id,
//     reference_type: row.reference_type,
//     conversation_id: row.conversation_id, // mới
//     is_read: row.is_read,
//     created_at: row.created_at,
//     preview: row.preview,
//     actor: row.actor_id
//       ? { id: row.actor_id, name: row.actor_name, avatar_url: row.actor_avatar_url }
//       : null,
//   }));
// };

// export const markRead = (id: number, userId: number) => NotificationModel.markRead(id, userId);
// export const markAllRead = (userId: number) => NotificationModel.markAllRead(userId);

// // mới — xoá notification "pending_message" khi conversation đã được accept/reject
// export const clearPendingNotification = async (userId: number, conversationId: number) => {
//   await pool.query(
//     `DELETE FROM notifications 
//      WHERE user_id = ? AND type = 'pending_message' AND reference_type = 'conversation' AND reference_id = ?`,
//     [userId, conversationId]
//   );
// };

// export const upsertPendingNotification = (
//   userId: number,
//   actorId: number,
//   conversationId: number,
//   preview: string
// ) =>
//   NotificationModel.upsertByReference(
//     userId, actorId, "pending_message", conversationId, "conversation", preview, conversationId
//   );


import { pool } from "../config/db";
import * as NotificationModel from "../models/notification.model";
import { getIO } from "../sockets/io-registry";

const mapNotificationRow = (row: any) => ({
  id: row.id,
  type: row.type,
  reference_id: row.reference_id,
  reference_type: row.reference_type,
  conversation_id: row.conversation_id,
  is_read: row.is_read,
  created_at: row.created_at,
  preview: row.preview,
  actor: row.actor_id
    ? { id: row.actor_id, name: row.actor_name, avatar_url: row.actor_avatar_url }
    : null,
});

export const list = async (userId: number) => {
  const rows = await NotificationModel.listByUser(userId);
  return rows.map(mapNotificationRow);
};

// ĐIỂM TẬP TRUNG DUY NHẤT để tạo notification loại thường (friend_request,
// friend_accepted, new_message...) — mọi nơi trong codebase (friendship.service,
// message.service) phải gọi qua đây thay vì NotificationModel.create trực tiếp,
// để không bao giờ quên emit realtime
export const create = async (
  userId: number,
  actorId: number,
  type: string,
  referenceId: number | null,
  referenceType: string | null,
  preview: string | null,
  conversationId: number | null
) => {
  const id = await NotificationModel.create(
    userId, actorId, type, referenceId, referenceType, preview, conversationId
  );

  try {
    const row = await NotificationModel.findById(id);
    if (row) getIO().to(`user:${userId}`).emit("notification:new", mapNotificationRow(row));
  } catch (err) {
  console.error('[notification] emit failed:', err);
}

  return id;
};

// upsert riêng cho pending_message (tin nhắn làm quen) — 1 conversation chỉ
// giữ 1 notification duy nhất, update lại thay vì tạo mới liên tục
export const upsertPendingNotification = async (
  userId: number,
  actorId: number,
  conversationId: number,
  preview: string
) => {
  await NotificationModel.upsertByReference(
    userId, actorId, "pending_message", conversationId, "conversation", preview, conversationId
  );

  try {
    const row = await NotificationModel.findByReference(userId, "pending_message", conversationId, "conversation");
    if (row) getIO().to(`user:${userId}`).emit("notification:new", mapNotificationRow(row));
  } catch (err) {
  console.error('[notification] emit failed:', err);
}
};

export const markRead = async (id: number, userId: number) => {
  await NotificationModel.markRead(id, userId);
  try {
    getIO().to(`user:${userId}`).emit("notification:read", { id });
  } catch {}
};

export const markAllRead = async (userId: number) => {
  await NotificationModel.markAllRead(userId);
  try {
    getIO().to(`user:${userId}`).emit("notification:read-all", {});
  } catch {}
};

// xoá notification "pending_message" khi conversation đã được accept/reject
export const clearPendingNotification = async (userId: number, conversationId: number) => {
  await pool.query(
    `DELETE FROM notifications 
     WHERE user_id = ? AND type = 'pending_message' AND reference_type = 'conversation' AND reference_id = ?`,
    [userId, conversationId]
  );

  try {
    getIO().to(`user:${userId}`).emit("notification:removed", {
      type: "pending_message",
      reference_type: "conversation",
      reference_id: conversationId,
    });
  } catch {}
};

// dọn notification friend_request khi lời mời bị thu hồi trước khi B phản
// hồi — khác clearPendingNotification (dành cho pending_message/tin nhắn
// làm quen), đây xoá theo reference_type "friendship"
export const deleteFriendRequestNotification = async (userId: number, friendshipId: number) => {
  await NotificationModel.deleteByReference(userId, friendshipId, "friendship");

  try {
    getIO().to(`user:${userId}`).emit("notification:removed", {
      type: "friend_request",
      reference_type: "friendship",
      reference_id: friendshipId,
    });
  } catch {
    // io chưa init — không fail REST
  }
};