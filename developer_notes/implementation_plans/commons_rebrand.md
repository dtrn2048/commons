# Commons Rebrand Implementation Plan

## Overview

This document outlines a comprehensive strategy for rebranding the open-source version of ActivePieces to "Commons", while maintaining upstream compatibility with the original codebase. This rebrand will focus primarily on replacing frontend branding elements while following the code organization guidelines from the CE Code Guide to ensure clean separation and maintainability.

## Goals and Requirements

1. **Maintain Upstream Compatibility**: Ensure the Commons codebase can easily integrate updates from the ActivePieces upstream project
2. **Apply CE Naming Conventions**: Follow the Commons Edition code guide with `cm_`, `Cm` prefixes for new code 
3. **Replace Branding Elements**: Update logos, names, colors, and UI elements to reflect the Commons brand
4. **Support New Features**: Ensure the architecture supports Commons-specific features such as ticketing, AI agents, and knowledge containers

## Implementation Strategy

### 1. Code Organization

According to the Commons Edition (CE) Code Guide, we will maintain the following directory structure for Commons-specific code:

```
packages/
├── ce/                         # All Commons Edition code goes here
│   ├── shared/                 # Shared models, utilities and interfaces
│   ├── ui/                     # UI components and services
│   ├── api/                    # API controllers and services
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── authentication/  # Authentication modules
│   │   │   │   ├── projects/        # Project management 
│   │   │   │   ├── flows/           # Flow management
│   │   │   │   ├── connections/     # Connection management
│   │   │   │   └── pieces/          # Pieces management
│   │   │   └── migrations/          # Database migrations
│   ├── engine/                 # Flow execution engine
│   └── pieces/                 # Integration pieces
```

For existing ActivePieces code, we'll maintain the original structure to ensure upstream compatibility. New Commons-specific features will be placed in the CE directory structure following the naming conventions.

### 2. Branding Element Replacement

#### 2.1 Visual Assets

1. **Logo Replacement**:
   - Replace the ActivePieces logo (`assets/ap-logo.png`) with Commons logo
   - Update favicon and other icon assets in `/docs` directory
   - Replace any embedded logos in UI components

2. **UI Theme Updates**:
   - Create a Commons theme with new color palette
   - Update UI styling to reflect Commons branding
   - Replace any branded UI elements (buttons, headers, etc.)

#### 2.2 Text and Naming Updates

1. **Product Name References**:
   - Update all instances of "ActivePieces" to "Commons" in UI text
   - Update documentation references
   - Update email templates and notification text

2. **API and Code References**:
   - For new Commons-specific code, follow CE naming conventions with `cm_` and `Cm` prefixes
   - For shared code paths, create proper abstractions to handle branding differences

### 3. Configuration and Environment Variables

1. **Environment Variable Updates**:
   - Add `CM_` prefixed environment variables for Commons-specific configurations
   - Create compatibility layer for existing `AP_` environment variables

2. **Configuration Files**:
   - Update configuration files to support Commons-specific settings
   - Maintain compatibility with ActivePieces configuration structure

### 4. License and Copyright Updates

1. **License Notices**:
   - Update license information for Commons-specific code
   - Maintain original license notices for ActivePieces code

2. **Copyright Headers**:
   - Add appropriate copyright headers to Commons-specific files

## Implementation Plan

### Phase 1: Core Branding Assets (Week 1)

1. **Create Commons Visual Assets**
   - Design and create Commons logo, favicon, and other visual assets
   - Create a Commons UI theme with color palette and typography settings

2. **Setup CE Directory Structure**
   - Create the CE directory structure following the CE Code Guide
   - Setup initial Commons-specific shared modules

3. **Initialize Edition Detection**
   - Implement edition detection mechanism to differentiate between ActivePieces and Commons
   - Create configuration entries for edition-specific behavior

### Phase 2: UI Components and Frontend Rebrand (Week 2-3)

1. **Create Commons UI Components**
   - Implement CE-specific UI components following naming conventions
   - Create theme provider for Commons styling

2. **Update Text References**
   - Replace "ActivePieces" references with "Commons" in UI text
   - Update documentation and help text

3. **Implement Logo and Branding Replacement**
   - Create mechanism to swap logos and branding elements based on edition
   - Update frontend assets

### Phase 3: Backend Support and Configuration (Week 3)

1. **Implement Commons-specific API Routes**
   - Create `/v1/ce/` prefixed API routes for Commons-specific features
   - Implement API controllers following CE naming conventions

2. **Update Configuration System**
   - Implement `CM_` prefixed environment variables
   - Create compatibility layer for configuration

3. **Build Script Updates**
   - Modify build scripts to support Commons edition
   - Create separate distribution packages if needed

### Phase 4: Testing and Documentation (Week 4)

1. **Test Branding Consistency**
   - Verify all visual elements properly reflect Commons branding
   - Check text references throughout the application

2. **Test Upstream Compatibility**
   - Verify that future updates from ActivePieces can be integrated
   - Test that Commons-specific features don't interfere with core functionality

