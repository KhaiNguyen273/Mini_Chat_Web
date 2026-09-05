import bcrypt from "bcrypt";
import * as UserModel from "../models/user.model";
import * as BlockModel from "../models/block.model";
import { isUserOnline } from "../sockets/presence";
import * as ConversationService from "./conversation.service";
import * as AuthService from "./auth.service";

export const getProfile = async (id: number) => {
  const user = await UserModel.findByIdIncludingDeleted(id);
  if (!user) throw new Error("User not found");

  if (user.is_deleted) {
    return {
      id: user.id,
      phone: '',
      name: 'Tài khoản đã vô hiệu hóa',
      bio: '',
      avatar_url: null,
      is_online: false,
      is_deactivated: true,
    };
  }

  return { ...user, is_online: isUserOnline(id) };
};
export const updateProfile = async (id: number, data: { name: string; bio: string; avatar_url: string }) => {
  await UserModel.updateProfile(id, data.name, data.bio, data.avatar_url);
  return getProfile(id);
};

export const changePassword = async (id: number, oldPassword: string, newPassword: string) => {
  const user = await UserModel.findByPhone((await UserModel.findById(id))!.phone);
  const match = await bcrypt.compare(oldPassword, user!.password);
  if (!match) throw new Error("Old password incorrect");

  const isSameAsOld = await bcrypt.compare(newPassword, user!.password);
  if (isSameAsOld) throw new Error("New password must be different from old password");

  const hashed = await bcrypt.hash(newPassword, 10);
  await UserModel.updatePassword(id, hashed);
};

export const deleteAccount = async (id: number) => {
  await UserModel.softDelete(id);
  await AuthService.revokeAllRefreshTokens(id);
  await ConversationService.reassignAdminForDeactivatedUser(id);
};

export const searchUsers = async (phone: string, currentUserId: number) => {
  const rows = await UserModel.searchByPhone(phone, currentUserId);

  const results = [];
  for (const row of rows as any[]) {
    const blocked = await BlockModel.isBlockedEitherWay(currentUserId, row.id);

    let relation: string;
    if (blocked) {
      relation = "blocked";
    } else if (!row.friendship_id) {
      relation = "none";
    } else if (row.friendship_status === "accepted") {
      relation = "friend";
    } else if (row.friendship_status === "pending") {
      relation = row.friendship_requester_id === currentUserId ? "pending_sent" : "pending_received";
    } else {
      relation = "none";
    }

    results.push({
      id: row.id,
      phone: row.phone,
      name: row.name,
      avatar_url: row.avatar_url,
      relation,
      friendship_id: row.friendship_id ? String(row.friendship_id) : null,
    });
  }
  return results;
};