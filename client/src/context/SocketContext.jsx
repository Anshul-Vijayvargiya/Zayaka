import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || "http://localhost:5000";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const joinedRoomsRef = useRef(new Set());

  useEffect(() => {
    const s = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    s.on("connect", () => {
      setConnected(true);
      // Re-join everything requested so far — covers both the initial
      // connection (a component may call joinRooms before the handshake
      // finishes) and any reconnect after a dropped connection.
      if (joinedRoomsRef.current.size > 0) {
        s.emit("join", Array.from(joinedRoomsRef.current));
      }
    });

    s.on("disconnect", () => {
      setConnected(false);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  const joinRooms = (rooms) => {
    if (!socket) return;
    rooms.forEach((r) => joinedRoomsRef.current.add(r));
    // socket.io-client buffers emits issued before the connection completes
    // and flushes them on connect, so this is safe to call immediately.
    socket.emit("join", rooms);
  };

  return (
    <SocketContext.Provider value={{ socket, connected, joinRooms }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
