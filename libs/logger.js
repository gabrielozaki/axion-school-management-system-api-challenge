import winston from 'winston';
import { ecsFormat } from '@elastic/ecs-winston-format';
import dotenv from 'dotenv';

dotenv.config();

const isLocal = process.env.ENV !== 'local';

const localFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp }) => {
    return `[${timestamp}] - ${level.toUpperCase()} - ${message}`;
  }),
);

const logger = winston.createLogger({
  level: 'info',
  format: !isLocal ? ecsFormat() : localFormat,
  transports: [new winston.transports.Console()],
});

export default logger;
