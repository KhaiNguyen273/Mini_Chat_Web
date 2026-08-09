import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as UserService from "../services/user.service";
import { uploadBufferToCloudinary } from "../services/upload.service";
import * as UserModel from "../models/user.model";

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await UserService.getProfile(req.userId!);
    res.json({ data: user });
  } catch (err: any) {
    res.status(404).json({ message: err.message });
  }
};

export const updateMe = async (req: AuthRequest, res: Response) => {
  try {
    const { name, bio, avatar_url } = req.body;
    const user = await UserService.updateProfile(req.userId!, { name, bio, avatar_url });
    res.json({ data: user });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body;
    await UserService.changePassword(req.userId!, oldPassword, newPassword);
    res.json({ message: "Password updated" });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteMe = async (req: AuthRequest, res: Response) => {
  try {
    await UserService.deleteAccount(req.userId!);
    res.json({ message: "Account deleted" });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const user = await UserService.getProfile(Number(req.params.id));
    res.json({ data: user });
  } catch (err: any) {
    res.status(404).json({ message: err.message });
  }
};

export const searchUsers = async (req: AuthRequest, res: Response) => {
  try {
    const phone = req.query.phone as string;
    const users = await UserService.searchUsers(phone, req.userId!);
    res.json({ data: users });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const uploadAvatar = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) throw new Error("No file uploaded");

    const result = await uploadBufferToCloudinary(
      req.file.buffer,
      "minichat/avatars",
      "image"
    );

    // lưu URL Cloudinary trả về vào cột avatar_url
    const user = await UserModel.findById(req.userId!);
    await UserModel.updateProfile(req.userId!, user!.name, user!.bio || "", result.url);

    res.json({ data: { avatar_url: result.url } });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
    console.log(err.message)
  }
};