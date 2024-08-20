import winston from "winston";

// Define the severity levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

/*
 If the server was on development mode, show all the log levels.
 If the server was on production mode, show only warn and error messages.
*/
const level = () => {
  const env = process.env.NODE_ENV || 'development'
  const isDevelopment = env === 'development'
  return isDevelopment ? 'debug' : 'warn'
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Show different color for different severity levels.
winston.addColors(colors);

const format = winston.format.combine(
  // Add the message timestamp
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  // Colorize the messages
  winston.format.colorize({ all: true }),
  // Define the format of the message
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);


const transports = [
  // Print the messages in console.
  new winston.transports.Console(),
];

const Logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});

export default Logger;