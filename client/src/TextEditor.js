import { useCallback, useEffect, useState } from "react"
import Quill from "quill"
import "quill/dist/quill.snow.css"
import QuillCursors from "quill-cursors"
import randomColor from "randomcolor"
import { io } from "socket.io-client"
import { useParams } from "react-router-dom"

Quill.register("modules/cursors", QuillCursors)

const SAVE_INTERVAL_MS = 2000
const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ list: "ordered" }, { list: "bullet" }],
  ["bold", "italic", "underline"],
  [{ color: [] }, { background: [] }],
  [{ script: "sub" }, { script: "super" }],
  [{ align: [] }],
  ["image", "blockquote", "code-block"],
  ["clean"],
]

export default function TextEditor() {
  const { id: documentId } = useParams()
  const [socket, setSocket] = useState()
  const [quill, setQuill] = useState()
  const [title, setTitle] = useState("Untitled Document")
  const [activeUsers, setActiveUsers] = useState([])
  const [userDetails] = useState(() => ({
    name: "User " + Math.floor(Math.random() * 100).toString(),
    color: randomColor({ luminosity: 'dark' })
  }))

  useEffect(() => {
    // const s = io(process.env.REACT_APP_BACKEND_URL || "http://localhost:3001")
    const s = io(process.env.REACT_APP_API_URL)
    setSocket(s)

    return () => {
      s.disconnect()
    }
  }, [])

  useEffect(() => {
    if (socket == null || quill == null) return

    socket.once("load-document", document => {
      quill.setContents(document.data)
      setTitle(document.title)
      quill.enable()
    })

    socket.emit("get-document", documentId, userDetails)
  }, [socket, quill, documentId, userDetails])

  useEffect(() => {
    if (socket == null) return

    const handler = newTitle => {
      setTitle(newTitle)
    }
    socket.on("receive-title-change", handler)

    return () => {
      socket.off("receive-title-change", handler)
    }
  }, [socket])

  const handleTitleChange = (e) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    if (socket == null) return
    socket.emit("send-title-change", newTitle)
    socket.emit("save-title", newTitle)
  }

  useEffect(() => {
    if (socket == null || quill == null) return

    const interval = setInterval(() => {
      socket.emit("save-document", quill.getContents())
    }, SAVE_INTERVAL_MS)

    return () => {
      clearInterval(interval)
    }
  }, [socket, quill])

  useEffect(() => {
    if (socket == null || quill == null) return

    const handler = delta => {
      quill.updateContents(delta)
    }
    socket.on("receive-changes", handler)

    return () => {
      socket.off("receive-changes", handler)
    }
  }, [socket, quill])

  useEffect(() => {
    if (socket == null || quill == null) return

    const handler = (delta, oldDelta, source) => {
      if (source !== "user") return
      socket.emit("send-changes", delta)
    }
    quill.on("text-change", handler)

    return () => {
      quill.off("text-change", handler)
    }
  }, [socket, quill])

  useEffect(() => {
    if (socket == null || quill == null) return

    socket.on("presence-update", (users) => {
      setActiveUsers(users)
    })

    socket.on("receive-cursor", ({ userId, userName, color, range }) => {
      const cursors = quill.getModule("cursors")
      if (!cursors) return
      cursors.createCursor(userId, userName, color)
      cursors.moveCursor(userId, range)
    })

    return () => {
      socket.off("presence-update")
      socket.off("receive-cursor")
    }
  }, [socket, quill])

  useEffect(() => {
    if (socket == null || quill == null) return

    const handler = (range, oldRange, source) => {
      if (source === "user") {
        socket.emit("send-cursor", range)
      }
    }
    quill.on("selection-change", handler)

    return () => {
      quill.off("selection-change", handler)
    }
  }, [socket, quill])

  const wrapperRef = useCallback(wrapper => {
    if (wrapper == null) return

    wrapper.innerHTML = ""
    const editor = document.createElement("div")
    wrapper.append(editor)
    const q = new Quill(editor, {
      theme: "snow",
      modules: { 
        toolbar: TOOLBAR_OPTIONS,
        cursors: true
      },
    })
    q.disable()
    q.setText("Loading...")
    setQuill(q)
  }, [])
  
  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-left">
          <div className="logo-icon">
            <svg viewBox="0 0 40 40" width="40" height="40" xmlns="http://www.w3.org/2000/svg">
              <path fill="#4285F4" d="M14.5,0h-9C4.12,0,3,1.12,3,2.5v35C3,38.88,4.12,40,5.5,40h29c1.38,0,2.5-1.12,2.5-2.5v-26L23.5,0 H14.5z"/>
              <path fill="#BBDEFB" d="M37,11.5H26V0.5L37,11.5z"/>
              <path fill="#E3F2FD" d="M9,21h22v3H9V21z M9,27h22v3H9V27z M9,15h14v3H9V15z"/>
            </svg>
          </div>
          <input 
            type="text" 
            className="document-title-input" 
            value={title} 
            onChange={handleTitleChange} 
          />
        </div>
        <div className="header-right">
          <div className="active-users" style={{ display: 'flex', gap: '8px', marginRight: '15px' }}>
            {activeUsers.map(u => (
              <div 
                key={u.socketId} 
                className="profile-pic" 
                style={{ backgroundColor: u.color }} 
                title={u.name}
              >
                {u.name.charAt(0)}
              </div>
            ))}
          </div>
          <button className="btn-share">Share</button>
        </div>
      </header>
      <div className="container" ref={wrapperRef}></div>
    </div>
  )
}
