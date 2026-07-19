const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Conversation = require('../models/Conversation'); // Bring in your Conversation model

module.exports = function initializeSocket(io) {
  // Authentication Interceptor Middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid signature'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected securely: ${socket.user._id} (${socket.user.role})`);

    // SECURED: Validate membership permissions before joining room
    socket.on('joinConversation', async (conversationId) => {
      if (!conversationId) return;

      try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          return socket.emit('error', { message: 'Conversation template not found' });
        }

        // Verify that the socket user's ID matches either the registered patient or doctor
        const isAuthorized =
          conversation.patientId.toString() === socket.user._id.toString() ||
          conversation.doctorId.toString() === socket.user._id.toString();

        if (!isAuthorized) {
          console.warn(`Unauthorized access attempt by user ${socket.user._id} on room ${conversationId}`);
          return socket.emit('error', { message: 'Access denied: You are not a participant in this chat' });
        }

        // Only allow connection if authorization passes
        socket.join(conversationId);
        console.log(`User ${socket.user._id} successfully entered room: ${conversationId}`);
      } catch (err) {
        console.error('Socket room authorization error:', err);
        socket.emit('error', { message: 'Internal server error during handshake' });
      }
    });

    socket.on('sendMessage', (payload) => {
      // SECURED OPTION: Ensure senderId matches authenticated socket session user identity
      if (payload?.conversationId) {
        // Force the server-side authenticated ID onto the payload to prevent identity spoofing
        payload.senderId = {
          _id: socket.user._id,
          name: socket.user.name,
          role: socket.user.role,
          profilePicture: socket.user.profilePicture
        };
        io.to(payload.conversationId).emit('receiveMessage', payload);
      }
    });

    socket.on('markRead', (payload) => {
      if (payload?.conversationId) {
        io.to(payload.conversationId).emit('messagesRead', payload);
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user._id}`);
    });
  });
};