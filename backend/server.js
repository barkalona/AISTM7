require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const connectDB = require('./utils/db');
const backupService = require('./utils/backup');
const cron = require('node-cron');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 5000;

// Log the MONGO_URI environment variable
console.log('MONGO_URI:', process.env.MONGO_URI);

// Connect to Database
connectDB();

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
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});