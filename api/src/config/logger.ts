import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import { env } from './env'

const { combine, timestamp, json, errors, colorize, simple } = winston.format

const LOG_RETENTION_DAYS   = '30d'
const LOG_MAX_FILE_SIZE    = '100m'

const fileTransport = new DailyRotateFile({
  dirname:       env.LOG_DIR,
  filename:      'api-%DATE%.log',
  datePattern:   'YYYY-MM-DD',
  maxFiles:      LOG_RETENTION_DAYS,
  maxSize:       LOG_MAX_FILE_SIZE,
  format:        combine(timestamp(), errors({ stack: true }), json()),
})

const errorTransport = new DailyRotateFile({
  dirname:   env.LOG_DIR,
  filename:  'error-%DATE%.log',
  datePattern:'YYYY-MM-DD',
  maxFiles:  LOG_RETENTION_DAYS,
  level:     'error',
  format:    combine(timestamp(), errors({ stack: true }), json()),
})

export const logger = winston.createLogger({
  level:      env.LOG_LEVEL,
  transports: [
    fileTransport,
    errorTransport,
    ...(env.NODE_ENV !== 'production'
      ? [new winston.transports.Console({ format: combine(colorize(), simple()) })]
      : []),
  ],
})