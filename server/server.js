const dns = require('dns');

dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const initializeSocket = require('./socket');

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB database
connectDB();

const app = express();
const server = http.createServer(app);
const allowedOrigin = "http://localhost:3000"
const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ['GET', 'POST'],
  },
});

// Middleware setup
app.use(cors()); // Allow cross-origin requests from frontend
app.use(express.json()); // Parse incoming JSON requests
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploaded files (profile pics, lab results)

// Route mounts - all API routes prefixed with /api
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/doctors', require('./routes/doctorRoutes'));
app.use('/api/hospitals', require('./routes/hospitalRoutes'));
app.use('/api/slots', require('./routes/slotRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/records', require('./routes/recordRoutes'));
app.use('/api/prescriptions', require('./routes/prescriptionRoutes'));
app.use('/api/results', require('./routes/resultRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

initializeSocket(io);

const PORT = process.env.PORT || 5000;

// Start the server
server.listen(PORT, () => {
  console.log(`EasyCare server running on port ${PORT}`);
});

// Global error handler - catches any unhandled errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  // Return generic error message to client (don't leak sensitive info)
  res.status(500).json({ message: "Server error" });
});