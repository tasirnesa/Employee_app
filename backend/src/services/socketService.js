const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'a-very-secure-secret-key-2025';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4200';

class SocketService {
  constructor() {
    this.io = null;
    this.userSockets = new Map(); // userId -> Set of socketIds
  }

  init(server) {
    this.io = new Server(server, {
      cors: {
        origin: FRONTEND_URL,
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    // Middleware for authentication
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
          return next(new Error('Authentication error: Invalid token'));
        }
        socket.user = decoded;
        next();
      });
    });

    this.io.on('connection', (socket) => {
      const userId = socket.user.id;
      console.log(`User connected: ${userId} (Socket: ${socket.id})`);

      // Add to tracking map
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId).add(socket.id);

      socket.on('disconnect', () => {
        console.log(`User disconnected: ${userId} (Socket: ${socket.id})`);
        const sockets = this.userSockets.get(userId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            this.userSockets.delete(userId);
          }
        }
      });
    });

    console.log('Socket.io initialized successfully');
  }

  /**
   * Send an event to a specific user
   * @param {number|string} userId 
   * @param {string} event 
   * @param {any} data 
   */
  sendToUser(userId, event, data) {
    const sockets = this.userSockets.get(parseInt(userId));
    if (sockets && this.io) {
      sockets.forEach((socketId) => {
        this.io.to(socketId).emit(event, data);
      });
      return true;
    }
    return false;
  }

  /**
   * Broadcast an event to all connected users
   * @param {string} event 
   * @param {any} data 
   */
  broadcast(event, data) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }
}

module.exports = new SocketService();
