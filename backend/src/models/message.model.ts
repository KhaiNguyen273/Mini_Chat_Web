import { pool } from "../config/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

// XOÁ hẳn hàm toMySQLDateTime — không cần format tay nữa

export const create = async (
  conversationId: number,
  senderId: number,
  content: string | null,
  type: string
) => {
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO messages (conversation_id, sender_id, content, type) VALUES (?, ?, ?, ?)",
    [conversationId, senderId, content, type]
  );
  return result.insertId;
};

export const findById = async (id: number) => {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM messages WHERE id = ?", [id]);
  return rows[0] || null;
};

export const findByIdWithAttachments = async (id: number) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM messages WHERE id = ? AND is_deleted = false",
    [id]
  );
  const message = rows[0];
  if (!message) return null;

  const [attachments] = await pool.query<RowDataPacket[]>(
    `SELECT id, message_id, file_url, file_name, file_size, file_type, category
     FROM message_attachments
     WHERE message_id = ?`,
    [id]
  );

  return { ...message, attachments };
};

export const listByConversation = async (
  conversationId: number,
  userId: number,
  cursor: string | null,
  limit: number,
  q?: string | null
) => {
  const params: any[] = [userId, conversationId];
  let sql = `
    SELECT DISTINCT m.* FROM messages m
    JOIN conversation_membership_periods p 
      ON p.conversation_id = m.conversation_id 
      AND p.user_id = ?
      AND m.created_at >= p.joined_at
      AND (p.left_at IS NULL OR m.created_at <= p.left_at)
    WHERE m.conversation_id = ? AND m.is_deleted = false
  `;

  if (cursor) {
    sql += " AND m.created_at < ?";
    // MỚI — truyền Date object thay vì tự cắt chuỗi ISO. Pool cấu hình
    // timezone: '+07:00' chỉ quy đổi đúng múi giờ khi param là Date; trước
    // đây gửi string UTC thô nên lệch 7 tiếng so với dữ liệu lưu local
    // trong DB, khiến cả 1 khoảng tin nhắn cũ bị bỏ sót, nextCursor sớm về
    // null và hasMore rớt false chỉ sau 1-2 lần load
    params.push(new Date(cursor));
  }
  if (q) {
    sql += " AND m.content LIKE ?";
    params.push(`%${q}%`);
  }
  sql += " ORDER BY m.created_at DESC, m.id DESC LIMIT ?";
  params.push(limit);

  const [messages] = await pool.query<RowDataPacket[]>(sql, params);

  if (messages.length === 0) return [];

  const messageIds = messages.map((m) => m.id);
  const [attachments] = await pool.query<RowDataPacket[]>(
    `SELECT id, message_id, file_url, file_name, file_size, file_type, category
     FROM message_attachments
     WHERE message_id IN (?)`,
    [messageIds]
  );

  return messages.map((m) => ({
    ...m,
    attachments: attachments.filter((a) => a.message_id === m.id),
  }));
};

export const softDelete = async (id: number) => {
  await pool.query("UPDATE messages SET is_deleted = true WHERE id = ?", [id]);
};

export const updateContent = async (id: number, content: string) => {
  await pool.query("UPDATE messages SET content = ?, updated_at = NOW() WHERE id = ?", [content, id]);
};

export const addAttachment = async (
  messageId: number,
  conversationId: number,
  fileUrl: string,
  fileName: string,
  fileSize: number,
  fileType: string,
  category: "image" | "video" | "file"
) => {
  await pool.query(
    `INSERT INTO message_attachments 
       (message_id, conversation_id, file_url, file_name, file_size, file_type, category) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [messageId, conversationId, fileUrl, fileName, fileSize, fileType, category]
  );
};

export const getAttachments = async (messageId: number) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM message_attachments WHERE message_id = ?",
    [messageId]
  );
  return rows;
};

export const markRead = async (messageId: number, userId: number) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM message_reads WHERE message_id = ? AND user_id = ?",
    [messageId, userId]
  );
  if (rows.length > 0) return;
  await pool.query("INSERT INTO message_reads (message_id, user_id) VALUES (?, ?)", [messageId, userId]);
};

export const getReaders = async (messageId: number) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT u.id, u.name, u.avatar_url, r.read_at
     FROM message_reads r JOIN users u ON u.id = r.user_id
     WHERE r.message_id = ?`,
    [messageId]
  );
  return rows;
};

export const listAfter = async (
  conversationId: number,
  userId: number,
  afterCursor: string,
  limit: number
) => {
  const [messages] = await pool.query<RowDataPacket[]>(
    `SELECT DISTINCT m.* FROM messages m
     JOIN conversation_membership_periods p 
       ON p.conversation_id = m.conversation_id 
       AND p.user_id = ?
       AND m.created_at >= p.joined_at
       AND (p.left_at IS NULL OR m.created_at <= p.left_at)
     WHERE m.conversation_id = ? AND m.is_deleted = false AND m.created_at > ?
     ORDER BY m.created_at ASC, m.id ASC LIMIT ?`,
    [userId, conversationId, new Date(afterCursor), limit] // MỚI — Date object, cùng lý do trên
  );

  if (messages.length === 0) return [];

  const messageIds = messages.map((m) => m.id);
  const [attachments] = await pool.query<RowDataPacket[]>(
    `SELECT id, message_id, file_url, file_name, file_size, file_type, category
     FROM message_attachments WHERE message_id IN (?)`,
    [messageIds]
  );

  return messages.map((m) => ({
    ...m,
    attachments: attachments.filter((a) => a.message_id === m.id),
  }));
};