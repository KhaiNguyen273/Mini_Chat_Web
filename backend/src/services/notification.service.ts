import * as NotificationModel from "../models/notification.model";

export const list = async (userId: number) => {
  const rows = await NotificationModel.listByUser(userId);

  return rows.map((row: any) => ({
    id: row.id,
    type: row.type,
    reference_id: row.reference_id,
    reference_type: row.reference_type,
    is_read: row.is_read,
    created_at: row.created_at,
    // preview đã lưu cứng lúc tạo — không phụ thuộc dữ liệu gốc còn tồn tại hay không
    preview: row.preview,
    actor: row.actor_id
      ? { id: row.actor_id, name: row.actor_name, avatar_url: row.actor_avatar_url }
      : null,
  }));
};

export const markRead = (id: number, userId: number) => NotificationModel.markRead(id, userId);
export const markAllRead = (userId: number) => NotificationModel.markAllRead(userId);

// thêm vào cuối file
export const upsertPendingNotification = (
  userId: number,
  actorId: number,
  conversationId: number,
  preview: string
) =>
  NotificationModel.upsertByReference(
    userId,
    actorId,
    "pending_message",
    conversationId,
    "conversation",
    preview
  );

export const clearPendingNotification = (userId: number, conversationId: number) =>
  NotificationModel.deleteByReference(userId, conversationId, "conversation");