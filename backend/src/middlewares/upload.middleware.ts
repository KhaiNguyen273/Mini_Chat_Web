import multer from "multer";

// dùng memoryStorage vì sẽ đẩy buffer thẳng lên Cloudinary, không lưu file tạm ở server
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // giới hạn 10MB
});