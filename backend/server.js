require('dotenv').config();
const express = require('express');
const cors = require('cors');
const expressWs = require('express-ws');
const routes = require('./routes');
const { connectDB } = require('./utils/db');
const backupService = require('./utils/backup');
const cron = require('node-cron');
const morgan = require('morgan');
const net = require('net');

// Function to find an available port
const findAvailablePort = (startPort) => {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', () => {
      // Port is in use, try the next one
      resolve(findAvailablePort(startPort + 1));
    });
  });
};

const startServer = async () => {
  try {
    const app = express();
    const wsInstance = expressWs(app);
    const PORT = await findAvailablePort(process.env.PORT || 5000);

    // Connect to Database
    await connectDB();

    // Middleware
    app.use(cors());
    app.use(express.json());
    app.use(morgan('dev'));

    // Schedule database backups
    cron.schedule('0 0 * * *', async () => {
      console.log('Running daily database backup...');
      try {
        await backupService.createBackup();
        console.log('Daily database backup completed successfully.');
      } catch (error) {
        console.error('Error running daily database backup:', error);
      }
    });

    // Routes
    app.use('/api', routes);

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    });

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Handle WebSocket errors
    server.on('upgrade', (request, socket, head) => {
      socket.on('error', (err) => {
        console.error('WebSocket error:', err);
      });
    });

    // Handle process termination
    const gracefulShutdown = () => {
      console.log('Shutting down gracefully...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer().catch(error => {
  console.error('Server startup error:', error);
  process.exit(1);
});