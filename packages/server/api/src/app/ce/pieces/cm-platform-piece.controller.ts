import { FastifyInstance, FastifyRequest } from 'fastify'
import { ActivepiecesError, ErrorCode, FilteredPieceBehavior, PlatformRole } from '@activepieces/shared'
import { userService } from '../../user/user-service'
import { platformService } from '../../platform/platform.service'
import { pieceSyncService } from '../../pieces/piece-sync-service'

// Helper function to verify platform admin
async function isPlatformAdmin(request: FastifyRequest): Promise<boolean> {
  const user = await userService.getOneOrFail({
    id: request.principal.id,
  })
  return user.platformRole === PlatformRole.ADMIN
}

// Request type for updating piece visibility
type UpdatePieceVisibilityRequest = FastifyRequest<{
  Params: {
    pieceName: string
  }
  Body: {
    visible: boolean
  }
}>

// Request type for updating filtered pieces
type UpdateFilteredPiecesRequest = FastifyRequest<{
  Body: {
    filteredPieceNames: string[]
    filteredPieceBehavior: FilteredPieceBehavior
  }
}>

export const cmPlatformPieceController = async (fastify: FastifyInstance) => {
  fastify.register(async (router) => {
    // Sync pieces from activepieces
    router.post('/sync', async (request) => {
      // Check if the user is a platform admin
      const isAdmin = await isPlatformAdmin(request)
      if (!isAdmin) {
        throw new ActivepiecesError({
          code: ErrorCode.AUTHORIZATION,
          params: {
            message: 'Only platform admins can access this resource',
          },
        })
      }

      // Call the piece sync service to sync pieces from activepieces
      await pieceSyncService(fastify.log).sync()
      
      return {
        success: true,
      }
    })

    // Get filtered pieces configuration
    router.get('/', async (request) => {
      // Check if the user is a platform admin
      const isAdmin = await isPlatformAdmin(request)
      if (!isAdmin) {
        throw new ActivepiecesError({
          code: ErrorCode.AUTHORIZATION,
          params: {
            message: 'Only platform admins can access this resource',
          },
        })
      }
      
      const platformId = request.principal.platform.id
      const platform = await platformService.getOneOrThrow(platformId)
      
      return {
        filteredPieceNames: platform.filteredPieceNames || [],
        filteredPieceBehavior: platform.filteredPieceBehavior || FilteredPieceBehavior.BLOCKED
      }
    })

    // Update filtered pieces
    router.patch('/', async (request: UpdateFilteredPiecesRequest) => {
      // Check if the user is a platform admin
      const isAdmin = await isPlatformAdmin(request)
      if (!isAdmin) {
        throw new ActivepiecesError({
          code: ErrorCode.AUTHORIZATION,
          params: {
            message: 'Only platform admins can access this resource',
          },
        })
      }
      
      const platformId = request.principal.platform.id
      const { filteredPieceNames, filteredPieceBehavior } = request.body
      
      await platformService.update({
        id: platformId,
        filteredPieceNames,
        filteredPieceBehavior,
      })
      
      return {
        success: true
      }
    })

    // Toggle visibility for a single piece
    router.patch('/:pieceName', async (request: UpdatePieceVisibilityRequest) => {
      // Check if the user is a platform admin
      const isAdmin = await isPlatformAdmin(request)
      if (!isAdmin) {
        throw new ActivepiecesError({
          code: ErrorCode.AUTHORIZATION,
          params: {
            message: 'Only platform admins can access this resource',
          },
        })
      }
      
      const platformId = request.principal.platform.id
      const { pieceName } = request.params
      const { visible } = request.body
      
      // Get current platform settings
      const platform = await platformService.getOneOrThrow(platformId)
      const currentNames = platform.filteredPieceNames || []
      const behavior = platform.filteredPieceBehavior || FilteredPieceBehavior.BLOCKED
      
      let updatedNames = [...currentNames]
      
      if (behavior === FilteredPieceBehavior.BLOCKED) {
        // For BLOCKED behavior: if visible=false, add to list; if visible=true, remove from list
        if (!visible && !updatedNames.includes(pieceName)) {
          updatedNames.push(pieceName)
        } else if (visible && updatedNames.includes(pieceName)) {
          updatedNames = updatedNames.filter(name => name !== pieceName)
        }
      } else {
        // For ALLOWED behavior: if visible=true, add to list; if visible=false, remove from list
        if (visible && !updatedNames.includes(pieceName)) {
          updatedNames.push(pieceName)
        } else if (!visible && updatedNames.includes(pieceName)) {
          updatedNames = updatedNames.filter(name => name !== pieceName)
        }
      }
      
      // Update the platform
      await platformService.update({
        id: platformId,
        filteredPieceNames: updatedNames,
      })
      
      return {
        success: true,
        filteredPieceNames: updatedNames
      }
    })
  }, { prefix: '/v1/ce/platform/pieces' })
}
