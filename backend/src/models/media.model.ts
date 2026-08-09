import { pool } from "../config/db";
import { RowDataPacket } from "mysql2";

// category: 'image' | 'video' | 'file' | undefined (undefined = lấy tất cả)
export const listByConversation = async (
  conversationId: number,
  category: string | undefined,
  cursor: string | null,
  limit: number
) => {
  const conditions = ["ma.conversation_id = ?"];
  const params: any[] = [conversationId];

  if (category) {
    conditions.push("ma.category = ?");
    params.push(category);
  }
  if (cursor) {
    conditions.push("ma.created_at < ?");
    params.push(cursor);
  }
  params.push(limit);

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 
       ma.id, ma.message_id, ma.file_url, ma.file_name, ma.file_size, 
       ma.file_type, ma.category, ma.created_at,
       m.sender_id, u.name AS sender_name
     FROM message_attachments ma
     JOIN messages m ON m.id = ma.message_id AND m.is_deleted = false
     JOIN users u ON u.id = m.sender_id
     WHERE ${conditions.join(" AND ")}
     ORDER BY ma.created_at DESC
     LIMIT ?`,
    params
  );
  return rows;
};

export const countByCategory = async (conversationId: number) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT category, COUNT(*) AS total 
     FROM message_attachments 
     WHERE conversation_id = ? 
     GROUP BY category`,
    [conversationId]
  );
  return rows; // [{category: 'image', total: 12}, {category: 'file', total: 3}, ...]
};