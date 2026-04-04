// const mongoose = require("mongoose")
// const Document = require("./Document")

// mongoose.connect("mongodb+srv://ishitta:ishitta123@cluster0.xshlsef.mongodb.net/", {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
//   useFindAndModify: false,
//   useCreateIndex: true,
// })

// const io = require("socket.io")(3001, {
//   cors: {
//     origin: "http://localhost:3000",
//     methods: ["GET", "POST"],
//   },
// })

// const defaultValue = ""

// io.on("connection", socket => {
//   socket.on("get-document", async documentId => {
//     const document = await findOrCreateDocument(documentId)
//     socket.join(documentId)
//     socket.emit("load-document", { data: document.data, title: document.title || "Untitled Document" })

//     socket.on("send-changes", delta => {
//       socket.broadcast.to(documentId).emit("receive-changes", delta)
//     })

//     socket.on("send-title-change", title => {
//       socket.broadcast.to(documentId).emit("receive-title-change", title)
//     })

//     socket.on("save-document", async data => {
//       await Document.findByIdAndUpdate(documentId, { data })
//     })

//     socket.on("save-title", async title => {
//       await Document.findByIdAndUpdate(documentId, { title })
//     })
//   })
// })

// async function findOrCreateDocument(id) {
//   if (id == null) return

//   const document = await Document.findById(id)
//   if (document) return document
//   return await Document.create({ _id: id, data: defaultValue, title: "Untitled Document" })
// }
require("dotenv").config();
const mongoose = require("mongoose");
const Document = require("./Document");

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

const io = require("socket.io")(PORT, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

const defaultValue = "";
const documentUsers = {};

io.on("connection", (socket) => {
  let currentDocument = null;
  let currentUser = null;

  socket.on("get-document", async (documentId, userDetails) => {
    const document = await findOrCreateDocument(documentId);
    socket.join(documentId);
    currentDocument = documentId;
    currentUser = { ...userDetails, socketId: socket.id };

    if (!documentUsers[documentId]) documentUsers[documentId] = [];
    documentUsers[documentId].push(currentUser);

    socket.emit("load-document", {
      data: document.data,
      title: document.title || "Untitled Document",
    });

    // Broadcast updated user presence to everyone in the room
    io.in(documentId).emit("presence-update", documentUsers[documentId]);

    socket.on("send-changes", (delta) => {
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });

    socket.on("send-cursor", (range) => {
      socket.broadcast.to(documentId).emit("receive-cursor", {
        userId: currentUser.socketId,
        userName: currentUser.name,
        color: currentUser.color,
        range: range,
      });
    });

    socket.on("send-title-change", (title) => {
      socket.broadcast.to(documentId).emit("receive-title-change", title);
    });

    socket.on("save-document", async (data) => {
      // Find the document to check last revision date
      const doc = await Document.findById(documentId);
      if (!doc) return;

      const updates = { data };
      
      // Save revision every 1 minute if changes occur
      // Normally you'd compare timestamps, let's just do it simple:
      const lastRev = doc.revisions && doc.revisions.length > 0
        ? doc.revisions[doc.revisions.length - 1].timestamp
        : new Date(0);
      
      const oneMinuteInMs = 60000;
      if (Date.now() - lastRev.getTime() > oneMinuteInMs) {
        await Document.findByIdAndUpdate(documentId, { 
          data, 
          $push: { revisions: { data } }
        });
      } else {
        await Document.findByIdAndUpdate(documentId, { data });
      }
    });

    socket.on("save-title", async (title) => {
      await Document.findByIdAndUpdate(documentId, { title });
    });
  });

  socket.on("disconnect", () => {
    if (currentDocument && currentUser) {
      documentUsers[currentDocument] = documentUsers[currentDocument].filter(
        (u) => u.socketId !== socket.id
      );
      io.in(currentDocument).emit("presence-update", documentUsers[currentDocument]);
    }
  });
});

async function findOrCreateDocument(id) {
  if (id == null) return;

  const document = await Document.findById(id);
  if (document) return document;

  return await Document.create({
    _id: id,
    data: defaultValue,
    title: "Untitled Document",
    revisions: [{ data: defaultValue }]
  });
}