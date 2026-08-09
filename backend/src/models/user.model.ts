import { pool } from "../config/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export interface User extends RowDataPacket {
  id: number;
  phone: string;
  password: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  is_deleted: boolean;
}

export const findByPhone = async (phone: string) => {
  const [rows] = await pool.query<User[]>(
    "SELECT * FROM users WHERE phone = ? AND is_deleted = false",
    [phone]
  );
  return rows[0] || null;
};

export const findById = async (id: number) => {
  const [rows] = await pool.query<User[]>(
    "SELECT id, phone, name, bio, avatar_url FROM users WHERE id = ? AND is_deleted = false",
    [id]
  );
  return rows[0] || null;
};

export const createUser = async (phone: string, password: string, name: string) => {
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO users (phone, password, name) VALUES (?, ?, ?)",
    [phone, password, name]
  );
  return result.insertId;
};

export const updateProfile = async (id: number, name: string, bio: string, avatar_url: string) => {
  await pool.query(
    "UPDATE users SET name = ?, bio = ?, avatar_url = ?, updated_at = NOW() WHERE id = ?",
    [name, bio, avatar_url, id]
  );
};

export const updatePassword = async (id: number, hashedPassword: string) => {
  await pool.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, id]);
};

export const softDelete = async (id: number) => {
  await pool.query("UPDATE users SET is_deleted = true WHERE id = ?", [id]);
};

export const searchByPhone = async (phone: string, currentUserId: number) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 
       u.id, u.phone, u.name, u.avatar_url,
       f.id AS friendship_id,
       f.status AS friendship_status,
       f.requester_id AS friendship_requester_id
     FROM users u
     LEFT JOIN friendships f 
       ON (f.requester_id = ? AND f.receiver_id = u.id)
       OR (f.requester_id = u.id AND f.receiver_id = ?)
     WHERE u.phone LIKE ? 
       AND u.is_deleted = false 
       AND u.id != ?
     LIMIT 20`,
    [currentUserId, currentUserId, `%${phone}%`, currentUserId]
  );
  return rows;
};