const { Server } = require('socket.io');

let io = null;
const userSockets = new Map(); // Maps userId -> Set of socketIds

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // For development. Can be restricted in prod environment.
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`Socket client connected: ${socket.id}`);

    // Register user session mapping
    socket.on('register_user', (userId) => {
      if (userId) {
        if (!userSockets.has(userId)) {
          userSockets.set(userId, new Set());
        }
        userSockets.get(userId).add(socket.id);
        console.log(`User ${userId} registered to socket ${socket.id}`);
      }
    });

    // Unregister user session mapping
    socket.on('unregister_user', (userId) => {
      if (userId && userSockets.has(userId)) {
        userSockets.get(userId).delete(socket.id);
        if (userSockets.get(userId).size === 0) {
          userSockets.delete(userId);
        }
        console.log(`User ${userId} unregistered socket ${socket.id}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket client disconnected: ${socket.id}`);
      // Clean up socket mapping
      for (const [userId, sockets] of userSockets.entries()) {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            userSockets.delete(userId);
          }
          console.log(`Removed disconnected socket ${socket.id} for user ${userId}`);
          break;
        }
      }
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

/**
 * Sends a direct real-time notification to a specific user
 * @param {string} userId - Target user ID
 * @param {string} event - Socket event name
 * @param {object} payload - Notification data payload
 */
const notifyUser = (userId, event, payload) => {
  if (!io) return;
  
  const sockets = userSockets.get(userId.toString());
  if (sockets && sockets.size > 0) {
    sockets.forEach((socketId) => {
      io.to(socketId).emit(event, payload);
    });
    console.log(`Notification of event "${event}" sent to user ${userId} (${sockets.size} active sockets)`);
  } else {
    console.log(`Notification of event "${event}" skipped: user ${userId} is offline`);
  }
};

/**
 * Broadcasts an event to all connected users
 * @param {string} event - Socket event name
 * @param {object} payload - Broadcast data payload
 */
const broadcast = (event, payload) => {
  if (!io) return;
  io.emit(event, payload);
  console.log(`Broadcasted event "${event}" to all online clients`);
};

module.exports = {
  initSocket,
  getIO,
  notifyUser,
  broadcast,
};
