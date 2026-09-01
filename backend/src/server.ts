import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { testConnection } from "./config/db";
import { initSocket } from "./sockets";

import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import friendshipRoutes from "./routes/friendship.routes";
import conversationRoutes from "./routes/conversation.routes";
import messageRoutes from "./routes/message.routes";
import notificationRoutes from "./routes/notification.routes";
import pinRoutes from "./routes/pin.routes";
import mediaRoutes from "./routes/media.routes";
import blockRoutes from "./routes/block.routes";
import uploadRoutes from "./routes/upload.routes";

dotenv.config();
const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000", // domain FE thật, KHÔNG dùng "*"
    credentials: true, // bắt buộc để browser gửi/nhận cookie
  })
);
app.use(cookieParser());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", blockRoutes);
app.use("/api/users", userRoutes);
app.use("/api/friendships", friendshipRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api", pinRoutes);
app.use("/api", mediaRoutes);
app.use("/api/uploads", uploadRoutes);

testConnection();

console.log('Node time:', new Date().toISOString(), 'System offset (phút):', new Date().getTimezoneOffset());

// dùng http.createServer thay vì app.listen trực tiếp, vì Socket.IO cần
// gắn vào cùng 1 HTTP server với Express để share chung port
const httpServer = http.createServer(app);

// khởi tạo Socket.IO, xác thực bằng access token, join room theo conversation
initSocket(httpServer);

httpServer.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});