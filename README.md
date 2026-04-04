# 📄 Google Docs Clone

A **real-time collaborative document editor** built with React, Node.js, Socket.IO, and MongoDB — inspired by Google Docs. Multiple users can edit the same document simultaneously with live cursor tracking, user presence, and automatic revision history.

---

## ✨ Features

- 🔄 **Real-time Collaboration** — Multiple users can edit the same document simultaneously; changes sync instantly across all connected clients via WebSockets.
- 👥 **User Presence** — See colored avatar badges for every user currently viewing the document.
- 🖱️ **Live Cursor Tracking** — Each collaborator's cursor position is visible to others in real time, with a unique color and name label.
- 📝 **Rich Text Editing** — Powered by the Quill editor with a full toolbar: headings, fonts, lists, bold/italic/underline, colors, alignment, images, code blocks, and more.
- 🏷️ **Editable Document Title** — Click the title to rename it; the change propagates to all collaborators instantly.
- 💾 **Auto-Save** — The document content is automatically saved to MongoDB every 2 seconds.
- 🕒 **Revision History** — A new revision snapshot is saved whenever changes are made more than 1 minute apart, giving you a lightweight history of the document over time.
- 🔗 **Shareable Links** — Each document has a unique UUID-based URL (`/documents/:id`). Share the link and anyone can co-edit.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 17, React Router v5 |
| **Editor** | Quill.js, quill-cursors |
| **Real-time** | Socket.IO (client + server) |
| **Backend** | Node.js, Socket.IO server |
| **Database** | MongoDB Atlas via Mongoose |
| **Utilities** | uuid, randomcolor, dotenv, nodemon |

---

## 📁 Project Structure

```
google-docs-clone/
├── client/                  # React frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js           # Routing — redirects / to a new UUID document
│   │   ├── TextEditor.js    # Main editor component (Socket.IO, Quill, presence)
│   │   ├── styles.css       # Application styles
│   │   └── index.js         # React entry point
│   └── package.json
│
└── server/                  # Node.js backend
    ├── server.js            # Socket.IO server, document logic, revision saving
    ├── Document.js          # Mongoose schema (data, title, revisions)
    ├── .env                 # Environment variables (MongoDB URL, port, etc.)
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v14 or higher
- [npm](https://www.npmjs.com/) v6 or higher
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster (or local MongoDB instance)

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/google-docs-clone.git
cd google-docs-clone
```

---

### 2. Set Up the Server

```bash
cd server
npm install
```

Create (or update) the `.env` file in the `server/` directory:

```env
MONGO_URL=your_mongodb_connection_string_here
PORT=3001
CLIENT_URL=http://localhost:3000
```

> **Note:** Never commit your `.env` file. It is already listed in `.gitignore`.

Start the server:

```bash
# Development (with auto-reload)
npm run devStart

# Production
node server.js
```

The server will start on **port 3001** (or the port defined in `.env`).

---

### 3. Set Up the Client

Open a new terminal:

```bash
cd client
npm install
```

If your backend runs on a URL other than `http://localhost:3001`, create a `.env` file in the `client/` directory:

```env
REACT_APP_BACKEND_URL=http://localhost:3001
```

Start the React development server:

```bash
npm start
```

The app will open at **http://localhost:3000**.

---

## 🎯 How to Use

1. Open **http://localhost:3000** — you'll be automatically redirected to a new document with a unique URL (e.g., `/documents/abc123...`).
2. **Share the URL** with collaborators. Anyone who opens the same link can co-edit in real time.
3. **Edit the title** by clicking on the document name in the header.
4. **See collaborators** as colored avatar badges in the top-right corner.
5. **Cursor positions** of other users appear inside the editor with their name and a unique color.
6. The document **saves automatically** every 2 seconds. Revision snapshots are stored every minute.

---

## 🌐 Deployment

### Frontend — Vercel

1. Push your code to GitHub.
2. Import the repository on [Vercel](https://vercel.com/).
3. Set the **Root Directory** to `client`.
4. Add the environment variable:
   ```
   REACT_APP_BACKEND_URL=https://your-render-server-url.onrender.com
   ```
5. Deploy.

### Backend — Render

1. Create a new **Web Service** on [Render](https://render.com/).
2. Set the **Root Directory** to `server`.
3. Set the **Start Command** to `node server.js`.
4. Add environment variables:
   ```
   MONGO_URL=your_mongodb_atlas_connection_string
   CLIENT_URL=https://your-vercel-app-url.vercel.app
   PORT=3001
   ```
5. Deploy.

---

## ⚙️ Environment Variables Reference

### Server (`server/.env`)

| Variable | Description | Default |
|---|---|---|
| `MONGO_URL` | MongoDB connection string | *(required)* |
| `PORT` | Port for the Socket.IO server | `3001` |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:3000` |

### Client (`client/.env`)

| Variable | Description | Default |
|---|---|---|
| `REACT_APP_BACKEND_URL` | Backend server URL | `http://localhost:3001` |

---

## 🧠 How It Works

```
Browser A                        Server                        Browser B
   │                               │                               │
   │── get-document (id, user) ───>│                               │
   │<── load-document (data) ──────│                               │
   │                               │                               │
   │── send-changes (delta) ──────>│── receive-changes ──────────>│
   │── send-cursor (range) ───────>│── receive-cursor ───────────>│
   │── send-title-change ─────────>│── receive-title-change ─────>│
   │── save-document (data) ──────>│── saved to MongoDB            │
   │                               │                               │
   │<── presence-update (users) ───│<── presence-update (users) ──│
```

- Each document room is identified by its UUID.
- All connected sockets in a room receive live deltas, cursor positions, and presence updates.
- Revisions are stored as subdocuments in MongoDB, snapshotted every minute.

---

## 📜 License

This project is open-source and available under the [MIT License](LICENSE).

---

## 🙏 Acknowledgements

- [Quill.js](https://quilljs.com/) — Rich text editor
- [quill-cursors](https://github.com/reedsy/quill-cursors) — Collaborative cursor plugin
- [Socket.IO](https://socket.io/) — Real-time WebSocket communication
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) — Cloud database
- Inspired by [Google Docs](https://docs.google.com/)
