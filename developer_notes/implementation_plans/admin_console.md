# Admin Console Implementation Plan

## Overview and Clarification

This document outlines a plan for implementing the Admin Console feature for the Commons Edition. The goal is not to extend existing functionality but to provide Commons Edition implementations of the administrative capabilities that are currently only available in the Enterprise Edition.

IMPORTANT: This plan DOES NOT involve rebuilding the admin console UI from scratch. The core platform already includes the admin interface skeleton and components in `packages/react-ui/src/app/components/platform-admin-container.tsx` and other files. This implementation will focus on developing the necessary backend controllers and services with proper CE prefixes to work with the existing UI components.

## Existing Architecture Analysis

After examining the codebase, we found that:

1. **Frontend Admin UI Structure Already Exists in Core**
   - `platform-admin-container.tsx` provides the layout and navigation for admin features
   - Admin UI components and routes are available in the core React UI

2. **Backend Admin Services Are Enterprise-Only**
   - `admin-platform.controller.ts` in EE provides endpoints for super users to manage platforms
   - `platform-project-controller.ts` and other controllers in EE implement the actual functionality

3. **Enterprise Edition Backend Components**
   - Located in `packages/server/api/src/app/ee/` directory
   - Include controllers and services for platform management

The Admin Console leverages existing database schemas and entities without requiring additional tables. It primarily integrates with:

- `Platform` entity
- `Project` entity
- `ProjectPlan` entity
- `ProjectMember` entity
- `ProjectRole` entity

## Implementation Strategy

Our approach is to create Commons Edition implementations of the backend services needed to support the existing admin UI components. We'll follow these key principles:

1. **Leverage Existing UI Components**
   - Use the existing admin interface structure in the React UI
   - Add CE-specific routes to the existing platform admin navigation
   - Follow CE naming conventions for new components only

2. **Implement CE Backend Services**
   - Create CE-prefixed controllers and services for admin functionality
   - Follow the patterns in the CE Code Guide for naming and organization
   - Connect to existing database entities where appropriate

### Backend Implementation

1. **Admin Platform Module**

```typescript
// cm_admin-platform.module.ts
import { FastifyPluginAsync } from 'fastify'

export const cmAdminPlatformModule: FastifyPluginAsync = async (app) => {
  await app.register(cmPlatformController, { prefix: '/v1/ce/platforms' })
  await app.register(cmAdminProjectController, { prefix: '/v1/ce/admin/projects' })
  await app.register(cmAdminUserController, { prefix: '/v1/ce/admin/users' })
  await app.register(cmAdminPieceController, { prefix: '/v1/ce/admin/pieces' })
  await app.register(cmAdminTemplateController, { prefix: '/v1/ce/admin/templates' })
  await app.register(cmAdminSettingsController, { prefix: '/v1/ce/admin/settings' })
}
```

2. **Admin Platform Controller**

```typescript
// cm_platform.controller.ts
export const cmPlatformController: FastifyPluginAsyncTypebox = async (app) => {
  // Create Platform
  app.post('/', CmAddPlatformRequest, async (req, res) => {
    const newPlatform = await cmPlatformService(req.log).add(req.body)
    return res.status(StatusCodes.CREATED).send(newPlatform)
  })

  // Get All Platforms
  app.get('/', CmGetAllPlatformsRequest, async (req, res) => {
    const platforms = await cmPlatformService(req.log).getAll({
      limit: req.query.limit,
      cursor: req.query.cursor,
    })
    return res.status(StatusCodes.OK).send(platforms)
  })

  // Get Platform by ID
  app.get('/:id', CmGetPlatformRequest, async (req, res) => {
    const platform = await cmPlatformService(req.log).getById(req.params.id)
    return res.status(StatusCodes.OK).send(platform)
  })

  // Update Platform
  app.patch('/:id', CmUpdatePlatformRequest, async (req, res) => {
    const updatedPlatform = await cmPlatformService(req.log).update({
      id: req.params.id,
      ...req.body,
    })
    return res.status(StatusCodes.OK).send(updatedPlatform)
  })

  // Delete Platform
  app.delete('/:id', CmDeletePlatformRequest, async (req, res) => {
    await cmPlatformService(req.log).delete(req.params.id)
    return res.status(StatusCodes.NO_CONTENT).send()
  })
}
```

