import { io } from "socket.io-client";
import { normalizeUrls } from "./api";

const getSocketUrl = () => {
  const envApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL;
  if (envApiUrl) {
    return envApiUrl.replace(/\/api\/?$/, "");
  }
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    return `http://${hostname}:8000`;
  }
  return "http://localhost:8000";
};

const SOCKET_URL = getSocketUrl();
let socket = null;

export const initiateSocketConnection = () => {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    autoConnect: true,
    withCredentials: true,
    transports: ["polling", "websocket"]
  });

  // Wrap socket.on to automatically normalize any local backend URLs in socket events
  const originalOn = socket.on;
  socket.on = function (event, fn) {
    const wrappedFn = function (...args) {
      const normalizedArgs = args.map(arg => normalizeUrls(arg));
      return fn.apply(this, normalizedArgs);
    };
    return originalOn.call(this, event, wrappedFn);
  };

  console.log("Connecting to WebSocket server...");

  socket.on("connect", () => {
    console.log("WebSocket connected successfully:", socket.id);
  });

  socket.on("disconnect", () => {
    console.log("WebSocket disconnected.");
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initiateSocketConnection();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log("WebSocket disconnected manually.");
  }
};

export const joinChatRoomSocket = (roomId) => {
  const s = getSocket();
  if (s) {
    s.emit("join_room", roomId);
    console.log(`Joined room via WebSocket: ${roomId}`);
  }
};

export const leaveChatRoomSocket = (roomId) => {
  const s = getSocket();
  if (s) {
    s.emit("leave_room", roomId);
    console.log(`Left room via WebSocket: ${roomId}`);
  }
};

export const sendTypingStatusSocket = (roomId, userId, isTyping, firstName) => {
  const s = getSocket();
  if (s) {
    s.emit("typing", { roomId, userId, isTyping, firstName });
  }
};
