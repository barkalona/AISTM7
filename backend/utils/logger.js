const winston = require('winston');
const path = require('path');

// Define log levels and colors
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
};

const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue'
};

// Create custom format
const customFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.colorize(),
    winston.format.printf(({ level, message, timestamp, stack }) => {
        if (stack) {
            return `${timestamp} ${level}: ${message}\n${stack}`;
        }
        return `${timestamp} ${level}: ${message}`;
    })
);

// Create logger instance
const logger = winston.createLogger({
    levels,
    format: customFormat,
    transports: [
        // Console transport for development
        new winston.transports.Console({
            level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
        }),
        // File transport for errors
        new winston.transports.File({
            filename: path.join(__dirname, '../logs/error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            format: winston.format.uncolorize()
        }),
        // File transport for all logs
        new winston.transports.File({
            filename: path.join(__dirname, '../logs/combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            format: winston.format.uncolorize()
        })
    ]
});

// Add colors to winston
winston.addColors(colors);

// Add request logging middleware
logger.middleware = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info(
            `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`
        );
    });
    next();
};

// Add error logging middleware
logger.errorMiddleware = (err, req, res, next) => {
    logger.error('Unhandled error:', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        body: req.body,
        query: req.query,
        params: req.params
    });
    next(err);
};

// Add stream for Morgan
logger.stream = {
    write: (message) => {
        logger.info(message.trim());
    }
};

module.exports = logger;