# Project Roles & Permissions Feature Implementation Plan

## Overview
This document outlines a plan to rebuild the Project Roles & Permissions feature from ActivePieces Enterprise Edition. This feature implements a role-based access control (RBAC) system that manages permissions for project members, which is critical for enterprise security and team collaboration.

## Feature Analysis

### Core Functionality
1. **Role Definition** - Predefined user roles with specific permission sets
2. **Permission Mapping** - Association between roles and permitted actions
3. **Authorization Middleware** - Request validation based on user roles
4. **Fine-grained Permission Checking** - Granular control over system operations

### Key Components

#### 1. Role and Permission Schema Definition
The core of the RBAC system is defined in `packages/ee/shared/src/lib/project-members/project-member.ts`. Key elements include:

- Project member entity structure
- Role enumeration (Owner, Admin, Editor, Viewer)
- Permission definitions for each role
- Role-to-permission mapping logic

#### 2. Database Entity
The project member relationships are stored in database tables with the following schema components:

- `project_member` table linking users to projects with associated roles
- Relations to both user and project entities
- Role column storing the assigned role enum value
- Timestamps for auditing member addition and updates

#### 3. RBAC Middleware
The authorization middleware in `packages/server/api/src/app/ee/authentication/project-role/rbac-middleware.ts` provides:

- Request interception for permission checking
- Role validation against required permissions
- Integration with the authentication system
- Support for role-based route protection

#### 4. API Endpoints
The project member controller provides endpoints for:

- Listing project members with their roles
- Adding new members with specific roles
- Updating existing member roles
- Removing members from projects

#### 5. System Integration
The RBAC system is integrated with the core application through:

- Request handlers that verify permissions before operations
- UI components that adapt based on user permissions
- API endpoints protected by role-based checks

## Implementation Strategy

### 1. Role and Permission Schema Definition

Implement the existing role schema definitions:

1. Reproduce the ProjectRoleName enum with existing roles:
   ```typescript
   enum ProjectRoleName {
     OWNER = 'OWNER',
     ADMIN = 'ADMIN',
     EDITOR = 'EDITOR',
     VIEWER = 'VIEWER'
   }
   ```

2. Define the permission matrix for each role:
   - OWNER: All permissions
   - ADMIN: Administration permissions excluding ownership transfers
   - EDITOR: Flow creation and editing permissions
   - VIEWER: Read-only permissions

3. Implement helper functions for permission checks:
   ```typescript
   function hasPermission(role: ProjectRoleName, permission: ProjectPermission): boolean
   ```

### 2. Database Layer

Rebuild the database entity structure:

1. Create the project_member entity:
   ```typescript
   @Entity()
   export class ProjectMemberEntity {
     @PrimaryGeneratedColumn('uuid')
     id: string;

     @Column()
     projectId: string;

     @Column()
     userId: string;

     @Column({ type: 'enum', enum: ProjectRoleName })
     role: ProjectRoleName;

     @CreateDateColumn()
     created: Date;

     @UpdateDateColumn()
     updated: Date;

     @ManyToOne(() => ProjectEntity, { onDelete: 'CASCADE' })
     @JoinColumn({ name: 'projectId' })
     project: ProjectEntity;

     @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
     @JoinColumn({ name: 'userId' })
     user: UserEntity;
   }
   ```

2. Set up appropriate indices for performance:
   - Combined index on projectId and userId for quick lookups
   - Index on role for filtering operations

3. Create migration scripts for the project_member table

### 3. RBAC Middleware

Rebuild the authorization middleware:

1. Implement the core RBAC middleware function:
   ```typescript
   export function rbacMiddleware(requiredPermissions: ProjectPermission[]) {
     return async (request, reply) => {
       const projectId = getProjectIdFromRequest(request);
       const userId = request.user.id;
       const userRole = await projectMemberService.getUserRoleInProject(userId, projectId);
       
       if (!hasRequiredPermissions(userRole, requiredPermissions)) {
         return reply.status(403).send({ message: 'Insufficient permissions' });
       }
     }
   }
   ```

2. Implement permission check functions:
   ```typescript
   function hasRequiredPermissions(role: ProjectRoleName, requiredPermissions: ProjectPermission[]): boolean {
     return requiredPermissions.every(permission => hasPermission(role, permission));
   }
   ```

3. Create helper functions for extracting project IDs from various request types

### 4. Project Member Service

Implement the project member service:

1. Create methods for managing project members:
   ```typescript
   class ProjectMemberService {
     async list(projectId: string): Promise<ProjectMember[]>;
     async add(projectId: string, userId: string, role: ProjectRoleName): Promise<ProjectMember>;
     async update(projectId: string, userId: string, role: ProjectRoleName): Promise<ProjectMember>;
     async remove(projectId: string, userId: string): Promise<void>;
     async getUserRoleInProject(userId: string, projectId: string): Promise<ProjectRoleName | null>;
     async isUserInProject(userId: string, projectId: string): Promise<boolean>;
   }
   ```

