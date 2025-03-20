# Commons Edition (CE) Code Guide

This document establishes the code styleguide and development practices for the Commons Edition (CE) of our codebase. The primary goals are to maintain clear separation from Enterprise Edition (EE) code, prevent copyright infringement, and ensure maintainable code organization.

## Table of Contents

1. [Core Implementation Principles](#core-implementation-principles)
2. [Code Organization](#code-organization)
3. [Naming Conventions](#naming-conventions)
4. [Code Separation Principles](#code-separation-principles)
5. [Module and API Structure](#module-and-api-structure)
6. [Database Design](#database-design)
7. [UI Components](#ui-components)
8. [Testing Strategy](#testing-strategy)
9. [Documentation Standards](#documentation-standards)
10. [Implementation Approaches](#implementation-approaches)

## Core Implementation Principles

### Reusing Core Components

**CRITICAL**: Before implementing any CE feature that replaces EE functionality, analyze the codebase to identify which components can be reused from core:

1. **Analyze Existing Code**:
   - Study both EE code and relevant core code before implementation
   - Identify which components are EE-specific vs. reusable core components
   - Document dependencies and integration points

2. **Minimize Reimplementation**:
   - Only replace the EE-specific parts of features while keeping core components intact
   - Create adapters or wrappers around core functionality rather than duplicating it
   - Leverage existing data models from the core when they already exist

3. **Integrate with Existing UI**:
   - Add CE features into existing UI structures (like the platform admin console)
   - Add new navigation items to existing menus rather than creating parallel navigation
   - Follow existing UI patterns for consistency

4. **Efficiency First**:
   - Avoid rebuilding core components that are already available
   - Maintain clean architecture without unnecessary duplication
   - Organize CE components to plug into the existing application structure

### Feature Implementation Process

For each EE feature being reimplemented in CE:

1. **Planning Phase**:
   - Map dependencies between the EE feature and the core codebase
   - Identify which models, services, and repositories can be reused
   - Document which parts need CE-specific reimplementation

2. **Review Phase**:
   - Validate implementation plans to ensure minimal duplication
   - Confirm proper reuse of core components
   - Verify compliance with CE naming conventions

## Code Organization

### Directory Structure

All Commons Edition code must be organized under the `/ce/` directory ("Commons Edition") to maintain clear separation from Enterprise Edition code:

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

### Feature Organization

- Each feature should have its own directory with consistent structure:
  - `models/` - Data models and interfaces
  - `services/` - Business logic
  - `controllers/` - API endpoints
  - `utils/` - Helper functions
  - `constants.ts` - Feature-specific constants

## Naming Conventions

To clearly distinguish our codebase from Enterprise Edition and avoid copyright infringement, use these naming conventions:

### Prefixes and Suffixes

- **File names**: Use `cm_` prefix for Commons Edition modules
  - Example: `cm_project.service.ts` instead of `project.service.ts`

- **Class names**: Use `Cm` prefix for classes
  - Example: `CmProjectService` instead of `ProjectService` or `PlatformProjectService`

- **Interface names**: Use `Cm` prefix and `Interface` suffix
  - Example: `CmProjectInterface` instead of `ProjectInterface`

- **Type names**: Use `Cm` prefix and `Type` suffix
  - Example: `CmProjectType` instead of `ProjectType`

- **Enum names**: Use `Cm` prefix and `Enum` suffix
  - Example: `CmProjectStatusEnum` instead of `ProjectStatusEnum`

### Database Entities

- **Entity classes**: Use `Cm` prefix and `Entity` suffix
  - Example: `CmProjectEntity` instead of `ProjectEntity`

- **Table names**: Use `cm_` prefix in database tables
  - Example: `cm_project` instead of `project`

- **Column names**: Use standard snake_case without special prefixes
  - Example: `created_at`, `user_id`

### Constants and Environment Variables

- **Constants**: Use `CM_` prefix for constants
  - Example: `CM_DEFAULT_LIMIT` instead of `DEFAULT_LIMIT`

- **Environment variables**: Use `CM_` prefix for environment variables
  - Example: `CM_API_URL` instead of `AP_API_URL`

### API Routes

- **API endpoints**: Use `/ce/` prefix in API routes
  - Example: `/v1/ce/projects` instead of `/v1/projects`
  - Example: `/v1/ce/flows` instead of `/v1/flows`

## Code Separation Principles

### Module Isolation

1. **No direct imports from EE code**:
   - Never import from directories or files in the EE codebase
   - Create equivalent functionality in the CE codebase with different naming

2. **Feature hooks pattern**:
   - Define hook interfaces in shared code
   - Implement feature-specific hooks in CE code
   - Register hooks at application startup

   Example:
   ```typescript
   // In shared code
   export interface CmProjectHooks {
     beforeCreate: (project: CmProjectInterface) => Promise<CmProjectInterface>;
     afterDelete: (projectId: string) => Promise<void>;
   }

   // In CE implementation
   export const cmProjectHooks: CmProjectHooks = {
     beforeCreate: async (project) => {
       // Implementation
       return project;
     },
     afterDelete: async (projectId) => {
       // Implementation
     }
   };
   ```

3. **Configuration system**:
   - Create a separate configuration system for CE
   - Use `CmSystemProp` for CE-specific properties

   ```typescript
   export enum CmSystemProp {
     CM_DATABASE_URL = 'CM_DATABASE_URL',
     CM_JWT_SECRET = 'CM_JWT_SECRET',
     // more properties
   }
   ```

4. **Edition-aware code loading**:
   ```typescript
   export enum CmEdition {
     COMMUNITY = 'COMMUNITY',
     // Other editions if needed
   }

   // Conditionally load modules based on edition
   const edition = process.env.CM_EDITION || CmEdition.COMMUNITY;
   
   switch (edition) {
     case CmEdition.COMMUNITY:
       await app.register(cmCoreModule);
       break;
     // Other cases if needed
   }
   ```

### Dependencies and External Libraries

1. **Favor system libraries over EE-dependent ones**
2. **Use widely available open-source alternatives**
3. **Document all external dependencies**

### Core Model Integration

1. **When to Use Core Models**:
   - When the data structure already exists in the core (non-EE) codebase
   - When the entity is foundational to the application and shared across editions

2. **How to Use Core Models**:
   - Import directly from core code paths (not EE paths)
   - Create CE-specific services that use core repositories

3. **When to Create CE-specific Models**:
   - When the model doesn't exist in core
   - When you need to extend a core model with CE-specific fields
   - When the existing model is exclusively in EE code

4. **Core Integration Example**:
   ```typescript
   // ce/platform-project.service.ts
   import { projectRepo } from '../../project/project-service';
   
   export const cmPlatformProjectService = {
     async list(params) {
       // Use existing project repository but with platform admin context
       return projectRepo().find({...});
     }
   };
   ```

## Module and API Structure

### Controllers

Define controllers with clear separation:

```typescript
// cm_project.controller.ts
import { FastifyInstance } from 'fastify';
import { CmProjectService } from './cm_project.service';

export const cmProjectController = async (app: FastifyInstance) => {
  app.register(async (router) => {
    router.get('/', listCmProjects);
    router.post('/', createCmProject);
    router.get('/:id', getCmProject);
    // Other routes
  }, { prefix: '/v1/ce/projects' });
};

const listCmProjects = async (request, reply) => {
  const projects = await CmProjectService.list();
  return { data: projects };
};

// Other handler methods
```

### Services

Implement business logic in separate service files:

```typescript
// cm_project.service.ts
import { CmProjectEntity } from './cm_project.entity';
import { CmProjectRepository } from './cm_project.repository';

export class CmProjectService {
  static async list() {
    return CmProjectRepository.find();
  }

  static async create(projectData: Partial<CmProjectEntity>) {
    // Implementation
  }

  // Other methods
}
```

## Database Design

### Entity Definition

Create entities with distinct naming:

```typescript
// cm_project.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'cm_project' })
export class CmProjectEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;

  // Other columns
}
```

### Migrations

Name migrations distinctly:

```typescript
// CmCreateProjectTables1234567890123.ts
import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CmCreateProjectTables1234567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'cm_project',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          // Other columns
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('cm_project');
  }
}
```

## UI Components

### Component Naming

For UI components, use consistent prefixes:

```typescript
// In Angular/React components
export class CmProjectListComponent {
  // Component implementation
}

// In template files
<cm-project-list [projects]="projects"></cm-project-list>
```

### CSS/SCSS Classes

Use prefixes for CSS classes:

```scss
.cm-container {
  display: flex;
  flex-direction: column;
}

.cm-button {
  background-color: #3f51b5;
  color: white;
}
```

### Component Organization

```
ui/
├── ce/
│   ├── components/
│   │   ├── cm-project/
│   │   │   ├── cm-project-list.component.ts
│   │   │   ├── cm-project-list.component.html
│   │   │   └── cm-project-list.component.scss
│   ├── services/
│   │   ├── cm-project.service.ts
│   ├── models/
│   │   ├── cm-project.model.ts
```

### hclltd,2
Documentation Standards
   * 
   * @param name - The name of the project
   * @param description - Optional project description
   * @returns The created project object
   */
  static async createCmProject(name: string, description?: string): Promise<CmProjectEntity> {
    // Implementation
  }
  ```

### Module Documentation

Each module should include a README.md file explaining:
- Purpose of the module
- Key components
- Usage examples
- Dependencies

## Implementation Approaches

### Role-Based Access Control (RBAC)

For implementing RBAC, create a distinctly different approach:

```typescript
// cm_permission.ts
export enum CmPermission {
  CM_VIEW_PROJECT = 'CM_VIEW_PROJECT',
  CM_EDIT_PROJECT = 'CM_EDIT_PROJECT',
  // Other permissions
}

// cm_role.ts
export enum CmRoleType {
  CM_OWNER = 'CM_OWNER',
  CM_EDITOR = 'CM_EDITOR',
  CM_VIEWER = 'CM_VIEWER',
}

// cm_rbac.service.ts
export class CmRbacService {
  static hasPermission(role: CmRoleType, permission: CmPermission): boolean {
    // Implementation with different logic from EE
  }
}
```

### Audit Logging

For audit logging, implement a different data approach:

```typescript
// cm_audit_events.ts
export enum CmAuditEventType {
  CM_USER_LOGIN = 'CM_USER_LOGIN',
  CM_PROJECT_CREATED = 'CM_PROJECT_CREATED',
  // Other event types
}

// cm_audit_service.ts
export class CmAuditService {
  static async logEvent(eventType: CmAuditEventType, details: any): Promise<void> {
    // Implementation with different approach from EE
  }
}
```

### Iterative Development

When implementing features, follow an iterative development approach:

1. **Small Incremental Changes**:
   - Build and test features in small, discrete chunks
   - Implement one component or functionality at a time
   - Test each component thoroughly before moving to the next

2. **Progressive Implementation Example**:
   For admin project features:
   - First: Implement basic page structure and navigation
   - Test: Verify the page loads and navigation works
   - Next: Add the projects table component
   - Test: Verify data loading and display
   - Next: Implement action buttons (create, edit, delete)
   - Test: Verify each button functions correctly
   - Finally: Add advanced features (filtering, sorting, etc.)

3. **Benefits of Iterative Development**:
   - Early detection of issues
   - Easier debugging (smaller changes to analyze)
   - Clear progression path for complex features
   - Better quality through focused testing
   - More maintainable code through incremental validation

4. **Testing Checkpoints**:
   - After UI components are added or modified
   - After API integrations are implemented
   - After state management changes
   - After implementing form validation
   - After adding user interactions

5. **Documentation During Iteration**:
   - Update documentation with each iteration
   - Document testing results and observations
   - Note edge cases discovered during incremental testing

## Conclusion

Following this code guide will ensure the Commons Edition (CE) code remains clearly separated from Enterprise Edition (EE) code, minimizing copyright infringement, and avoiding naming conflicts. By using common naming approaches and deliberately implementing CE-specific functionality, the work will be maintainable and beneficial. The organizational strategies and development approaches outlined here will help to create a clean, seamless codebase that can easily be updated from the upstream repo.
