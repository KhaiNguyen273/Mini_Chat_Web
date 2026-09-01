import { pool } from "../config/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export const create = async (blockerId: number, blockedId: number) => {
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO blocked_users (blocker_id, blocked_id) VALUES (?, ?)",
    [blockerId, blockedId]
  );
  return result.insertId;
};

export const remove = async (blockerId: number, blockedId: number) => {
  await pool.query(
    "DELETE FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?",
    [blockerId, blockedId]
  );
};

export const findOne = async (blockerId: number, blockedId: number) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?",
    [blockerId, blockedId]
  );
  return rows[0] || null;
};

// A chặn B HOẶC B chặn A — dùng để CHẶN hành động (tạo conversation, gửi tin)
export const isBlockedEitherWay = async (userA: number, userB: number) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM blocked_users 
     WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?)`,
    [userA, userB, userB, userA]
  );
  return rows.length > 0;
};

// mới — chỉ check 1 chiều cụ thể: "otherUserId có đang chặn currentUserId không"
export const isBlockedByUser = async (currentUserId: number, otherUserId: number) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?",
    [otherUserId, currentUserId]
  );
  return rows.length > 0;
};

export const listByBlocker = async (blockerId: number) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT b.id, b.created_at, u.id AS user_id, u.name, u.avatar_url
     FROM blocked_users b JOIN users u ON u.id = b.blocked_id
     WHERE b.blocker_id = ?
     ORDER BY b.created_at DESC`,
    [blockerId]
  );
  return rows;
};