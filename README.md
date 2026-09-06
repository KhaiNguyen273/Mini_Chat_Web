# MiniChat — Real-time Chat Application

A full-stack real-time messaging app built from scratch with a custom Node.js/Socket.IO backend (no Firebase/Pusher) — supporting private & group chat, friend system, read receipts, and media sharing.

🔗 **Live demo:** [link if deployed]

---

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

---

## Walkthrough

A tour of the app's core flows — screenshots below each step.

### 1. Auth — Register, Login, Silent Refresh

Sign up with phone + password, then log in. Session persists across page refresh via an httpOnly refresh cookie — no re-login needed, and the access token is refreshed silently in the background when it expires (15 min).

<table>
<tr>
<td><img src="docs/screenshots/01-register.png" width="480" alt="Register screen" /></td>
<td><img src="docs/screenshots/02-login.png" width="480" alt="Login screen" /></td>
</tr>
</table>

### 2. Friends & Contacts

Search a contact by phone number, send a friend request, and manage incoming/outgoing requests. Accepting a request automatically opens (or activates) a private conversation with that person.

<table>
<tr>
<td><img src="docs/screenshots/03-contacts-search.png" width="480" alt="Contacts search" /></td>
<td><img src="docs/screenshots/04-friend-requests.png" width="480" alt="Friend requests list" /></td>
</tr>
</table>

A message from a stranger (not yet a friend) doesn't land directly in your inbox — it goes to a **Pending** tab first, similar to Messenger/Instagram DMs, where you can preview it before accepting or rejecting.

<img src="docs/screenshots/05-pending.png" width="480" alt="Pending messages tab" />

### 3. Real-time Messaging

Text, images, and files are all supported in one input — attachments show a live thumbnail preview before sending. Messages appear instantly on both ends via WebSocket, with a typing indicator ("...") shown while the other person is composing.

<table>
<tr>
<td><img src="docs/screenshots/06-chat-conversationA.png" width="480" alt="Chat conversation" /></td>
<td><img src="docs/screenshots/06-chat-conversationB.png" width="480" alt="Chat conversation" /></td>
</tr>
</table>

<img src="docs/screenshots/07-typing-attachment.png" width="480" alt="Typing indicator and attachment preview" />

Each message shows **per-member read receipts** — a small avatar that "jumps" to the last message each person has actually seen, updated live as they read.

<img src="docs/screenshots/08-read-receipts.png" width="480" alt="Read receipt avatars" />

### 4. Group Chat & Member Management

Create a group with 2+ friends, set a name and avatar. Admins can add/remove members, transfer admin rights, and rename the group — all changes sync live to every open client in the room.

<table>
<tr>
<td><img src="docs/screenshots/09-create-group1.png" width="480" alt="Create group popup" /></td>
<td><img src="docs/screenshots/09-create-group2.png" width="480" alt="Create group popup" /></td>
</tr>
</table>

<img src="docs/screenshots/10-members-popup.png" width="480" alt="Members management popup" />

If the sole admin tries to leave, the app forces them to pick a replacement admin first — the group can never end up without one.

<img src="docs/screenshots/11-assign-admin.png" width="480" alt="Assign new admin modal" />

### 5. Message Actions — Pin, Search, Recall

Pin important messages (including images/files) for quick reference, search within a conversation with keyword highlighting, and recall (unsend) your own messages — all synced in real time to everyone in the chat.

<table>
<tr>
<td><img src="docs/screenshots/12-pinned-messages.png" width="480" alt="Pinned messages list" /></td>
<td><img src="docs/screenshots/13-message-search.png" width="480" alt="In-conversation search with highlighting" /></td>
</tr>
</table>

### 6. Media Gallery & Conversation Search

Every conversation has a dedicated media panel — images/videos and files, grouped by month. Clicking any item jumps straight to it in the message history.

<table>
<tr>
<td><img src="docs/screenshots/14-media-panel1.png" width="480" alt="Media and files panel" /></td>
<td><img src="docs/screenshots/14-media-panel2.png" width="480" alt="Media and files panel" /></td>
</tr>
</table>

You can also search across **all conversations** by message content from the sidebar, and jump directly into the matching chat.

<img src="docs/screenshots/15-sidebar-search.png" width="480" alt="Sidebar conversation search results" />

### 7. Block, Mute, Notifications

Block a user to stop receiving messages from them, mute a conversation to silence its notifications, and get real-time notification badges for friend requests, new messages, and pending chats.

<table>
<tr>
<td><img src="docs/screenshots/16-blocked-list.png" width="480" alt="Blocked users list" /></td>
<td><img src="docs/screenshots/17-notifications.png" width="480" alt="Notifications page" /></td>
</tr>
</table>

### 8. Presence & Profile

See who's online in real time, with "last seen" timestamps for offline users. Manage your own profile — avatar, bio, password — and deactivate your account when needed (with graceful fallback for group admin handoff and anonymized chat history).

<table>
<tr>
<td><img src="docs/screenshots/18-presence.png" width="480" alt="Online status and last seen" /></td>
<td><img src="docs/screenshots/19-profile.png" width="480" alt="Profile page" /></td>
</tr>
</table>

### 9. Responsive — Mobile & Desktop

Full drill-down navigation on mobile (list → detail → back), with a bottom tab bar replacing the desktop sidebar. Every modal, popup, and panel adapts to small screens without breaking layout.

<table>
<tr>
<td><img src="docs/screenshots/20-mobile-list.png" width="300" alt="Mobile conversation list" /></td>
<td><img src="docs/screenshots/21-mobile-chat.png" width="300" alt="Mobile chat view" /></td>
</tr>
</table>

---

## Key Features

- **Real-time messaging via WebSocket** — instant delivery, typing indicators, and read receipts (per-member "seen" avatars) without polling
- **JWT auth with silent refresh** — short-lived access token in memory + httpOnly refresh cookie, auto-retry on 401 via Axios interceptor
- **Friend system with request lifecycle** — send/cancel/accept/reject, plus a "stranger message request" flow (pending conversations) similar to Messenger/Instagram DMs
- **Group chat management** — role-based permissions (admin/member), forced admin handoff when the last admin leaves, real-time role/member sync across all open clients
- **Media handling** — image/file upload to Cloudinary, per-conversation media gallery grouped by month, message search with highlighting
- **Fully responsive** — mobile drill-down navigation with bottom tab bar, desktop multi-column layout

---

## Architecture Highlights

Real-time state is synced through a single source of truth: every mutation (send message, pin, block, kick) goes through a REST or Socket.IO handler on the backend, which then **broadcasts the resulting event back to the room** — the frontend never trusts its own optimistic guess for shared state, it waits for the server echo. This avoided a whole class of desync bugs between multiple open tabs/devices.

The trickiest part was **read-receipt accuracy**: comparing `message.created_at` (millisecond precision) against `member.last_read_at` (MySQL `NOW()`, second precision) caused read/unread status to flicker when a message and a read-event happened in the same second. Fixed by normalizing both timestamps to second-level precision before comparison — a good example of a subtle bug that only shows up under real concurrent usage, not in manual single-user testing.

---

## Tech Notes

- Backend: Express + Socket.IO on a shared HTTP server, MySQL via `mysql2/promise`, Cloudinary for media storage
- Frontend: React + TypeScript + Vite, TailwindCSS, Context API for cross-page state (conversations, presence)
- Deployed on Vercel (frontend) + Render (backend), MySQL hosted on Railway
