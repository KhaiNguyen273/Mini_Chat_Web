# MiniChat — Real-time Chat Application

A full-stack real-time messaging app built from scratch with a custom Node.js/Socket.IO backend (no Firebase/Pusher) — supporting private & group chat, friend system, read receipts, and media sharing.

## Demo

<!-- CHÈN ẢNH/GIF DEMO Ở ĐÂY -->
<!-- Gợi ý nên có: (1) màn hình chat chính với 2 người nhắn qua lại realtime, -->
<!-- (2) tạo nhóm + quản lý thành viên, (3) responsive mobile view -->

🔗 **Live demo:** [link nếu đã deploy]

## Tech Stack

**Frontend**
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=flat&logo=vite&logoColor=FFD62E)
![Socket.IO](https://img.shields.io/badge/Socket.IO-black?style=flat&logo=socket.io&badgeColor=010101)

**Backend**
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat&logo=mysql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-black?style=flat&logo=JSON%20web%20tokens)
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=flat&logo=cloudinary&logoColor=white)

## Key Features

- **Real-time messaging via WebSocket** — instant delivery, typing indicators, and read receipts (per-member "seen" avatars) without polling
- **JWT auth with silent refresh** — short-lived access token in memory + httpOnly refresh cookie, auto-retry on 401 via Axios interceptor
- **Friend system with request lifecycle** — send/cancel/accept/reject, plus a "stranger message request" flow (pending conversations) similar to Messenger/Instagram DMs
- **Group chat management** — role-based permissions (admin/member), forced admin handoff when the last admin leaves, real-time role/member sync across all open clients
- **Media handling** — image/file upload to Cloudinary, per-conversation media gallery grouped by month, message search with highlighting

## Architecture Highlights

Real-time state is synced through a single source of truth: every mutation (send message, pin, block, kick) goes through a REST or Socket.IO handler on the backend, which then **broadcasts the resulting event back to the room** — the frontend never trusts its own optimistic guess for shared state, it waits for the server echo. This avoided a whole class of desync bugs between multiple open tabs/devices.

The trickiest part was **read-receipt accuracy**: comparing `message.created_at` (millisecond precision) against `member.last_read_at` (MySQL `NOW()`, second precision) caused read/unread status to flicker when a message and a read-event happened in the same second. Fixed by normalizing both timestamps to second-level precision before comparison — a good example of a subtle bug that only shows up under real concurrent usage, not in manual single-user testing.
