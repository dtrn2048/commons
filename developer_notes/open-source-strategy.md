# Strategy for Forking Activepieces With Clean Upstream Integration

## Overview

This document outlines a strategy for forking the Activepieces project while ensuring that custom extensions and features remain easily separable from the core codebase. This approach aims to facilitate regular updates from the upstream project without disrupting custom implementations.

## Current Architecture Analysis

After examining the codebase, I found that Activepieces already implements a clear separation between Community Edition (CE) and Enterprise Edition (EE) features:

1. **Edition-Based Loading**: The system loads different modules based on the `ApEdition` setting (COMMUNITY, ENTERPRISE, CLOUD)
2. **Directory Structure**: Enterprise features are isolated in dedicated directories:
   - `packages/ee/` - Contains enterprise-specific shared code and UI components
   - `packages/server/api/src/app/ee/` - Server-side enterprise features

3. **Extension Hooks**: The codebase uses a hooks pattern to enable enterprise extensions to core functionality:
   ```typescript
   // For example in app.ts:
   projectHooks.set(projectEnterpriseHooks)
   eventsHooks.set(auditLogService)
   flowRunHooks.set(platformRunHooks)
   pieceMetadataServiceHooks.set(enterprisePieceMetadataServiceHooks)
   ```

4. **Module Registration**: The app.ts file demonstrates conditional module registration based on the edition:
   ```typescript
   switch (edition) {
       case ApEdition.CLOUD:
           // Register cloud-specific modules
           break;
       case ApEdition.ENTERPRISE:
           // Register enterprise-specific modules
           break;
       case ApEdition.COMMUNITY:
           // Register community-specific modules
           break;
   }
   ```

## Core Implementation Principles

### 1. Preserve and Reuse Core Components

**IMPORTANT**: When implementing CE alternatives to EE features, always analyze the existing codebase to identify what core components already exist and can be reused. This principle is crucial to avoid duplicated effort and maintaining consistency.

- **Before Starting Implementation**:
  - Examine the core codebase to identify existing models, repositories, and services
  - Analyze which portions of an EE feature are truly enterprise-specific and which leverage core functionality
  - Check both EE code and core code to understand the complete architecture

- **Minimal Implementation Approach**:
  - Only replace the EE-specific parts of features, while keeping core components intact
  - Create adapters or wrappers around core functionality rather than duplicating it
  - Leverage existing data models from the core when they already exist

### 2. UI Integration Strategy

CE features should integrate seamlessly with existing UI structures:

- Use existing UI containers and layouts (like the platform admin console)
- Add new navigation items to existing menus instead of creating parallel navigation structures
- Follow existing UI patterns and component architecture

### 3. Code Efficiency and Clean Architecture

- Prioritize efficiency by avoiding the rebuilding of components that already exist in the core
- Maintain clean separation between concerns while avoiding unnecessary duplication
- Document dependencies on core components for maintainability

## Strategy for Clean Forking

### 1. Create a Custom Edition

Create a new edition type alongside the existing ones (COMMUNITY, ENTERPRISE, CLOUD):

```typescript
// In packages/shared/src/lib/common/app-edition.ts
export enum ApEdition {
    COMMUNITY = 'COMMUNITY',
    ENTERPRISE = 'ENTERPRISE',
    CLOUD = 'CLOUD',
    CUSTOM = 'CUSTOM' // Add your custom edition
}
```

### 2. Create a Custom Code Directory Structure

Follow the existing pattern but with a custom namespace:

```
packages/
  custom/                 # Your custom shared code
    shared/               # Shared models and utilities
    ui/                   # Custom UI components
  server/api/src/app/custom/  # Server-side custom features
```

### 3. Extension through Hooks

Utilize the existing hooks system to extend functionality:

1. Create your own hook implementations
2. Register them conditionally based on the `CUSTOM` edition

Example:
```typescript
// In app.ts, add to the switch statement:
case ApEdition.CUSTOM:
    await app.register(customProjectModule)
    await app.register(customFeatureModule)
    // Set custom hooks
    projectHooks.set(customProjectHooks)
    flowRunHooks.set(customFlowRunHooks)
    flagHooks.set(customFlagsHooks)
    break;
```

### 4. Module Registration

Create custom modules following the existing pattern:

```typescript
// packages/server/api/src/app/custom/feature/custom-feature.module.ts
export const customFeatureModule = async (app: FastifyInstance): Promise<void> => {
    app.register(async (router) => {
        router.addHook('preHandler', checkAuthAndPermissions)
        
        router.post('/', createHandler)
        router.get('/', listHandler)
        // etc.
    }, { prefix: '/v1/custom-features' })
}
```

### 5. Configuration Override

