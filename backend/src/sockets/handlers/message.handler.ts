import { AuthSocket } from "../middleware/socket-auth.middleware";
import * as MessageService from "../../services/message.service";
import * as ConversationModel from "../../models/conversation.model";

interface SendMessagePayload {
  conversationId: number;
  content: string | null;
  type: string;
  attachments?: { url: string; name: string; size: number; fileType: string }[];
}

interface ConversationRoomPayload {
  conversationId: number;
}

interface AckResponse {
  ok: boolean;
  data?: any;
  message?: string;
}

const roomName = (conversationId: number) => `conversation:${conversationId}`;

// emit "message:new" giờ tập trung trong MessageService.sendMessage — handler
// ở đây KHÔNG tự emit nữa, chỉ gọi service + trả ack, tránh emit trùng
export const registerMessageHandlers = (socket: AuthSocket) => {
  const userId = socket.userId!;

  socket.on("conversation:join", async (conversationId: number) => {
    const isMember = await ConversationModel.isMember(conversationId, userId);
    if (!isMember) return;
    socket.join(roomName(conversationId));
  });

  socket.on("conversation:leave", (conversationId: number) => {
    socket.leave(roomName(conversationId));
  });

  socket.on(
    "message:send",
    async (payload: SendMessagePayload, ack?: (res: AckResponse) => void) => {
      try {
        // join room TRƯỚC khi gọi service, để sender chắc chắn nhận được
        // message:new do service emit ra ngay sau đó
        socket.join(roomName(payload.conversationId));

        const message = await MessageService.sendMessage(
          payload.conversationId,
          userId,
          payload.content ?? null,
          payload.type,
          payload.attachments || []
        );

        ack?.({ ok: true, data: message });
      } catch (err: any) {
        ack?.({ ok: false, message: err.message });
        socket.emit("message:error", { message: err.message });
      }
    }
  );

  socket.on("typing:start", (payload: ConversationRoomPayload) => {
    socket.to(roomName(payload.conversationId)).emit("typing:start", {
      conversationId: payload.conversationId,
      userId,
    });
  });

  socket.on("typing:stop", (payload: ConversationRoomPayload) => {
    socket.to(roomName(payload.conversationId)).emit("typing:stop", {
      conversationId: payload.conversationId,
      userId,
    });
  });
};