3. **Admin Platform Service**

```typescript
// cm_platform.service.ts
// Note: This service reuses the core platformService where appropriate
export const cmPlatformService = (log: FastifyBaseLogger) => ({
  async add(params: CmAddPlatformParams): Promise<Platform> {
    // Implementation using existing core platform service
    const platform = await platformService.create({
      ownerId: params.userId,
      name: params.name,
    })

    if (params.projectId) {
      // Use existing project service from core
      await projectService.addProjectToPlatform({
        projectId: params.projectId,
        platformId: platform.id,
      })
    }

    if (params.domain) {
      await cmCustomDomainService.setup(platform.id, params.domain)
    }

    return platform
  },

  async getAll(params: CmGetAllParams): Promise<SeekPage<PlatformWithStats>> {
    // Implementation for fetching platforms with pagination, using core repositories
    const platformsPage = await platformRepository().findWithPagination({
      limit: params.limit,
      cursor: params.cursor,
    });
    
    // Add stats for each platform using core services
    const platformsWithStats = await Promise.all(
      platformsPage.data.map(async (platform) => {
        const stats = await cmPlatformStatsService.getStatsForPlatform(platform.id);
        return { ...platform, stats };
      })
    );

    return {
      data: platformsWithStats,
      cursor: platformsPage.cursor,
    };
  },

  async getById(id: string): Promise<PlatformWithStats> {
    // Get platform by ID with stats
    const platform = await platformRepository().findOneOrFail({ id });
    const stats = await cmPlatformStatsService.getStatsForPlatform(id);
    
    return { ...platform, stats };
  },

  async update(params: CmUpdatePlatformParams): Promise<Platform> {
    // Update platform settings using core repository
    return platformRepository().update(params.id, {
      name: params.name,
      displayName: params.displayName,
      // Other fields
    });
  },

  async delete(id: string): Promise<void> {
    // Soft delete platform using core repository
    await platformRepository().update(id, { deleted: true });
  },
})
```

### Leveraging Existing Database Entities

The Commons Edition implementation will use the same database entities that are also used in the Enterprise Edition, avoiding any duplication:

1. **Platform Entity**
   - Already exists in the core codebase
   - Contains platform-wide settings and ownership information
   - CE implementation will use the existing entity without modifications

2. **Project Entity**
   - Core entity used across all editions
   - Already has fields like externalId, platformId, and displayName
   - CE services will access this through standard repositories

3. **Project Plan Entity**
   - Stores limits for tasks, pieces, etc.
   - CE implementation will use the existing entity structure

4. **User Entity**
   - Already contains platformRole for authorization
   - CE implementation will use standard repositories to access user data

### Authorization Implementation

The authorization system will follow CE naming conventions while using the same patterns as the existing codebase:

```typescript
// cm_admin-authorization.ts
export const cmAdminAuthorizationMiddleware = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  // Check if user is SUPER_USER or has ADMIN platform role
  if (request.principal.type !== PrincipalType.SUPER_USER) {
    // Use existing core user service
    const user = await userService.getOneOrFail({
      id: request.principal.id,
    })

    if (user.platformRole !== PlatformRole.ADMIN) {
      throw new ActivepiecesError({
        code: ErrorCode.AUTHORIZATION,
        params: {},
      })
    }
  }
}
```

This middleware will be applied to all admin routes to ensure only authorized users can access them.

### Frontend Integration

Instead of rebuilding the admin UI, we'll leverage the existing `platform-admin-container.tsx` component and add CE-prefixed components that connect to our CE backend services:

