import { pool } from "../config/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

const CONVERSATION_DETAIL_SELECT = `
  SELECT 
    c.id, c.type, c.status, c.created_by, c.created_at, c.updated_at,
    c.name AS group_name,
    c.avatar_url AS group_avatar_url,
    ou.id AS other_user_id,
    ou.name AS other_user_name,
    ou.avatar_url AS other_user_avatar_url,
    ou.is_deleted AS other_user_is_deleted,
    lm.content AS last_message_content,
    lm.sender_id AS last_message_sender_id,
    lm.created_at AS last_message_created_at,
    lm.type AS last_message_type,
    (SELECT COUNT(*) FROM pinned_messages pm WHERE pm.conversation_id = c.id) AS pinned_count,
    (SELECT cm_self.last_read_at FROM conversation_members cm_self 
      WHERE cm_self.conversation_id = c.id AND cm_self.user_id = ?) AS my_last_read_at,
    (SELECT cm_active.removed_at FROM conversation_members cm_active 
      WHERE cm_active.conversation_id = c.id AND cm_active.user_id = ?) AS my_removed_at,
    (
      SELECT SUBSTRING_INDEX(
        GROUP_CONCAT(u2.avatar_url ORDER BY cm.joined_at ASC SEPARATOR '||'),
        '||', 2
      )
      FROM conversation_members cm
      JOIN users u2 ON u2.id = cm.user_id
      WHERE cm.conversation_id = c.id AND cm.removed_at IS NULL
    ) AS member_avatars_raw
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

export const create = async (
  type: string,
  name: string | null,
  createdBy: number,
  status: string = "active",
  avatarUrl: string | null = null  // thêm
) => {
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO conversations (type, name, created_by, status, avatar_url) VALUES (?, ?, ?, ?, ?)",
    [type, name, createdBy, status, avatarUrl]
  );
  return result.insertId;
};

export const updateStatus = async (id: number, status: string) => {
  await pool.query(
    "UPDATE conversations SET status = ?, updated_at = NOW() WHERE id = ?",
    [status, id]
  );
};

export const reopenAsPending = async (id: number, newCreatorId: number) => {
  await pool.query(
    "UPDATE conversations SET status = 'pending', created_by = ?, updated_at = NOW() WHERE id = ?",
    [newCreatorId, id]
  );
};

// sửa — mở thêm 1 giai đoạn mới mỗi lần gọi (kể cả rejoin sau khi bị xoá)
export const addMember = async (conversationId: number, userId: number, role = "member") => {
  await pool.query(
    `INSERT INTO conversation_members (conversation_id, user_id, role, removed_at, removed_reason)
     VALUES (?, ?, ?, NULL, NULL)
     ON DUPLICATE KEY UPDATE removed_at = NULL, removed_reason = NULL, role = VALUES(role)`,
    [conversationId, userId, role]
  );
  await openMembershipPeriod(conversationId, userId);
};

export const findById = async (id: number) => {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM conversations WHERE id = ?", [id]);
  return rows[0] || null;
};


export const listForUser = async (userId: number) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `${CONVERSATION_DETAIL_SELECT}
     JOIN conversation_members m ON m.conversation_id = c.id AND m.user_id = ?
       AND (m.removed_at IS NULL OR m.removed_reason = 'kicked')
     WHERE (
         c.status = 'active'
         OR (c.type = 'private' AND c.status IN ('pending', 'rejected') AND c.created_by = ? AND lm.created_at IS NOT NULL)
       )
     ORDER BY c.updated_at DESC, c.created_at DESC`,
    // ĐÃ XOÁ điều kiện "ou.is_deleted = false" khỏi WHERE — private chat
    // với người đã vô hiệu hoá KHÔNG được biến mất khỏi sidebar, lịch sử
    // vẫn phải giữ nguyên (yêu cầu mới về tài khoản vô hiệu hoá)
    [userId, userId, userId, userId, userId]
  );
  return rows;
};


export const listPendingForUser = async (userId: number) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `${CONVERSATION_DETAIL_SELECT}
     JOIN conversation_members m ON m.conversation_id = c.id AND m.user_id = ?
     WHERE c.status = 'pending' AND c.created_by != ? AND lm.created_at IS NOT NULL
     ORDER BY c.created_at DESC`,
    [userId, userId, userId, userId, userId]
  );
  return rows;
};


export const findDetailById = async (conversationId: number, userId: number) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `${CONVERSATION_DETAIL_SELECT} WHERE c.id = ?`,
    [userId, userId, userId, conversationId]
  );
  return rows[0] || null;
};

export const listAdminGroupIds = async (userId: number): Promise<number[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT cm.conversation_id FROM conversation_members cm
     JOIN conversations c ON c.id = cm.conversation_id
     WHERE cm.user_id = ? AND cm.role = 'admin' AND cm.removed_at IS NULL AND c.type = 'group'`,
    [userId]
  );
  return rows.map((r) => r.conversation_id);
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
    "SELECT * FROM conversation_members WHERE conversation_id = ? AND user_id = ? AND removed_at IS NULL",
    [conversationId, userId]
  );
  return rows.length > 0;
};

