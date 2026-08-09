import { pool } from "../config/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export const create = async (conversationId: number, messageId: number, pinnedBy: number) => {
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO pinned_messages (conversation_id, message_id, pinned_by) VALUES (?, ?, ?)",
    [conversationId, messageId, pinnedBy]
  );
  return result.insertId;
};

export const findByMessage = async (conversationId: number, messageId: number) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM pinned_messages WHERE conversation_id = ? AND message_id = ?",
    [conversationId, messageId]
  );
  return rows[0] || null;
};

export const remove = async (conversationId: number, messageId: number) => {
  await pool.query(
    "DELETE FROM pinned_messages WHERE conversation_id = ? AND message_id = ?",
    [conversationId, messageId]
  );
};

export const countByConversation = async (conversationId: number) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS total FROM pinned_messages WHERE conversation_id = ?",
    [conversationId]
  );
  return rows[0].total as number;
};

// JOIN sẵn để lấy đủ nội dung tin nhắn + người gửi + người ghim, không cần gọi thêm API
export const listByConversation = async (conversationId: number) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 
       p.id AS pin_id, p.pinned_at, p.pinned_by,
       pu.name AS pinned_by_name,
       m.id AS message_id, m.content, m.type AS message_type, m.sender_id, m.created_at AS message_created_at,
       su.name AS sender_name, su.avatar_url AS sender_avatar_url
     FROM pinned_messages p
     JOIN messages m ON m.id = p.message_id AND m.is_deleted = false
     JOIN users su ON su.id = m.sender_id
     JOIN users pu ON pu.id = p.pinned_by
     WHERE p.conversation_id = ?
     ORDER BY p.pinned_at DESC`,
    [conversationId]
  );
  return rows;
};