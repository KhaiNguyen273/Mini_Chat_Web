import { pool } from "../config/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export const create = async (
  userId: number,
  actorId: number,
  type: string,
  referenceId: number | null,
  referenceType: string | null,
  preview: string | null
) => {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO notifications (user_id, actor_id, type, reference_id, reference_type, preview) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, actorId, type, referenceId, referenceType, preview]
  );
  return result.insertId;
};

// JOIN cố định sang users theo actor_id — không cần CASE/điều kiện theo reference_type nữa
export const listByUser = async (userId: number) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 
       n.id, n.type, n.reference_id, n.reference_type, n.preview, n.is_read, n.created_at,
       u.id AS actor_id, u.name AS actor_name, u.avatar_url AS actor_avatar_url
     FROM notifications n
     LEFT JOIN users u ON u.id = n.actor_id
     WHERE n.user_id = ?
     ORDER BY n.created_at DESC
     LIMIT 50`,
    [userId]
  );
  return rows;
};

export const markRead = async (id: number, userId: number) => {
  await pool.query(
    "UPDATE notifications SET is_read = true WHERE id = ? AND user_id = ?",
    [id, userId]
  );
};

export const markAllRead = async (userId: number) => {
  await pool.query("UPDATE notifications SET is_read = true WHERE user_id = ?", [userId]);
};

// thêm vào file hiện có, giữ nguyên các hàm cũ

// upsert — nếu đã có notification pending cho conversation này thì UPDATE, chưa có thì INSERT
export const upsertByReference = async (
  userId: number,
  actorId: number,
  type: string,
  referenceId: number,
  referenceType: string,
  preview: string
) => {
  await pool.query(
    `INSERT INTO notifications (user_id, actor_id, type, reference_id, reference_type, preview, is_read)
     VALUES (?, ?, ?, ?, ?, ?, false)
     ON DUPLICATE KEY UPDATE 
       actor_id = VALUES(actor_id),
       preview = VALUES(preview),
       is_read = false,
       created_at = NOW()`,
    [userId, actorId, type, referenceId, referenceType, preview]
  );
};

// xoá notification theo reference — dùng khi accept/reject
export const deleteByReference = async (userId: number, referenceId: number, referenceType: string) => {
  await pool.query(
    "DELETE FROM notifications WHERE user_id = ? AND reference_id = ? AND reference_type = ?",
    [userId, referenceId, referenceType]
  );
};