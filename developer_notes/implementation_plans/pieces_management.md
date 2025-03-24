# Pieces Management Implementation Plan

## Overview

This document outlines the implementation plan for the Commons Edition (CE) Pieces Management feature. The goal is to provide platform administrators with the ability to control which integration pieces are available to projects, similar to the Enterprise Edition functionality but implemented using the CE code structure.

## Background

Based on the codebase analysis, we've identified:

1. **Existing Functionality**:
   - Core piece listing and management is handled by `pieceModule`
   - Basic piece installation is provided by `communityPiecesModule`
   - In the Enterprise Edition, platform-level piece management is handled by `adminPieceModule` and `platformPieceModule`
   - The Platform entity already has support for piece filtering through `filteredPieceNames` and `filteredPieceBehavior` properties

2. **Missing in CE**:
   - Platform-level piece management functionality via CE-specific controllers
   - CE-specific piece visibility hooks
   - Integration with the admin UI for managing pieces

## CE Edition Implementation Notes

When running in CE mode, there are some important implementation details to remember:

1. The components and UI path are under `/app/routes/platform/setup/pieces/` rather than using CE-specific paths
2. In CE mode, we always enable piece management via `const isEnabled = edition === ApEdition.COMMUNITY ? true : platform.managePiecesEnabled`
3. All pieces from the local repository are loaded automatically on server startup without requiring cloud sync
4. No sync functionality is needed or provided - we rely entirely on locally available pieces
5. The proper display of Eye/EyeOff icons to show visibility status needs to account for both `filteredPieceNames` and `filteredPieceBehavior` settings

## Implementation Approach

We'll create CE versions of the necessary components while ensuring we don't duplicate existing functionality. Our implementation will leverage the existing UI at `/platform/setup/pieces` and provide compatible backend APIs. We'll use the platform entity's existing `filteredPieceNames` and `filteredPieceBehavior` properties rather than creating a new database table.

## Components to Implement

### 1. Metadata Service Hooks

```typescript
// packages/server/api/src/app/ce/pieces/cm-piece-metadata-service-hooks.ts
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
      ? (p) => platform.filteredPieceNames.includes(p.name)
      : (p) => !platform.filteredPieceNames.includes(p.name)
    
    return pieces.filter(filterPredicate)
  }
}
```

### 2. Controller Layer

```typescript
// packages/server/api/src/app/ce/pieces/cm-platform-piece.controller.ts
import { FastifyInstance, FastifyRequest } from 'fastify'
import { ActivepiecesError, ErrorCode, FilteredPieceBehavior, PlatformRole } from '@activepieces/shared'
import { userService } from '../../user/user-service'
import { platformService } from '../../platform/platform.service'

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
        filteredPieceNames: platform.filteredPieceNames,
        filteredPieceBehavior: platform.filteredPieceBehavior
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
```

### 3. Module Registration

```typescript
// packages/server/api/src/app/ce/pieces/cm-platform-piece.module.ts
import { FastifyInstance } from 'fastify'
import { cmPlatformPieceController } from './cm-platform-piece.controller'

export const cmPlatformPieceModule = async (app: FastifyInstance) => {
  await cmPlatformPieceController(app)
}
```

## Integration Points

### 1. CE Module Integration

```typescript
// packages/server/api/src/app/ce/cm-ce.module.ts
import { FastifyInstance } from 'fastify'
import { cmPlatformModule } from './platform/cm-platform.module'
import { cmPlatformPieceModule } from './pieces/cm-platform-piece.module'

export const cmCeModule = async (app: FastifyInstance) => {
  // Register all CE modules
  await cmPlatformModule(app)
  await cmPlatformPieceModule(app)
}
```

### 2. Hooks Registration in app.ts

```typescript
// In app.ts
case ApEdition.COMMUNITY:
  await app.register(projectModule)
  await app.register(communityPiecesModule)
  await app.register(communityFlowTemplateModule)
  await app.register(cmCeModule)
  // Add our hooks registration
  pieceMetadataServiceHooks.set(cmPieceMetadataServiceHooks)
  break;
```

## Frontend Integration

The existing UI components at `/platform/setup/pieces` are already designed to work with the same data structure we're using (platform.filteredPieceNames and platform.filteredPieceBehavior). We'll create compatible endpoints so the UI can interact with our CE implementation.

## Implementation Phases

### Phase 1: Backend Implementation
- Implement the metadata service hooks for filtering pieces
- Create the controller with appropriate endpoints
- Register the module

### Phase 2: Integration
- Register the module in CE module system
- Register the hooks in app.ts
- Test the API endpoints

### Phase 3: Frontend Integration
- Verify that existing UI components work with our CE endpoints
- Test the complete flow

## Testing Strategy

1. **API Testing**: Verify the functionality of each endpoint using tools like curl or Postman
2. **UI Testing**: Ensure the admin interface correctly displays pieces and allows toggling visibility
3. **Integration Testing**: Check that filters are properly applied when users access pieces

## Success Criteria

1. Platform admins can view all available pieces in the admin console
2. Admins can toggle piece visibility through the UI
3. Regular users can only see pieces that haven't been hidden by admins
4. The implementation follows CE naming conventions and code organization principles
