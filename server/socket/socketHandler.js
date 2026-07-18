const User = require('../models/User');

const onlineUsers = new Map();

const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log('🔌 New socket connection:', socket.id);

    // User comes online
    socket.on('user-online', async (userId) => {
      onlineUsers.set(userId, socket.id);

      const user = await User.findByIdAndUpdate(
        userId,
        {
          isOnline: true,
          lastSeen: new Date(),
        },
        { new: true }
      );

      io.emit('user-status-updated', {
        userId,
        isOnline: true,
      });

      socket.join(`user-${userId}`);
    });

    // User goes offline
    socket.on('disconnect', async () => {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);

          await User.findByIdAndUpdate(userId, {
            isOnline: false,
            lastSeen: new Date(),
          });

          io.emit('user-status-updated', {
            userId,
            isOnline: false,
          });

          break;
        }
      }
      console.log('🔌 User disconnected:', socket.id);
    });

    // Join chat room
    socket.on('join-chat', (chatId) => {
      socket.join(`chat-${chatId}`);
      console.log(`✅ User joined chat-${chatId}`);
    });

    // Leave chat room
    socket.on('leave-chat', (chatId) => {
      socket.leave(`chat-${chatId}`);
      console.log(`❌ User left chat-${chatId}`);
    });

    // Send message
    socket.on('send-message', (data) => {
      const { chatId, message } = data;
      io.to(`chat-${chatId}`).emit('receive-message', message);
    });

    // Typing indicator
    socket.on('typing', (data) => {
      const { chatId, userId, username } = data;
      socket.to(`chat-${chatId}`).emit('user-typing', {
        userId,
        username,
      });
    });

    // Stop typing
    socket.on('stop-typing', (chatId) => {
      socket.to(`chat-${chatId}`).emit('user-stop-typing');
    });

    // Message read
    socket.on('message-read', (data) => {
      const { chatId, messageId, userId } = data;
      io.to(`chat-${chatId}`).emit('message-read-update', {
        messageId,
        userId,
      });
    });

    // User call
    socket.on('call-user', (data) => {
      const { to, from, offer } = data;
      const recipientSocket = onlineUsers.get(to);

      if (recipientSocket) {
        io.to(recipientSocket).emit('incoming-call', {
          from,
          offer,
        });
      }
    });

    // Call answer
    socket.on('call-answer', (data) => {
      const { to, answer } = data;
      const targetSocket = onlineUsers.get(to);

      if (targetSocket) {
        io.to(targetSocket).emit('call-answered', {
          answer,
        });
      }
    });

    // ICE candidate
    socket.on('ice-candidate', (data) => {
      const { to, candidate } = data;
      const targetSocket = onlineUsers.get(to);

      if (targetSocket) {
        io.to(targetSocket).emit('ice-candidate', {
          candidate,
        });
      }
    });

    // End call
    socket.on('end-call', (data) => {
      const { to } = data;
      const targetSocket = onlineUsers.get(to);

      if (targetSocket) {
        io.to(targetSocket).emit('call-ended');
      }
    });
  });
};

module.exports = setupSocketHandlers;
