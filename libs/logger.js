import winston from 'winston';
import { ecsFormat } from '@elastic/ecs-winston-format';
import dotenv from 'dotenv';

dotenv.config();

const isLocal = process.env.ENV !== 'local';

const localFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp }) => {
    let logMessage = message;
    if (message instanceof Error) {
      logMessage = `${message.stack}`;
    } else if (message instanceof Object) {
      logMessage = JSON.stringify(message, null, 2);
    }

    return `[${timestamp}] - ${level.toUpperCase()} - ${logMessage}`;
  }),
);

const logger = winston.createLogger({
  level: 'info',
  format: !isLocal ? ecsFormat() : localFormat,
  transports: [new winston.transports.Console()],
});

export default logger;