export const isAdmin = async (conversationId: number, userId: number) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM conversation_members WHERE conversation_id = ? AND user_id = ? AND role = 'admin' AND removed_at IS NULL",
    [conversationId, userId]
  );
  return rows.length > 0;
};

// sửa — đóng giai đoạn hiện tại khi rời/bị kick
export const removeMember = async (
  conversationId: number,
  userId: number,
  reason: "left" | "kicked"
) => {
  await pool.query(
    "UPDATE conversation_members SET removed_at = NOW(), removed_reason = ? WHERE conversation_id = ? AND user_id = ?",
    [reason, conversationId, userId]
  );
  await closeMembershipPeriod(conversationId, userId, reason);
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
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT last_read_at FROM conversation_members WHERE conversation_id = ? AND user_id = ?",
    [conversationId, userId]
  );
  return rows[0]?.last_read_at ?? null;
};

export const listMembers = async (conversationId: number) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT u.id, u.name, u.avatar_url, u.last_seen_at, u.is_deleted, m.role, m.joined_at, m.is_muted, m.last_read_at
     FROM conversation_members m JOIN users u ON u.id = m.user_id
     WHERE m.conversation_id = ? AND m.removed_at IS NULL`,
    [conversationId]
  );
  return rows;
};

export const listMutualGroups = async (userId: number, otherUserId: number) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT c.id, c.name, c.avatar_url,
       (SELECT COUNT(*) FROM conversation_members cm2 WHERE cm2.conversation_id = c.id AND cm2.removed_at IS NULL) AS member_count,
       (
         SELECT SUBSTRING_INDEX(
           GROUP_CONCAT(u3.avatar_url ORDER BY cm3.joined_at ASC SEPARATOR '||'),
           '||', 2
         )
         FROM conversation_members cm3
         JOIN users u3 ON u3.id = cm3.user_id
         WHERE cm3.conversation_id = c.id AND cm3.removed_at IS NULL
       ) AS member_avatars_raw
     FROM conversations c
     JOIN conversation_members m1 ON m1.conversation_id = c.id AND m1.user_id = ? AND m1.removed_at IS NULL
     JOIN conversation_members m2 ON m2.conversation_id = c.id AND m2.user_id = ? AND m2.removed_at IS NULL
     WHERE c.type = 'group' AND c.status = 'active'
     ORDER BY c.updated_at DESC`,
    [userId, otherUserId]
  );
  return rows;
};

export const wasMember = async (conversationId: number, userId: number) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM conversation_members WHERE conversation_id = ? AND user_id = ?",
    [conversationId, userId]
  );
  return rows.length > 0;
};

// mở 1 giai đoạn thành viên mới — gọi mỗi khi addMember (cả lần đầu tạo
// conversation lẫn khi rejoin sau khi từng bị xoá). Guard NOT EXISTS để
// tránh tạo trùng giai đoạn đang mở nếu addMember lỡ bị gọi 2 lần liên tiếp
// cho cùng 1 user đang active
export const openMembershipPeriod = async (conversationId: number, userId: number) => {
  await pool.query(
    `INSERT INTO conversation_membership_periods (conversation_id, user_id, joined_at)
     SELECT ?, ?, NOW()
     WHERE NOT EXISTS (
       SELECT 1 FROM conversation_membership_periods
       WHERE conversation_id = ? AND user_id = ? AND left_at IS NULL
     )`,
    [conversationId, userId, conversationId, userId]
  );
};

