import * as BlockModel from "../models/block.model";

export const blockUser = async (userId: number, targetId: number) => {
  if (userId === targetId) throw new Error("Cannot block yourself");

  const existed = await BlockModel.findOne(userId, targetId);
  if (existed) throw new Error("User already blocked");

  const id = await BlockModel.create(userId, targetId);
  return { id, blocked_id: targetId };
};

export const unblockUser = async (userId: number, targetId: number) => {
  const existed = await BlockModel.findOne(userId, targetId);
  if (!existed) throw new Error("User is not blocked");

  await BlockModel.remove(userId, targetId);
  return { blocked_id: targetId };
};

export const getBlockedList = (userId: number) => BlockModel.listByBlocker(userId);