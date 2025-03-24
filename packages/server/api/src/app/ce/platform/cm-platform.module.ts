import { FastifyInstance } from 'fastify'
import { cmPlatformProjectController } from './cm-platform-project.controller'

export const cmPlatformModule = async (app: FastifyInstance) => {
    // Register the project controller
    await cmPlatformProjectController(app)

    // Add more CE platform controllers here as needed
}
