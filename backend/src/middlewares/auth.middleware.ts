import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import * as UserModel from "../models/user.model";

export interface AuthRequest extends Request {
  userId?: number;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
    // MỚI — chặn ngay tại middleware nếu tài khoản đã bị vô hiệu hoá, thay
    // vì để lọt qua rồi mới fail lẻ tẻ ở từng endpoint riêng lẻ
    const user = await UserModel.findById(payload.userId);
    if (!user) {
      return res.status(401).json({ message: "Account is deactivated" });
    }
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};