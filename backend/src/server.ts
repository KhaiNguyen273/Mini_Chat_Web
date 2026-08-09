import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { testConnection } from "./config/db";

import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import friendshipRoutes from "./routes/friendship.routes";
import conversationRoutes from "./routes/conversation.routes";
import messageRoutes from "./routes/message.routes";
import notificationRoutes from "./routes/notification.routes";
import pinRoutes from "./routes/pin.routes";     
import mediaRoutes from "./routes/media.routes";

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
app.use("/api/users", userRoutes);
app.use("/api/friendships", friendshipRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api", pinRoutes);
app.use("/api", mediaRoutes);

testConnection();

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});