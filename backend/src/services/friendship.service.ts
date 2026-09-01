import * as FriendshipModel from "../models/friendship.model";
import * as NotificationService from "./notification.service"; // đổi — bỏ import NotificationModel trực tiếp
import * as UserModel from "../models/user.model";
import * as ConversationService from "../services/conversation.service";
import { isUserOnline } from "../sockets/presence";

export const sendRequest = async (requesterId: number, receiverId: number) => {
  if (requesterId === receiverId) throw new Error("Cannot friend yourself");

  const existed = await FriendshipModel.findBetween(requesterId, receiverId);
  if (existed) throw new Error(`Friendship already exists with status: ${existed.status}`);

  const id = await FriendshipModel.create(requesterId, receiverId);

  await NotificationService.create(
    receiverId, requesterId, "friend_request", id, "friendship",
    "đã gửi lời mời kết bạn",
    null
  );

  return { id, status: "pending" };
};

const changeStatus = async (id: number, userId: number, newStatus: string) => {
  const friendship = await FriendshipModel.findById(id);
  if (!friendship) throw new Error("Friendship not found");
  if (friendship.receiver_id !== userId) throw new Error("Not authorized");

  await FriendshipModel.updateStatus(id, newStatus);

  if (newStatus === "accepted") {
    await NotificationService.create(
      friendship.requester_id, userId, "friend_accepted", id, "friendship",
      "đã chấp nhận lời mời kết bạn", null
    );

    // MỚI (Bug 1) — nếu đã có conversation private từ trước (pending/rejected
    // do 1 bên từng nhắn làm quen), chuyển active NGAY khi chính thức là bạn
    await ConversationService.activateExistingPrivate(friendship.requester_id, friendship.receiver_id);
  }

  await ConversationService.getOrCreatePrivate(friendship.requester_id, friendship.receiver_id);

  return { id, status: newStatus };
};
export const accept = (id: number, userId: number) => changeStatus(id, userId, "accepted");
export const reject = (id: number, userId: number) => changeStatus(id, userId, "rejected");
export const block = (id: number, userId: number) => changeStatus(id, userId, "blocked");

export const unfriend = async (id: number, userId: number) => {
  const friendship = await FriendshipModel.findById(id);
  if (!friendship) throw new Error("Friendship not found");
  if (friendship.requester_id !== userId && friendship.receiver_id !== userId)
    throw new Error("Not authorized");

  await FriendshipModel.remove(id);
};

export const getFriends = async (userId: number) => {
  const rows = await FriendshipModel.listFriends(userId);
  return rows.map((r: any) => ({ ...r, is_online: isUserOnline(r.id) }));
};

export const getPendingRequests = (userId: number) => FriendshipModel.listPendingRequests(userId);