3. **Update Documentation**
   - Create Commons-specific documentation
   - Update installation and configuration guides

## Technical Implementation Details

### Edition Detection and Branding Switch

The system will determine which brand assets to display based on an edition configuration:

```typescript
// In packages/ce/shared/lib/common/cm-edition.ts
export enum CmEdition {
  ACTIVEPIECES = 'ACTIVEPIECES',
  COMMONS = 'COMMONS'
}

export const getCurrentEdition = (): CmEdition => {
  return process.env.CM_EDITION || CmEdition.COMMONS;
}
```

### UI Component Override System

For UI components that need branding differences, we'll implement a component override system:

```typescript
// Example component override in Angular
@NgModule({
  declarations: [
    // Components
  ],
  providers: [
    {
      provide: LogoComponent,
      useClass: getCurrentEdition() === CmEdition.COMMONS 
        ? CmLogoComponent 
        : LogoComponent
    }
  ]
})
export class AppModule { }
```

### Brand Asset Management

Brand assets will be organized in an edition-specific structure:

```
assets/
├── commons/              # Commons-specific assets
│   ├── logo.svg
│   ├── favicon.ico
│   ├── email-templates/
│   └── themes/
└── activepieces/         # Original ActivePieces assets (maintained for compatibility)
    ├── ap-logo.png
    └── ...
```

The build system will select assets based on the target edition.

### Configuration System Extension

Extend the configuration system to support Commons-specific settings while maintaining compatibility:

```typescript
// In packages/ce/shared/lib/common/cm-system-prop.ts
export enum CmSystemProp {
  CM_EDITION = 'CM_EDITION',
  CM_BRANDING_LOGO = 'CM_BRANDING_LOGO',
  CM_BRANDING_FAVICON = 'CM_BRANDING_FAVICON',
  CM_BRANDING_NAME = 'CM_BRANDING_NAME',
  // Other Commons-specific properties
}

// Compatibility layer for existing system properties
export const getSystemProp = (prop: string): string => {
  // Check for Commons-specific override first
  if (prop in CmSystemProp && process.env[prop]) {
    return process.env[prop]!;
  }
  
  // Fall back to original ActivePieces configuration
  return originalGetSystemProp(prop);
}
```

## Database Considerations

1. **Table Prefixes**:
   - Use `cm_` prefix for Commons-specific database tables
   - Maintain compatibility with existing data structures

2. **Migration Handling**:
   - Create Commons-specific migrations with `Cm` prefix
   - Ensure migrations can run alongside ActivePieces migrations

## New Feature Support

The rebrand architecture will support new Commons-specific features:

1. **Ticketing System**:
   - Place implementation in `packages/ce/api/src/app/ticketing/`
   - Follow CE naming conventions for controllers, services, and entities

2. **AI Agents**:
   - Implement in `packages/ce/api/src/app/ai-agents/`
   - Create Commons-specific UI components in `packages/ce/ui/ai-agents/`

3. **Knowledge Containers**:
   - Implement in `packages/ce/api/src/app/knowledge/`
   - Create supporting UI components in `packages/ce/ui/knowledge/`

## Testing Strategy

1. **Visual Regression Testing**:
   - Create tests to verify branding elements are correctly displayed
   - Compare screenshots between editions to validate differences

2. **Functional Testing**:
   - Test Commons-specific features
   - Verify core functionality works with Commons branding

3. **Compatibility Testing**:
   - Test update procedures from ActivePieces upstream
   - Verify that customizations don't break core functionality

## Deployment Considerations

1. **Build Pipeline**:
   - Configure build pipeline to produce Commons-branded builds
   - Create separate distribution packages if needed

2. **Environment Configuration**:
   - Document required environment variables for Commons edition
   - Provide migration scripts for existing ActivePieces installations

## Documentation Updates

1. **Installation and Setup Guides**:
   - Create Commons-specific installation instructions
   - Update configuration documentation

2. **Branding Guidelines**:
   - Document Commons branding elements and usage guidelines
   - Provide assets for Commons contributors and developers

## Timeline

| Week | Focus | Deliverables |
|------|-------|-------------|
| 1 | Core Branding Assets | Commons logo, favicon, CE structure setup, edition detection |
| 2 | UI Components | Commons UI components, text reference updates |
| 3 | Backend & Configuration | API routes, configuration system, build scripts |
| 4 | Testing & Documentation | Branding tests, compatibility tests, updated docs |

## Conclusion

This implementation plan provides a comprehensive strategy for rebranding ActivePieces to Commons while maintaining upstream compatibility. By following the CE Code Guide's naming conventions and creating a flexible architecture for edition-specific behavior, we can ensure a clean separation of concerns and support for future Commons-specific features.

The plan emphasizes visual consistency, code maintainability, and a smooth transition process for existing users. With proper testing and documentation, we can ensure that Commons provides a distinct brand identity while leveraging the solid foundation of ActivePieces.
