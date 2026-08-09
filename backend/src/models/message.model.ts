import { pool } from "../config/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

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

export const listByConversation = async (
  conversationId: number,
  cursor: string | null,
  limit: number
) => {
  // 1. lấy danh sách tin nhắn như cũ
  const query = cursor
    ? `SELECT * FROM messages WHERE conversation_id = ? AND is_deleted = false AND created_at < ?
       ORDER BY created_at DESC LIMIT ?`
    : `SELECT * FROM messages WHERE conversation_id = ? AND is_deleted = false
       ORDER BY created_at DESC LIMIT ?`;   
  const params = cursor ? [conversationId, cursor, limit] : [conversationId, limit];
  const [messages] = await pool.query<RowDataPacket[]>(query, params);

  if (messages.length === 0) return [];

  // 2. lấy TẤT CẢ attachments của các message này trong 1 query duy nhất (tránh N+1)
  const messageIds = messages.map((m) => m.id);
  const [attachments] = await pool.query<RowDataPacket[]>(
    `SELECT id, message_id, file_url, file_name, file_size, file_type
     FROM message_attachments
     WHERE message_id IN (?)`,
    [messageIds]
  );

  // 3. gộp attachments vào đúng message tương ứng
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