// đóng giai đoạn đang mở (left_at IS NULL) khi user rời/bị kick
export const closeMembershipPeriod = async (
  conversationId: number,
  userId: number,
  reason: "left" | "kicked"
) => {
  await pool.query(
    `UPDATE conversation_membership_periods 
     SET left_at = NOW(), reason = ? 
     WHERE conversation_id = ? AND user_id = ? AND left_at IS NULL
     ORDER BY id DESC LIMIT 1`,
    [reason, conversationId, userId]
  );
};

// kiểm tra 1 tin nhắn có nằm trong giai đoạn user thực sự là thành viên
// tại thời điểm tin nhắn được tạo hay không — dùng cho getMessageById để
// chặn xem lén tin nhắn trong khoảng thời gian bị kick qua đường vòng
export const isMessageVisibleToUser = async (
  conversationId: number,
  userId: number,
  messageCreatedAt: string
) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 1 FROM conversation_membership_periods
     WHERE conversation_id = ? AND user_id = ?
       AND joined_at <= ? AND (left_at IS NULL OR ? <= left_at)
     LIMIT 1`,
    [conversationId, userId, messageCreatedAt, messageCreatedAt]
  );
  return rows.length > 0;
};

// dùng lúc disconnect — tại thời điểm đó socket.rooms đã bị Socket.IO tự
// rời hết, không dùng được nữa, nên phải query lại từ DB
export const listConversationIdsForUser = async (userId: number): Promise<number[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT DISTINCT conversation_id FROM conversation_members 
     WHERE user_id = ? AND removed_at IS NULL`,
    [userId]
  );
  return rows.map((r) => r.conversation_id);
};

export const findLastVisibleMessage = async (conversationId: number, userId: number) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT m.content, m.type, m.sender_id, m.created_at
     FROM messages m
     JOIN conversation_membership_periods p 
       ON p.conversation_id = m.conversation_id AND p.user_id = ?
       AND m.created_at >= p.joined_at AND (p.left_at IS NULL OR m.created_at <= p.left_at)
     WHERE m.conversation_id = ? AND m.is_deleted = false
     ORDER BY m.created_at DESC LIMIT 1`,
    [userId, conversationId]
  );
  return rows[0] || null;
};

export const searchConversationsByMessage = async (userId: number, keyword: string) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 
       c.id, c.type, c.name AS group_name, c.avatar_url AS group_avatar_url,
       ou.id AS other_user_id, ou.name AS other_user_name, ou.avatar_url AS other_user_avatar_url, ou.is_deleted AS other_user_is_deleted,
       COUNT(m.id) AS match_count,
       MAX(m.created_at) AS last_match_at,
       SUBSTRING_INDEX(GROUP_CONCAT(m.content ORDER BY m.created_at DESC SEPARATOR '||'), '||', 1) AS last_match_content
     FROM messages m
     JOIN conversation_members cm ON cm.conversation_id = m.conversation_id AND cm.user_id = ? 
       AND (cm.removed_at IS NULL OR cm.removed_reason = 'kicked')
     JOIN conversation_membership_periods p 
       ON p.conversation_id = m.conversation_id AND p.user_id = ?
       AND m.created_at >= p.joined_at AND (p.left_at IS NULL OR m.created_at <= p.left_at)
     JOIN conversations c ON c.id = m.conversation_id
     LEFT JOIN conversation_members om ON om.conversation_id = c.id AND om.user_id != ? AND c.type = 'private'
     LEFT JOIN users ou ON ou.id = om.user_id
     WHERE m.is_deleted = false AND m.content LIKE ? AND c.status = 'active'
     GROUP BY c.id
     ORDER BY last_match_at DESC
     LIMIT 30`,
    [userId, userId, userId, `%${keyword}%`]
  );
  return rows;
};