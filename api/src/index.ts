import { createApp } from './app'
import { connectDatabase, disconnectDatabase } from '@/config/database'
import { env } from '@/config/env'
import { logger } from '@/config/logger'

async function main() {
  await connectDatabase()

  const app = createApp()

  const server = app.listen(env.PORT, () => {
    logger.info(`PrecisionCore API running on port ${env.PORT} [${env.NODE_ENV}]`)
  })

  // Graceful shutdown
  async function shutdown(signal: string) {
    logger.info(`${signal} received — shutting down gracefully`)
    server.close(async () => {
      try {
        await disconnectDatabase()
        logger.info('Server closed')
        process.exit(0)
      } catch (err) {
        logger.error('Error during graceful shutdown', { error: String(err) })
        process.exit(1)
      }
    })
    setTimeout(() => { logger.error('Force exit after timeout'); process.exit(1) }, 10_000)
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT',  () => shutdown('SIGINT'))

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', { reason: String(reason) })
  })
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', { error: err.message, stack: err.stack })
    process.exit(1)
  })
}

main().catch((err) => {
  console.error('Fatal startup error:', err)
  process.exit(1)
})