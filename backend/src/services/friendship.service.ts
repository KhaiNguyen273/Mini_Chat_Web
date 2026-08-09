import * as FriendshipModel from "../models/friendship.model";
import * as NotificationModel from "../models/notification.model";
import * as UserModel from "../models/user.model";

export const sendRequest = async (requesterId: number, receiverId: number) => {
  if (requesterId === receiverId) throw new Error("Cannot friend yourself");

  const existed = await FriendshipModel.findBetween(requesterId, receiverId);
  if (existed) throw new Error(`Friendship already exists with status: ${existed.status}`);

  const id = await FriendshipModel.create(requesterId, receiverId);

  // tạo notification cho người nhận lời mời
  await NotificationModel.create(
    receiverId,
    requesterId,          // actor_id = người gửi lời mời
    "friend_request",
    id,
    "friendship",
    "đã gửi lời mời kết bạn"
  );

  return { id, status: "pending" };
};

const changeStatus = async (id: number, userId: number, newStatus: string) => {
  const friendship = await FriendshipModel.findById(id);
  if (!friendship) throw new Error("Friendship not found");
  if (friendship.receiver_id !== userId) throw new Error("Not authorized");

  await FriendshipModel.updateStatus(id, newStatus);

  // nếu chấp nhận, báo ngược lại cho người đã gửi lời mời
  if (newStatus === "accepted") {
    await NotificationModel.create(
      friendship.requester_id,
      userId,              // actor_id = người vừa accept
      "friend_accepted",
      id,
      "friendship",
      "đã chấp nhận lời mời kết bạn"
    );
  }

  return { id, status: newStatus };
};

export const accept = (id: number, userId: number) => changeStatus(id, userId, "accepted");
export const reject = (id: number, userId: number) => changeStatus(id, userId, "rejected");
export const block = (id: number, userId: number) => changeStatus(id, userId, "blocked");

// unfriend, getFriends, getPendingRequests giữ nguyên như cũ
export const unfriend = async (id: number, userId: number) => {
  const friendship = await FriendshipModel.findById(id);
  if (!friendship) throw new Error("Friendship not found");
  if (friendship.requester_id !== userId && friendship.receiver_id !== userId)
    throw new Error("Not authorized");

  await FriendshipModel.remove(id);
};

export const getFriends = (userId: number) => FriendshipModel.listFriends(userId);
export const getPendingRequests = (userId: number) => FriendshipModel.listPendingRequests(userId);