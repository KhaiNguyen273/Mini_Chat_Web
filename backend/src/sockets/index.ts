import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { socketAuthenticate, AuthSocket } from "./middleware/socket-auth.middleware";
import { registerMessageHandlers } from "./handlers/message.handler";
import { setIO } from "./io-registry";
import { markUserOnline, markUserOffline } from "./presence";
import * as ConversationModel from "../models/conversation.model";
import * as UserModel from "../models/user.model";

export { getIO } from "./io-registry";

export const initSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      credentials: true,
    },
  });

  setIO(io);
  io.use(socketAuthenticate);

  io.on("connection", async (socket) => {
    const authSocket = socket as AuthSocket;
    const userId = authSocket.userId!;

    console.log(`[socket] User ${userId} connected (${socket.id})`);

    socket.join(`user:${userId}`);
    await joinAllConversations(authSocket, userId);
    registerMessageHandlers(authSocket);

    // MỚI — presence: chỉ báo online khi đây là tab/thiết bị ĐẦU TIÊN của user
    const justCameOnline = markUserOnline(userId);
    if (justCameOnline) {
      // broadcast cho đúng các room mà socket này ĐÃ join (chính là những
      // người "quen biết" — bạn bè + chung nhóm), không cần friend-list riêng
      const rooms = Array.from(authSocket.rooms).filter((r) => r.startsWith("conversation:"));
      for (const room of rooms) {
        socket.to(room).emit("presence:online", { userId });
      }
    }

    socket.on("disconnect", async () => {
      console.log(`[socket] User ${userId} disconnected (${socket.id})`);

      // MỚI — presence: chỉ báo offline khi đây là tab/thiết bị CUỐI CÙNG
      const wentOffline = markUserOffline(userId);
      if (wentOffline) {
        await UserModel.updateLastSeen(userId);
        // socket.rooms đã bị Socket.IO tự rời hết tại thời điểm disconnect,
        // không dùng được nữa — phải query lại từ DB
        const conversationIds = await ConversationModel.listConversationIdsForUser(userId);
        for (const convId of conversationIds) {
          io.to(`conversation:${convId}`).emit("presence:offline", {
            userId,
            lastSeenAt: new Date().toISOString(),
          });
        }
      }
    });
  });

  return io;
};

const joinAllConversations = async (socket: AuthSocket, userId: number) => {
  const [active, pending] = await Promise.all([
    ConversationModel.listForUser(userId),
    ConversationModel.listPendingForUser(userId),
  ]);
  for (const conv of [...active, ...pending]) {
    // MỚI — listForUser cố tình vẫn trả về conversation đã bị kick để FE
    // hiện lịch sử, nhưng KHÔNG được join room, nếu không real-time sẽ
    // "sống lại" sau mỗi lần F5/reconnect — trái với việc socketsLeave lúc
    // kick cố tình chặn nhận tin mới
    if ((conv as any).my_removed_at != null) continue;
    socket.join(`conversation:${conv.id}`);
  }
};