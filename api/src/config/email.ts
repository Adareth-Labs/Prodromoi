import nodemailer from 'nodemailer'
import { env } from './env'
import { logger } from './logger'

const hasSMTPConfiguration =
  Boolean(env.SMTP_USER) &&
  Boolean(env.SMTP_PASS) &&
  Boolean(env.SMTP_FROM)

const isSMTPEnabled = env.NODE_ENV === 'production' && hasSMTPConfiguration

export const transporter = isSMTPEnabled
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER as string,
        pass: env.SMTP_PASS as string,
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    })
  : null

if (transporter) {
  transporter
    .verify()
    .then(() => {
      logger.info('SMTP2Go connection verified', {
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
      })
    })
    .catch((error: unknown) => {
      logger.warn('SMTP2Go connection failed — emails will not send', {
        error: String(error),
      })
    })
} else if (env.NODE_ENV === 'development') {
  logger.info('SMTP disabled in development')
}

export const FROM = {
  email: env.SMTP_FROM,
  name: env.SMTP_FROM_NAME,
}