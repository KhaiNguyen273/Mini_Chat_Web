import { pool } from "../config/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

function toMySQLDateTime(isoString: string): string {
  // "2026-08-15T06:48:14.000Z" → "2026-08-15 06:48:14"
  return new Date(isoString).toISOString().slice(0, 19).replace('T', ' ');
}

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

// giữ nguyên findById cũ — dùng nội bộ (deleteMessage, editMessage, sendMessage...)
export const findById = async (id: number) => {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM messages WHERE id = ?", [id]);
  return rows[0] || null;
};

// mới — dùng riêng cho GET /messages/:id, trả đủ field + attachments giống format list
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

// mỗi tin nhắn chỉ hợp lệ nếu created_at nằm trong 1 giai đoạn user thực sự
// là thành viên tại thời điểm đó — JOIN với conversation_membership_periods
export const listByConversation = async (
  conversationId: number,
  userId: number, // MỚI — bắt buộc để lọc đúng theo người xem
  cursor: string | null,
  limit: number,
  q?: string | null
) => {
  // ĐÃ SỬA thứ tự bind — p.user_id = ? xuất hiện TRƯỚC m.conversation_id = ?
  // trong câu SQL bên dưới, nên userId phải đứng trước conversationId
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
    params.push(toMySQLDateTime(cursor));
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

// message.model.ts — thêm hàm mới, song song với listByConversation
// tương tự cho listAfter — dùng cho polling/jump-to-message
export const listAfter = async (
  conversationId: number,
  userId: number, // MỚI
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
    [userId, conversationId, afterCursor, limit]
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