```typescript
// Add CE components to existing platform admin routes
// This would be added to the appropriate router file
export const CmAdminRoutes = [
  {
    path: '/platform/ce-projects',
    element: (
      <PlatformAdminContainer>
        <CmProjectsManagement />
      </PlatformAdminContainer>
    ),
  },
  {
    path: '/platform/ce-users',
    element: (
      <PlatformAdminContainer>
        <CmUsersManagement />
      </PlatformAdminContainer>
    ),
  },
  // Other routes
];

// Example CE component that integrates with the existing admin UI
export const CmProjectsManagement: React.FC = () => {
  const [projects, setProjects] = useState([]);
  
  useEffect(() => {
    // Use CE-specific API client
    cmAdminProjectsApi.list().then(response => {
      setProjects(response.data);
    });
  }, []);
  
  return (
    <div className="cm-container">
      <h1>{t('Projects')}</h1>
      <CmProjectTable projects={projects} />
      {/* Other content */}
    </div>
  );
};
```

## Feature Components to Reimplement

### 1. Platform Management

Functions to reimplement:
- Create and configure platforms
- Assign projects to platforms
- Platform-level settings and appearance
- Platform analytics and dashboard

### 2. Project Management

Based on the enterprise `platform-project-service.ts` and `platform-project-controller.ts`:

- List projects with limits and usage analytics
- Create projects with initial plan limits
- Update project settings and limits
- Soft delete projects (ensuring all flows are disabled first)

### 3. User Management

- Cross-platform user management
- User role assignment within platforms
- User activity monitoring

### 4. Pieces Management

- Piece visibility controls
- Private piece creation
- Piece usage analytics

### 5. Templates Management

- Template creation and management
- Template categorization
- Template access controls

### 6. Settings Management

- Platform-wide settings configuration
- Appearance customization
- Security settings
- Email configuration

## Audit Logging

For comprehensive tracking of administrative actions, we'll implement a CE audit logging system that follows the CE Code Guide:

```typescript
// cm_admin-audit.service.ts
export const cmAdminAuditService = (log: FastifyBaseLogger) => ({
  async logAction(params: CmLogActionParams): Promise<void> {
    // Log to database using existing core repositories
    await auditLogRepository().save({
      action: params.action,
      adminId: params.adminId,
      targetEntity: params.targetEntity,
      changes: params.changes,
      timestamp: new Date(),
      type: CmAuditLogType.ADMIN_ACTION,
    });
    
    // Also log to server logs for debugging
    log.info({
      action: params.action,
      adminId: params.adminId,
      targetEntity: params.targetEntity,
      timestamp: new Date(),
    })
  }
})
```

## Implementation Phases

### Phase 1: Core Admin Infrastructure (1 week)
- Set up admin module structure with authorization middleware
- Implement admin platform controller and service
- Create basic admin layout and routes in frontend

### Phase 2: Platform Management (1 week)
- Implement platform CRUD operations
- Develop platform dashboard with analytics
- Create platform settings management

### Phase 3: Project and User Management (1-2 weeks)
- Implement admin project controller and service
- Develop project plan management
- Create user management across platforms

### Phase 4: Pieces and Templates Management (1 week)
- Implement piece visibility and filtering
- Develop private pieces creation
- Create template management system

### Phase 5: Settings and Analytics (1 week)
- Implement global settings management
- Create appearance customization 
- Develop email settings configuration

### Phase 6: Testing and Refinement (1 week)
- Comprehensive testing of all admin features
- Performance optimization
- Security review
- Documentation

## Technical Considerations

### Authentication & Authorization
- Leverage existing authorization framework with CE-specific middleware
- Ensure only authorized users can access admin features
- Follow CE naming conventions for security-related components

### Security
- Input validation for all admin endpoints
- Protection against common web vulnerabilities
- Comprehensive audit logging with CE prefixes

### Performance
- Efficient loading of platform-wide data
- Pagination for all resource listings
- Optimized queries for cross-project operations

## Conclusion

This implementation plan focuses on creating Commons Edition implementations of the admin functionality that exists in the Enterprise Edition of Activepieces. The key insight is that we don't need to rebuild the entire admin console UI from scratch, as the core frontend structure already exists.

By leveraging the existing UI components and implementing CE-prefixed backend controllers and services, we can provide similar administrative capabilities while following the CE Code Guide's naming conventions and separation requirements. This approach ensures compatibility with the existing system while avoiding unnecessary duplication of functionality.

By following this phased approach, we can create a powerful and secure Admin Console for the Commons Edition that integrates well with the existing platform while maintaining clean separation from Enterprise Edition code.
