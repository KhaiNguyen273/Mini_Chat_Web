import bcrypt from "bcrypt";
import * as UserModel from "../models/user.model";
import * as BlockModel from "../models/block.model";
import { isUserOnline } from "../sockets/presence";

export const getProfile = async (id: number) => {
  const user = await UserModel.findById(id);
  if (!user) throw new Error("User not found");
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

  const hashed = await bcrypt.hash(newPassword, 10);
  await UserModel.updatePassword(id, hashed);
};

export const deleteAccount = async (id: number) => {
  await UserModel.softDelete(id);
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