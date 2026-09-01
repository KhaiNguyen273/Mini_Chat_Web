import { Socket } from "socket.io";
import jwt from "jsonwebtoken";

// mở rộng Socket để gắn userId, tương tự AuthRequest bên REST (auth.middleware.ts)
export interface AuthSocket extends Socket {
  userId?: number;
}

// FE kết nối bằng: io(URL, { auth: { token: accessToken } })
// dùng CHUNG access token với REST API — không dùng refresh token ở đây
export const socketAuthenticate = (socket: Socket, next: (err?: Error) => void) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(" ")[1];

    if (!token) return next(new Error("No token provided"));

    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
    (socket as AuthSocket).userId = payload.userId;
    next();
  } catch {
    next(new Error("Invalid or expired token"));
  }
};