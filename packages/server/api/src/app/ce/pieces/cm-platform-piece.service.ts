import { ActivepiecesError, ErrorCode, FilteredPieceBehavior } from '@activepieces/shared'
import { platformService } from '../../platform/platform.service'

export const cmPlatformPieceService = {
  async getFilteredPiecesConfig(platformId: string) {
    const platform = await platformService.getOneOrThrow(platformId)
    return {
      filteredPieceNames: platform.filteredPieceNames || [],
      filteredPieceBehavior: platform.filteredPieceBehavior || FilteredPieceBehavior.BLOCKED
    }
  },

  async updateFilteredPiecesConfig(
    platformId: string, 
    filteredPieceNames: string[], 
    filteredPieceBehavior: FilteredPieceBehavior
  ) {
    await platformService.update({
      id: platformId,
      filteredPieceNames,
      filteredPieceBehavior,
    })
    
    return {
      success: true
    }
  },
  
  async togglePieceVisibility(
    platformId: string, 
    pieceName: string, 
    visible: boolean
  ) {
    // Get current platform settings
    const platform = await platformService.getOneOrThrow(platformId)
    const currentNames = platform.filteredPieceNames || []
    const behavior = platform.filteredPieceBehavior || FilteredPieceBehavior.BLOCKED
    
    let updatedNames = [...currentNames]
    
    if (behavior === FilteredPieceBehavior.BLOCKED) {
      // For BLOCKED behavior: if visible=false, add to list (block it); if visible=true, remove from list (unblock it)
      if (!visible && !updatedNames.includes(pieceName)) {
        updatedNames.push(pieceName)
      } else if (visible && updatedNames.includes(pieceName)) {
        updatedNames = updatedNames.filter(name => name !== pieceName)
      }
    } else {
      // For ALLOWED behavior: if visible=true, add to list (allow it); if visible=false, remove from list (disallow it)
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
  }
}
