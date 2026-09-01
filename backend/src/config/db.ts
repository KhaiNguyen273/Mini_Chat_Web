import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  // sửa — session MySQL thực tế chạy +07:00 (đã xác nhận qua NOW() vs
  // UTC_TIMESTAMP()), không phải UTC. Khai 'Z' trước đây khiến driver hiểu
  // sai nguồn gốc timestamp, gây lệch giờ khi convert sang JS Date — ảnh
  // hưởng TOÀN BỘ cột DATETIME trong hệ thống, không riêng last_read_at
  timezone: '+07:00',
});

export const testConnection = async () => {
  try {
    const conn = await pool.getConnection();
    console.log("MySQL connected");
    conn.release();
  } catch (err) {
    console.error("MySQL connection failed:", err);
  }
};