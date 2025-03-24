import { FastifyInstance } from 'fastify'
import { cmPlatformModule } from './platform/cm-platform.module'
import { cmPlatformPieceModule } from './pieces/cm-platform-piece.module'

export const cmCeModule = async (app: FastifyInstance) => {
    // Register all CE modules
    await cmPlatformModule(app)
    await cmPlatformPieceModule(app)

    // Register other CE modules here as needed
}
