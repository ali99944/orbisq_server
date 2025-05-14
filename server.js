import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import compression from "compression";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import ErrorHandlerMiddleware from "./middlewares/error_handler.js";
import { host, port, validateConfigFile } from "./lib/configs.js";
import { NOT_FOUND } from "./lib/status_codes.js";
import logger from "./lib/logger.js";

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

app.use('/public', express.static(path.join(__dirname, './public')))

app.use(compression())
app.use(cookieParser())

// Socket.IO event handlers
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Handle joining a room (e.g., for specific shop or desk updates)
    socket.on('join-room', (room) => {
        socket.join(room);
        console.log(`Socket ${socket.id} joined room: ${room}`);
    });

    // Handle leaving a room
    socket.on('leave-room', (room) => {
        socket.leave(room);
        console.log(`Socket ${socket.id} left room: ${room}`);
    });

    // Handle desk status updates
    socket.on('desk-status-update', (data) => {
        const { deskId, status, room } = data;
        io.to(room).emit('desk-status-changed', { deskId, status });
    });

    // Handle order updates
    socket.on('order-update', (data) => {
        const { orderId, status, room } = data;
        io.to(room).emit('order-status-changed', { orderId, status });
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

const main = async () => {
    try{
        validateConfigFile()
        app.use(
            '/api',
            (await import('./routes/shop_owner_route.js')).default,
            (await import('./routes/shop_route.js')).default,
            (await import('./routes/categories_route.js')).default,
            (await import('./routes/shop_access_portal_route.js')).default,
            (await import('./routes/product_route.js')).default,
            (await import('./routes/order_route.js')).default,
            (await import('./routes/coupon_route.js')).default,
            (await import('./routes/desk_route.js')).default,
            (await import('./routes/branch_route.js')).default
        )

        app.get('*', (req ,res) => {
            return res.status(NOT_FOUND).json({
                error: '404 Not Found',
                url: req.url
            })
        })

        app.use(ErrorHandlerMiddleware)

        httpServer.listen(port, () => {
            console.log(`[server] HTTP & WebSocket server listening on ${host}:${port}`);
        });
    }catch(err){
        logger.error(err.message)
    }
}

main()