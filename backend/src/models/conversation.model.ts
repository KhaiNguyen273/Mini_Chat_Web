import { pool } from "../config/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export const findPrivateBetween = async (userA: number, userB: number) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT c.* FROM conversations c
     JOIN conversation_members m1 ON m1.conversation_id = c.id AND m1.user_id = ?
     JOIN conversation_members m2 ON m2.conversation_id = c.id AND m2.user_id = ?
     WHERE c.type = 'private'`,
    [userA, userB]
  );
  return rows[0] || null;
};

export const create = async (type: string, name: string | null, createdBy: number, status = "active") => {
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO conversations (type, name, created_by, status) VALUES (?, ?, ?, ?)",
    [type, name, createdBy, status]
  );
  return result.insertId;
};

export const addMember = async (conversationId: number, userId: number, role = "member") => {
  await pool.query(
    "INSERT INTO conversation_members (conversation_id, user_id, role) VALUES (?, ?, ?)",
    [conversationId, userId, role]
  );
};

export const findById = async (id: number) => {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM conversations WHERE id = ?", [id]);
  return rows[0] || null;
};
const CONVERSATION_DETAIL_SELECT = `
  SELECT 
    c.id, c.type, c.status, c.created_by, c.created_at, c.updated_at,
    c.name AS group_name,
    c.avatar_url AS group_avatar_url,
    ou.id AS other_user_id,
    ou.name AS other_user_name,
    ou.avatar_url AS other_user_avatar_url,
    lm.content AS last_message_content,
    lm.sender_id AS last_message_sender_id,
    lm.created_at AS last_message_created_at,
    (SELECT COUNT(*) FROM pinned_messages pm WHERE pm.conversation_id = c.id) AS pinned_count
  FROM conversations c
  LEFT JOIN conversation_members om 
    ON om.conversation_id = c.id AND om.user_id != ? AND c.type = 'private'
  LEFT JOIN users ou ON ou.id = om.user_id
  LEFT JOIN messages lm 
    ON lm.id = (
      SELECT m2.id FROM messages m2
      WHERE m2.conversation_id = c.id AND m2.is_deleted = false
      ORDER BY m2.created_at DESC
      LIMIT 1
    )
`;

export const listForUser = async (userId: number) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `${CONVERSATION_DETAIL_SELECT}
     JOIN conversation_members m ON m.conversation_id = c.id AND m.user_id = ?
     WHERE c.type != 'private' OR ou.is_deleted = false OR ou.id IS NULL
     ORDER BY c.updated_at DESC, c.created_at DESC`,
    [userId, userId]
  );
  return rows;
};

export const findDetailById = async (conversationId: number, userId: number) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `${CONVERSATION_DETAIL_SELECT}
     WHERE c.id = ?`,
    [userId, conversationId]
  );
  return rows[0] || null;
};

export const listPendingForUser = async (userId: number) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `${CONVERSATION_DETAIL_SELECT}
     JOIN conversation_members m ON m.conversation_id = c.id AND m.user_id = ?
     WHERE c.status = 'pending' AND c.created_by != ?
     ORDER BY c.created_at DESC`,
    [userId, userId, userId]
  );
  return rows;
};

export const updateStatus = async (id: number, status: string) => {
  await pool.query("UPDATE conversations SET status = ? WHERE id = ?", [status, id]);
};

export const updateInfo = async (id: number, name: string, avatar_url: string) => {
  await pool.query(
    "UPDATE conversations SET name = ?, avatar_url = ?, updated_at = NOW() WHERE id = ?",
    [name, avatar_url, id]
  );
};

export const touchUpdatedAt = async (id: number) => {
  await pool.query("UPDATE conversations SET updated_at = NOW() WHERE id = ?", [id]);
};

export const isMember = async (conversationId: number, userId: number) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM conversation_members WHERE conversation_id = ? AND user_id = ?",
    [conversationId, userId]
  );
  return rows.length > 0;
};

export const isAdmin = async (conversationId: number, userId: number) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM conversation_members WHERE conversation_id = ? AND user_id = ? AND role = 'admin'",
    [conversationId, userId]
  );
  return rows.length > 0;
};

export const removeMember = async (conversationId: number, userId: number) => {
  await pool.query(
    "DELETE FROM conversation_members WHERE conversation_id = ? AND user_id = ?",
    [conversationId, userId]
  );
};

export const updateMemberRole = async (conversationId: number, userId: number, role: string) => {
  await pool.query(
    "UPDATE conversation_members SET role = ? WHERE conversation_id = ? AND user_id = ?",
    [role, conversationId, userId]
  );
};

export const setMuted = async (conversationId: number, userId: number, muted: boolean) => {
  await pool.query(
    "UPDATE conversation_members SET is_muted = ? WHERE conversation_id = ? AND user_id = ?",
    [muted, conversationId, userId]
  );
};

export const markRead = async (conversationId: number, userId: number) => {
  await pool.query(
    "UPDATE conversation_members SET last_read_at = NOW() WHERE conversation_id = ? AND user_id = ?",
    [conversationId, userId]
  );
};

export const listMembers = async (conversationId: number) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT u.id, u.name, u.avatar_url, m.role, m.joined_at, m.is_muted
     FROM conversation_members m JOIN users u ON u.id = m.user_id
     WHERE m.conversation_id = ?`,
    [conversationId]
  );
  return rows;
};