Extend the system configuration to handle custom settings:

```typescript
// Add to packages/server/api/src/app/helper/system/system.ts
const systemPropDefaultValues: Partial<Record<SystemProp, string>> = {
    // Existing properties
    [AppSystemProp.CUSTOM_FEATURE_ENABLED]: 'false',
    // Add more custom properties
}
```

### 6. Handle Database Migrations

Place custom database migration files in a separate directory:

```
packages/server/api/src/app/custom/migrations/
```

### 7. Testing Structure

Follow the existing pattern for test organization:

```
packages/server/api/test/
  integration/
    custom/  # Custom integration tests
  unit/app/
    custom/  # Custom unit tests
```

## Merge Strategy

When pulling updates from upstream:

1. **Git Setup**:
   ```bash
   # Add upstream remote
   git remote add upstream https://github.com/activepieces/activepieces.git
   ```

2. **Pull Updates**:
   ```bash
   # Fetch upstream changes
   git fetch upstream
   # Merge into local branch
   git merge upstream/main
   ```

3. **Handle Conflicts**:
   - Core files: Favor upstream changes unless they directly affect your custom code
   - Custom files: Keep your changes as they should be in separate directories
   - Shared interfaces: Carefully merge changes, possibly extending rather than modifying

## CI/CD Configuration

Setup CI/CD to validate that custom changes don't interfere with core functionality:

1. Test that core functionality works with your custom edition disabled
2. Test the integration between core and your custom features
3. Validate that your changes work with different environment configurations

## UI Integration Strategy

The Activepieces UI is built using Angular. To integrate custom UI components:

1. **Feature Flags**: Use the existing flags system to conditionally show your custom UI components
   ```typescript
   // In UI component
   if (this.flagService.isFeatureEnabled('custom_feature')) {
     // Show custom UI elements
   }
   ```

2. **UI Extension Points**: Identify key extension points in the UI where custom components can be injected:
   - Admin console navigation menu
   - Flow editor sidebar
   - Connection management screens
   - Settings pages

3. **Component Replacement**: For deeper customizations, create a module that replaces core components:
   ```typescript
   // In your custom module
   providers: [
     { provide: CoreComponent, useClass: CustomComponent }
   ]
   ```

4. **Styling**: Maintain a separate theme directory for custom styling:
   ```
   packages/custom/ui/styles/
   ```

## Versioning Strategy

1. Track the upstream version you forked from in your documentation
2. Maintain a changelog of your custom features and modifications
3. Consider using a versioning scheme like `[upstream-version]-[custom-version]` (e.g., `0.8.0-custom.2`)

## Database Integration Strategy

Activepieces uses TypeORM for database management. For custom database entities:

1. **Entity Separation**: Define custom entities in your own namespace:
   ```typescript
   // packages/server/api/src/app/custom/entities/custom-feature.entity.ts
   @Entity()
   export class CustomFeature {
     @PrimaryGeneratedColumn('uuid')
     id: string;
     
     // Custom properties
   }
   ```

2. **Database Migrations**: 
   - Create migrations for your custom entities
   - Name migrations to clearly distinguish them from core migrations
   - Use a prefix like `CustomFeature` for your migration files

3. **TypeORM Configuration**:
   - Extend the TypeORM configuration to include your custom entities
   - Add custom entities conditionally based on your custom edition

4. **Data Integration**:
   - When extending core entities, create relations to them rather than modifying them directly
   - Use views or query builders to combine data from core and custom tables when necessary

## Implementation Planning Process

To ensure efficient development and avoid duplication of effort:

1. **Analysis Phase (Critical)**
   - Study both EE code and relevant core code before planning implementations
   - Identify which components are EE-specific vs. reusable core components
   - Document dependencies and integration points

2. **Feature Planning**
   - Create a clear boundary between what needs to be reimplemented and what can be reused
   - Map out the minimal changes required to replace EE functionality
   - Plan for integration with existing UI components and containers

3. **Design Review**
   - Have peers review implementation plans to ensure they minimize duplication
   - Verify that core components are being properly leveraged

4. **Implementation Documentation**
   - Document which core components are being used and how
   - Note any adaptations or wrappers created to interface with core functionality

## Conclusion

By following the existing architectural patterns in Activepieces and creating a clear separation between core functionality and custom features, you can maintain a fork that:

1. Easily integrates updates from the upstream project
2. Keeps your custom code isolated and maintainable
3. Minimizes merge conflicts
4. Retains the ability to contribute changes back to the upstream project
5. Efficiently reuses existing core components while replacing only EE-specific functionality

This strategy leverages the existing separation between CE and EE features in Activepieces to create a sustainable fork that can stay up-to-date with the main project while allowing for significant customization.