2. Implement role validation logic:
   - Prevent role escalation (users can't assign roles higher than their own)
   - Ensure projects always have at least one owner
   - Handle cascading permissions for nested resources

3. Implement caching for frequently accessed permission checks to improve performance

### 5. API Endpoints

Rebuild the project member controller:

1. Implement endpoints for member management:
   ```typescript
   @Controller('v1/projects/:projectId/members')
   export class ProjectMemberController {
     @Get()
     async list(@Param('projectId') projectId: string): Promise<ProjectMember[]>;
     
     @Post()
     async add(@Param('projectId') projectId: string, @Body() body: AddMemberRequest): Promise<ProjectMember>;
     
     @Patch(':userId')
     async update(@Param('projectId') projectId: string, @Param('userId') userId: string, @Body() body: UpdateMemberRequest): Promise<ProjectMember>;
     
     @Delete(':userId')
     async remove(@Param('projectId') projectId: string, @Param('userId') userId: string): Promise<void>;
   }
   ```

2. Apply RBAC middleware to protect these endpoints:
   ```typescript
   @Get()
   @UseMiddleware(rbacMiddleware([ProjectPermission.MEMBER_VIEW]))
   async list() { /*...*/ }
   
   @Post()
   @UseMiddleware(rbacMiddleware([ProjectPermission.MEMBER_ADD]))
   async add() { /*...*/ }
   ```

3. Implement input validation for all endpoints

### 6. System Integration

Integrate the RBAC system with the rest of the application:

1. Apply RBAC middleware to all protected routes in the application
2. Update project-related operations to check for appropriate permissions
3. Add permission checks in UI components to show/hide functionality based on user roles
4. Integrate with the audit logging system to track role changes

## Implementation Steps

### Phase 1: Core Schema and Database Setup

1. Define the ProjectRoleName enum and permission constants
2. Create the permission mapping functions
3. Implement the project_member database entity
4. Create database migrations for the project_member table

### Phase 2: Service Implementation

1. Build the ProjectMemberService with core CRUD operations
2. Implement the role validation logic
3. Create helper functions for permission checks
4. Implement caching for frequent permission lookups

### Phase 3: RBAC Middleware

1. Build the core RBAC middleware function
2. Implement helper functions for extracting project IDs from requests
3. Create utility functions for permission validation
4. Write tests for the middleware functionality

### Phase 4: API Endpoints and Integration

1. Implement the ProjectMemberController
2. Apply RBAC middleware to all protected routes
3. Implement input validation for requests
4. Update UI components to respect permissions
5. Integrate with audit logging

### Phase 5: Testing and Validation

1. Write unit tests for all components
2. Implement integration tests for the RBAC system
3. Perform security testing to ensure proper access control
4. Test edge cases (e.g., last owner removal prevention)

## Existing Database Schema

The project roles feature utilizes the following database structure:

```sql
CREATE TABLE "project_member" (
    "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    "created" TIMESTAMP NOT NULL DEFAULT now(),
    "updated" TIMESTAMP NOT NULL DEFAULT now(),
    "projectId" uuid NOT NULL,
    "userId" uuid NOT NULL,
    "role" character varying NOT NULL,
    CONSTRAINT "FK_project_member_project" FOREIGN KEY ("projectId") 
    REFERENCES "project"("id") ON DELETE CASCADE,
    CONSTRAINT "FK_project_member_user" FOREIGN KEY ("userId") 
    REFERENCES "user"("id") ON DELETE CASCADE,
    CONSTRAINT "UQ_project_member_project_user" UNIQUE ("projectId", "userId")
);

CREATE INDEX "idx_project_member_project_id" ON "project_member" ("projectId");
CREATE INDEX "idx_project_member_user_id" ON "project_member" ("userId");
CREATE INDEX "idx_project_member_role" ON "project_member" ("role");
```

## Existing API Endpoint Specifications

The implementation will match these existing API endpoints:

### List Project Members

**Endpoint:** `GET /v1/projects/:projectId/members`

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "projectId": "uuid",
      "userId": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "OWNER|ADMIN|EDITOR|VIEWER",
      "created": "ISO string date",
      "updated": "ISO string date"
    }
  ]
}
```

### Add Project Member

**Endpoint:** `POST /v1/projects/:projectId/members`

**Request body:**
```json
{
  "email": "user@example.com",
  "role": "ADMIN|EDITOR|VIEWER"
}
```

**Response:**
```json
{
  "id": "uuid",
  "projectId": "uuid",
  "userId": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "ADMIN|EDITOR|VIEWER",
  "created": "ISO string date",
  "updated": "ISO string date"
}
```

### Update Project Member Role

**Endpoint:** `PATCH /v1/projects/:projectId/members/:userId`

**Request body:**
```json
{
  "role": "ADMIN|EDITOR|VIEWER"
}
```

**Response:**
```json
{
  "id": "uuid",
  "projectId": "uuid",
  "userId": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "ADMIN|EDITOR|VIEWER",
  "created": "ISO string date",
  "updated": "ISO string date"
}
```

### Remove Project Member

**Endpoint:** `DELETE /v1/projects/:projectId/members/:userId`

**Response:** `204 No Content`

## Permission Matrix

The implementation will include a comprehensive permission matrix mapping roles to specific actions:

| Permission | OWNER | ADMIN | EDITOR | VIEWER |
|------------|-------|-------|--------|--------|
| VIEW_PROJECT | ✓ | ✓ | ✓ | ✓ |
| EDIT_PROJECT_SETTINGS | ✓ | ✓ | - | - |
| DELETE_PROJECT | ✓ | - | - | - |
| CREATE_FLOWS | ✓ | ✓ | ✓ | - |
| EDIT_FLOWS | ✓ | ✓ | ✓ | - |
| DELETE_FLOWS | ✓ | ✓ | ✓ | - |
| RUN_FLOWS | ✓ | ✓ | ✓ | - |
| VIEW_FLOWS | ✓ | ✓ | ✓ | ✓ |
| MANAGE_API_KEYS | ✓ | ✓ | - | - |
| MANAGE_CONNECTIONS | ✓ | ✓ | ✓ | - |
| VIEW_CONNECTIONS | ✓ | ✓ | ✓ | ✓ |
| MANAGE_MEMBERS | ✓ | ✓ | - | - |
| VIEW_MEMBERS | ✓ | ✓ | ✓ | ✓ |
| MANAGE_WEBHOOKS | ✓ | ✓ | ✓ | - |
| VIEW_WEBHOOKS | ✓ | ✓ | ✓ | ✓ |
| MANAGE_TEMPLATES | ✓ | ✓ | - | - |
| USE_TEMPLATES | ✓ | ✓ | ✓ | - |
| VIEW_TEMPLATES | ✓ | ✓ | ✓ | ✓ |

## Performance Considerations

The current implementation includes several performance optimizations:

1. **Indexing Strategy**
   - Indices on projectId, userId, and role columns
   - Unique constraint on projectId and userId combination

2. **Caching**
   - Caching frequently accessed permission checks
   - In-memory caching for active user sessions

3. **Query Optimization**
   - Efficient JOIN operations for member listing
   - Selective column fetching for permission checks

4. **Middleware Efficiency**
   - Early termination for unauthorized requests
   - Optimized permission checking logic

## Security Considerations

The RBAC implementation must account for these security aspects:

1. **Privilege Escalation Prevention**
   - Users cannot assign roles higher than their own
   - Role changes require appropriate permissions

2. **Project Ownership Protection**
   - Prevent removal of the last owner
   - Special handling for ownership transfers

3. **Authorization Bypass Prevention**
   - Consistent authorization checks across all endpoints
   - No client-side only permission enforcement

4. **Access Control Audit**
   - Logging of all permission changes
   - Tracking of access control failures

## Implementation Timeline

According to the enterprise features analysis, rebuilding the Project Roles & Permissions feature is estimated to take **3-5 weeks** for a developer familiar with the ActivePieces codebase. Here's a more detailed breakdown:

### Week 1 (Days 1-5)
- **Days 1-2**: Implement role and permission schema definitions
  - Define ProjectRoleName enum and permission constants
  - Create permission mapping functions
  - Build utility functions for permission checks
- **Days 3-5**: Implement database entities and migrations
  - Create the project_member entity
  - Build database migrations
  - Set up indices for optimization

### Week 2 (Days 6-10)
- **Days 6-8**: Implement core service layer
  - Build ProjectMemberService with CRUD operations
  - Implement role validation logic
  - Create caching for frequently used permissions
- **Days 9-10**: Begin RBAC middleware implementation
  - Create the core middleware function
  - Implement helper functions for request parsing
  - Start building permission verification logic

### Week 3 (Days 11-15)
- **Days 11-12**: Complete RBAC middleware
  - Finish permission verification logic
  - Implement edge case handling
  - Create tests for middleware functionality
- **Days 13-15**: Implement API endpoints
  - Build ProjectMemberController with all endpoints
  - Apply RBAC middleware to routes
  - Implement input validation

### Week 4 (Days 16-20)
- **Days 16-18**: System integration
  - Apply RBAC checks to all protected routes
  - Update relevant UI components
  - Integrate with audit logging
- **Days 19-20**: Begin testing and validation
  - Write unit tests for all components
  - Start integration testing

### Week 5 (Days 21-25) (if needed)
- **Days 21-23**: Complete testing and validation
  - Finish integration testing
  - Perform security testing
  - Test edge cases thoroughly
- **Days 24-25**: Refinement and documentation
  - Address any issues found during testing
  - Complete documentation
  - Final review of implementation

This timeline assumes:
- One developer working full-time on the feature
- Familiarity with TypeORM, Fastify, and the ActivePieces codebase structure
- No major architectural changes or dependencies on other features being rebuilt simultaneously

## Conclusion

This implementation plan outlines how to rebuild the Project Roles & Permissions feature to match the existing functionality exactly. The approach focuses on recreating the current RBAC system without introducing any extensions or changes to the permission model or API endpoints.

By following this plan over the estimated 3-5 week timeline, we will recreate a robust role-based access control system that provides fine-grained permissions management for projects, matching the original implementation in functionality and security.
