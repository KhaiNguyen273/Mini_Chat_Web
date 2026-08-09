import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../config/db";
import * as UserModel from "../models/user.model";
import { ResultSetHeader } from "mysql2";

const ACCESS_SECRET = process.env.JWT_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export const register = async (phone: string, password: string, name: string) => {
  const existed = await UserModel.findByPhone(phone);
  if (existed) throw new Error("Phone already registered");

  const hashed = await bcrypt.hash(password, 10);
  const id = await UserModel.createUser(phone, hashed, name);
  return { id, phone, name };
};

export const login = async (phone: string, password: string) => {
  const user = await UserModel.findByPhone(phone);
  if (!user) throw new Error("Invalid credentials");

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error("Invalid credentials");

  const accessToken = jwt.sign({ userId: user.id }, ACCESS_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign({ userId: user.id }, REFRESH_SECRET, { expiresIn: "7d" });

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await pool.query<ResultSetHeader>(
    "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
    [user.id, refreshToken, expiresAt]
  );

  // trả cả 2 token ra ngoài, controller sẽ quyết định cái nào set cookie / cái nào trả JSON
  return {
    accessToken,
    refreshToken,
    user: { id: user.id, phone: user.phone, name: user.name },
  };
};

export const refresh = async (token: string) => {
  const [rows]: any = await pool.query(
    "SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > NOW()",
    [token]
  );
  if (!rows[0]) throw new Error("Invalid or expired refresh token");

  const payload = jwt.verify(token, REFRESH_SECRET) as { userId: number };
  const accessToken = jwt.sign({ userId: payload.userId }, ACCESS_SECRET, { expiresIn: "15m" });
  return { accessToken };
};

export const logout = async (token: string) => {
  if (!token) return;
  await pool.query("DELETE FROM refresh_tokens WHERE token = ?", [token]);
};