import { isNil } from '@activepieces/shared'
import { defaultPieceHooks, PieceMetadataServiceHooks } from '../../pieces/piece-metadata-service/hooks'
import { platformService } from '../../platform/platform.service'

export const cmPieceMetadataServiceHooks: PieceMetadataServiceHooks = {
  async filterPieces(params) {
    const { platformId, includeHidden, pieces } = params
    
    // If admin view with includeHidden or no platformId, return all pieces
    if (includeHidden || isNil(platformId)) {
      return defaultPieceHooks.filterPieces(params)
    }
    
    // Get platform and apply filtering
    const platform = await platformService.getOneOrThrow(platformId)
    
    // If no filtered pieces, show all pieces (default behavior)
    if (!platform.filteredPieceNames || platform.filteredPieceNames.length === 0) {
      return pieces
    }
    
    // Apply filtering based on behavior
    const filterPredicate = platform.filteredPieceBehavior === 'ALLOWED'
      ? (p: {name: string}) => platform.filteredPieceNames.includes(p.name)
      : (p: {name: string}) => !platform.filteredPieceNames.includes(p.name)
    
    return pieces.filter(filterPredicate)
  }
}
