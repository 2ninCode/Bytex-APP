import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const PORT = 3000;

  // WebSocket logic
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("new_order", (order) => {
      console.log("New order created:", order);
      // Broadcast to all connected clients
      io.emit("notification", {
        type: "new_order",
        message: `Novo pedido criado por ${order.author || 'um funcionário'}`,
        data: order
      });
    });

    socket.on("update_order", (order) => {
      console.log("Order updated:", order);
      // Broadcast to all connected clients
      io.emit("notification", {
        type: "update_order",
        message: `Pedido #${order.id} foi atualizado`,
        data: order
      });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
