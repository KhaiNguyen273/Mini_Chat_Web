import { Response } from "express";

const isProd = process.env.NODE_ENV === "production";

export const setRefreshTokenCookie = (res: Response, token: string) => {
  res.cookie("refreshToken", token, {
    httpOnly: true,            // JS phía FE không đọc được, chống XSS đánh cắp token
    secure: isProd,            // chỉ gửi qua HTTPS khi lên production
    sameSite: isProd ? "none" : "lax", // "none" cần secure=true (cross-site), "lax" đủ dùng cho dev cùng domain
    path: "/api/auth",         // cookie chỉ gửi kèm khi gọi tới /api/auth/*, không gửi lung tung
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày, khớp với thời hạn refresh token
  });
};

export const clearRefreshTokenCookie = (res: Response) => {
  res.clearCookie("refreshToken", { path: "/api/auth" });
};