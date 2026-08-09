import { Request, Response } from "express";
import * as AuthService from "../services/auth.service";
import { clearRefreshTokenCookie, setRefreshTokenCookie } from "../config/cookie";

export const register = async (req: Request, res: Response) => {
  try {
    const { phone, password, name } = req.body;
    const user = await AuthService.register(phone, password, name);
    res.status(201).json({ data: user });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;
    const result = await AuthService.login(phone, password);

    // set refreshToken vào httpOnly cookie, KHÔNG trả về trong body nữa
    setRefreshTokenCookie(res, result.refreshToken);

    res.json({
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    });
  } catch (err: any) {
    res.status(401).json({ message: err.message });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    // đọc từ cookie thay vì req.body
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ message: "No refresh token" });

    const result = await AuthService.refresh(token);
    res.json({ data: result });
  } catch (err: any) {
    res.status(401).json({ message: err.message });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken;
    await AuthService.logout(token);
    clearRefreshTokenCookie(res);
    res.json({ message: "Logged out" });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};