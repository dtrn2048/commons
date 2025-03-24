import { FastifyInstance } from 'fastify'
import { cmPlatformPieceController } from './cm-platform-piece.controller'

export const cmPlatformPieceModule = async (app: FastifyInstance) => {
  await cmPlatformPieceController(app)
}
