import * as FriendshipModel from "../models/friendship.model";
import * as NotificationService from "./notification.service";
import * as UserModel from "../models/user.model";
import * as ConversationService from "../services/conversation.service";
import { isUserOnline } from "../sockets/presence";
import { getIO } from "../sockets/io-registry";

export const sendRequest = async (requesterId: number, receiverId: number) => {
  if (requesterId === receiverId) throw new Error("Cannot friend yourself");

  const existed = await FriendshipModel.findBetween(requesterId, receiverId);

  let friendshipId: number;

  if (existed) {
    if (existed.status !== "rejected") {
      throw new Error(`Friendship already exists with status: ${existed.status}`);
    }
    // đã từng bị từ chối — cho gửi lại, reopen về pending thay vì tạo bản
    // ghi mới, tránh phát sinh nhiều dòng friendship rác giữa 2 người
    await FriendshipModel.reopenAsPending(existed.id, requesterId, receiverId);
    friendshipId = existed.id;
  } else {
    friendshipId = await FriendshipModel.create(requesterId, receiverId);
  }

  await NotificationService.create(
    receiverId, requesterId, "friend_request", friendshipId, "friendship",
    "đã gửi lời mời kết bạn",
    null
  );

  // MỚI — báo realtime cho người NHẬN để "Lời mời kết bạn" tự cập nhật,
  // không cần refresh mới thấy lời mời mới tới (kể cả trường hợp gửi lại
  // sau khi từng bị từ chối)
  const requesterUser = await UserModel.findById(requesterId);
  try {
    getIO().to(`user:${receiverId}`).emit("friendship:request", {
      id: String(friendshipId),
      sender_id: String(requesterId),
      status: "pending",
      name: requesterUser?.name,
      avatar_url: requesterUser?.avatar_url,
    });
  } catch {
    // io chưa init — không fail REST
  }

  return { id: friendshipId, status: "pending" };
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

    await ConversationService.activateExistingPrivate(friendship.requester_id, friendship.receiver_id);

    // MỚI — báo realtime cho CẢ 2 phía để friends list tự cập nhật ngay:
    // requester thấy bạn mới xuất hiện mà không cần F5, receiver đồng bộ
    // đa tab nếu accept được bấm ở tab/thiết bị khác
    const receiverUser = await UserModel.findById(friendship.receiver_id);
    const requesterUser = await UserModel.findById(friendship.requester_id);
    try {
      const io = getIO();
      io.to(`user:${friendship.requester_id}`).emit("friendship:accepted", {
        friendship_id: String(id),
        friend: {
          id: String(friendship.receiver_id),
          name: receiverUser?.name,
          avatar_url: receiverUser?.avatar_url,
          friendship_id: String(id),
          is_online: isUserOnline(friendship.receiver_id),
        },
      });
      io.to(`user:${friendship.receiver_id}`).emit("friendship:accepted", {
        friendship_id: String(id),
        friend: {
          id: String(friendship.requester_id),
          name: requesterUser?.name,
          avatar_url: requesterUser?.avatar_url,
          friendship_id: String(id),
          is_online: isUserOnline(friendship.requester_id),
        },
      });
    } catch {
      // io chưa init — không fail REST
    }
  }

  if (newStatus === "rejected") {
    // MỚI — báo cho người GỬI biết lời mời bị từ chối. Trước đây chỉ
    // receiver (qua REST response) biết thay đổi, requester không hề hay
    // biết cho tới khi tự F5 hoặc search lại người đó
    try {
      getIO().to(`user:${friendship.requester_id}`).emit("friendship:rejected", {
        friendship_id: String(id),
      });
    } catch {
      // io chưa init — không fail REST
    }
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

  const wasPending = friendship.status === "pending";
  const otherUserId = friendship.requester_id === userId ? friendship.receiver_id : friendship.requester_id;

  await FriendshipModel.remove(id);

  if (wasPending) {
    // A thu hồi lời mời TRƯỚC KHI B phản hồi — B chưa từng là bạn, nên đây
    // không phải "huỷ kết bạn" mà là rút lại lời mời. Phải dọn luôn
    // notification friend_request cũ bên B, nếu không B bấm vào sẽ dính
    // lỗi "Lời mời không tồn tại"
    await NotificationService.deleteFriendRequestNotification(otherUserId, id);
    try {
      getIO().to(`user:${otherUserId}`).emit("friendship:cancelled", {
        friendship_id: String(id),
      });
    } catch {
      // io chưa init — không fail REST
    }
  } else {
    // huỷ kết bạn thật (status đã accepted) — báo phía còn lại tự xoá
    // khỏi friends list
    try {
      getIO().to(`user:${otherUserId}`).emit("friendship:removed", {
        friendship_id: String(id),
      });
    } catch {
      // io chưa init — không fail REST
    }
  }
};

const DEACTIVATED_NAME = 'Tài khoản đã vô hiệu hóa';

export const getFriends = async (userId: number) => {
  const rows = await FriendshipModel.listFriends(userId);
  return rows.map((r: any) => {
    if (r.is_deleted) {
      return {
        id: r.id, friendship_id: r.friendship_id,
        name: DEACTIVATED_NAME, avatar_url: null, is_online: false, last_seen_at: null,
        is_deactivated: true,
      };
    }
    return { ...r, is_online: isUserOnline(r.id) };
  });
};

export const getPendingRequests = (userId: number) => FriendshipModel.listPendingRequests(userId);