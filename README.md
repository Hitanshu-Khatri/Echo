# Echo — WebRTC Multi-User Video Conferencing Platform

A real-time multi-user video meeting platform built using **WebRTC + Socket.IO** with code-based room joining, chat, media toggles and screen sharing.

### 🚀 Tech Stack
- **Frontend:** React.js, MUI
- **Backend:** Node.js, Express.js
- **Signaling:** Socket.IO (SDP / ICE exchange)
- **Database:** MongoDB (JWT auth + activity logs)
- **Deployment:** Render (Backend)

---

## ✨ Features

| Feature | Description |
|--------|-------------|
| Multi-user rooms | Join rooms using a unique **room code** (no invite links) |
| WebRTC signaling | Exchange SDP & ICE using Socket.IO |
| Media controls | Toggle audio/video individually |
| Screen sharing | Share your screen with participants |
| Live chat | In-room chat messaging |
| Auth & persistence | JWT authentication + activity logs using MongoDB |
| STUN server | Low latency P2P streaming using public STUN |

---
📸 Demo

<img width="1901" height="943" alt="Screenshot 2025-11-07 201513" src="https://github.com/user-attachments/assets/0fda664d-e5bf-4dc3-bb01-83d79fcd0251" />
<img width="1919" height="947" alt="Screenshot 2025-11-07 201527" src="https://github.com/user-attachments/assets/0a308da4-5c69-4635-8e53-17e06e7ec14e" />
<img width="1919" height="942" alt="Screenshot 2025-11-07 201728" src="https://github.com/user-attachments/assets/d6d0bcc1-1e61-424d-9c3a-3d75bc192ec4" />


---

## 🛠️ Setup & Installation

```bash
# clone the repo
git clone <your-repository-url>
cd echo-video-call

# install dependencies
npm install

# start backend
cd server
npm start

# start frontend
cd client
npm start

📡 Future Enhancements

Recording meetings

File sharing in chat

TURN server for NAT restricted networks

