import { pool } from "../config/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export const findBetween = async (userA: number, userB: number) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM friendships 
     WHERE (requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?)`,
    [userA, userB, userB, userA]
  );
  return rows[0] || null;
};

export const create = async (requesterId: number, receiverId: number) => {
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO friendships (requester_id, receiver_id, status) VALUES (?, ?, 'pending')",
    [requesterId, receiverId]
  );
  return result.insertId;
};

export const findById = async (id: number) => {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM friendships WHERE id = ?", [id]);
  return rows[0] || null;
};

export const updateStatus = async (id: number, status: string) => {
  await pool.query("UPDATE friendships SET status = ?, updated_at = NOW() WHERE id = ?", [status, id]);
};

export const remove = async (id: number) => {
  await pool.query("DELETE FROM friendships WHERE id = ?", [id]);
};

export const listFriends = async (userId: number) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT u.id, u.name, u.avatar_url, u.last_seen_at, f.id as friendship_id
     FROM friendships f
     JOIN users u ON u.id = CASE WHEN f.requester_id = ? THEN f.receiver_id ELSE f.requester_id END
     WHERE (f.requester_id = ? OR f.receiver_id = ?) AND f.status = 'accepted'`,
    [userId, userId, userId]
  );
  return rows;
};

export const listPendingRequests = async (userId: number) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT f.id, f.requester_id AS sender_id, f.status, u.name, u.avatar_url 
     FROM friendships f
     JOIN users u ON u.id = f.requester_id
     WHERE f.receiver_id = ? AND f.status = 'pending'`,
    [userId]
  );
  return rows;
};