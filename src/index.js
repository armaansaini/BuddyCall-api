import express from "express";
import { Server } from "socket.io";
import { createServer } from "node:http";

const app = express();
const server = createServer(app);

app.get("/", (req, res) => res.send("Buddy call API"));

const emailToSocketIdMap = new Map();
const socketIdToEmailMap = new Map();

const roomToEmailMap = {};
const roomToSocketIdMap = {};

const io = new Server(server, {
  cors: true,
});

io.on("connection", (socket) => {
  console.log("socket connected", socket.id);

  socket.on("room:create", (data) => {
    const { email, room } = data;

    emailToSocketIdMap.set(email, socket.id);
    socketIdToEmailMap.set(socket.id, email);

    if (roomToEmailMap[room]) throw new Error("Room already Exists");

    roomToEmailMap[room] = [email];
    roomToSocketIdMap[room] = [socket.id];

    socket.join(room);
    console.log(`Email:${email} Socket:${socket.id} created a room:${room}`);

    io.to(socket.id).emit("room:join", { room });
  });

  socket.on("room:join", (data) => {
    const { room, email } = data;

    emailToSocketIdMap.set(email, socket.id);
    socketIdToEmailMap.set(socket.id, email);

    if (!roomToEmailMap[room]) throw new Error("Room doesn't exist");

    roomToEmailMap[room].push(email);
    roomToSocketIdMap[room].push(socket.id);

    io.to(socket.id).emit("room:join", { room });
    io.to(room).emit("user:join", { user: socket.id });

    console.log(`Email:${email} Socket:${socket.id} joined a room:${room}`);

    socket.join(room);
  });

  socket.on("room:list", (data) => {
    const { room } = data;

    io.to(socket.id).emit("room:list", {
      emails: roomToEmailMap[room],
      sockets: roomToSocketIdMap[room],
    });
  });
});

server.listen(5000, () => {
  console.log("Server running on PORT 5000");
});

export { io };
