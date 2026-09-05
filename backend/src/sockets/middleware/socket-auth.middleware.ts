import { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import * as UserModel from "../../models/user.model";

export interface AuthSocket extends Socket {
  userId?: number;
}

export const socketAuthenticate = async (socket: Socket, next: (err?: Error) => void) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];
    if (!token) return next(new Error("No token provided"));

    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
    const user = await UserModel.findById(payload.userId);
    if (!user) return next(new Error("Account is deactivated"));

    (socket as AuthSocket).userId = payload.userId;
    next();
  } catch {
    next(new Error("Invalid or expired token"));
  }
};