# Project Management Implementation Plan

## Executive Summary

The Project Management feature enables administrators to create and manage multi-tenant projects with isolated resources, user assignment, and resource tracking. This implementation plan correctly leverages the existing core `Project` model while providing a Commons Edition (CE) implementation of administrative features previously only available in Enterprise Edition (EE).

## Feature Analysis

### Core Functionality
1. **Multi-Project Support** - Creation and management of separate projects within a platform
2. **User Assignment** - Adding and managing users within specific projects with roles
3. **Resource Allocation** - Setting and enforcing limits on resources per project
4. **Usage Tracking** - Monitoring resource usage across projects
5. **Project Isolation** - Ensuring proper data segregation between projects

### Key Components

#### 1. Project Entity Schema
The project management system is built around the existing core project entity structure:

- Project metadata (name, description, created date)
- Project plan details and limits
- Usage statistics and tracking
- Members and roles associations

#### 2. Project Management Services
The project management feature includes these key services:

- Project CRUD operations
- Project member management
- Resource allocation and limits enforcement
- Usage statistics collection

#### 3. Multi-tenant Architecture
A critical aspect of the project management system is its multi-tenant design:

- Clear separation between platform-level and project-level operations
- Proper data isolation between projects
- Cross-cutting concerns like authorization and resource enforcement

#### 4. Authorization Framework
Project-level permissions and role-based access control:

- Project roles with different permission levels
- Fine-grained access control for project resources
- Permission checks at API and service levels

## Implementation Strategy

### Key Implementation Principles

1. **Utilize Existing Project Structure**
   - Leverage the existing core `Project` model in `packages/shared/src/lib/project/project.ts`
   - No need to create duplicate project models
   - Access existing project repositories and services where possible

2. **Admin Management Module Under Existing Platform**
   - Implement admin functionality under the existing `/platform/` console
   - DO NOT create a separate admin console
   - Follow CE Code Guide naming conventions for new components/services only

3. **Integration with Platform Admin**
   - Add a new navigation item in the existing Platform Admin console
   - Implement CE-prefixed components for project management views
   - Connect to existing project data model

4. **Project Administration Focus**
   - Focus on platform admin capabilities to manage projects
   - Allow project creation, updating, member management, and limits configuration
   - Similar functionality to EE but implemented with CE licensing compliance

## Implementation Phases

### Phase 1: Backend Foundation (2 days)

Backend architecture implementation focused on core services and controllers:

1. **Backend Controllers**
   - Create `cmPlatformProjectController.ts` under CE namespace
   - Use REST endpoints with `/v1/ce/platform/projects` prefix
   - Implement proper security checks for platform admin access

2. **Service Layer**
   - Create `cmPlatformProjectService.ts` to handle admin operations
   - Utilize existing core project repositories
   - Add CE-compliant audit logging

   ```typescript
   // ce/platform-project.service.ts
   import { projectRepo } from '../../project/project-service';
   
   export const cmPlatformProjectService = {
     async list(params) {
       // Use existing project repository but with platform admin context
       return projectRepo().find({...});
     },
     
     async create(data) {
       // Create projects using core repositories
       return projectRepo().save({...});
     },
     
     // Other methods
   };
   ```

3. **Permission Framework**
   - Create `CmPlatformPermission` enum with project management permissions
   - Implement middleware for permission checks

4. **API Integration**
   - Create CE services and API endpoints, but connect to existing core repositories
   - Implement controllers for platform admin operations

   ```typescript
   // ce/platform-project.controller.ts
   export const cmPlatformProjectController = async (app) => {
     app.register(async (router) => {
       router.get('/', listProjects);
       router.post('/', createProject);
       // Other routes
     }, { prefix: '/v1/ce/platform/projects' });
   };
   ```

### Phase 2: UI Integration with Platform Admin (2 days)

1. **Platform Admin Integration**
   - Add project management routes to existing Platform Admin console:
   ```typescript
   // In platform/routes.tsx or equivalent
   {
     path: '/platform/ce-projects',
     element: (
       <PlatformAdminContainer>
         <CmPlatformProjectList />
       </PlatformAdminContainer>
     )
   }
   ```

2. **Navigation Integration**
   - Add a navigation item in the Platform Admin sidebar:
   ```typescript
   // In platform admin navigation
   {
     type: 'link',
     to: '/platform/ce-projects',
     label: t('Projects'),
     icon: UsersIcon,
     isSubItem: false,
   }
   ```

3. **Component Module Structure**
   - Create CE components that integrate with Platform Admin UI
   - Set up routing with platform admin integration
   - Implement authentication guards for admin access

### Phase 3: Platform Project Management UI (2.5 days)

#### Task 1: Project List View (1 day)

**Location**: Platform Admin (`/platform/ce-projects` route)

1. **Project List Component**
   - Create `CmPlatformProjectList.tsx` integrated with Platform Admin
   - Use existing UI components with CE-compliant class names
   - Connect to CE project endpoints

2. **Project Table Component**
   - Create `CmPlatformProjectTable.tsx` for data display
   - Add sorting, filtering, and pagination
   - Include action buttons with proper permission checks

3. **Project Creation Modal**
   - Create `CmPlatformProjectCreateModal.tsx`
   - Form should include name, description, and resource limits
   - Connect to CE project creation endpoint

#### Task 2: Project Detail View (1 day)

**Location**: Platform Admin (`/platform/ce-projects/:id` route)

1. **Project Detail Container**
   - Create `CmPlatformProjectDetail.tsx`
   - Implement tabs for different sections
   - Add action buttons for editing, deletion, etc.

2. **Details Tab**
   - Create `CmPlatformProjectDetailsTab.tsx`
   - Show project metadata and configuration
   - Provide edit capability for fields

3. **Usage Tab**
   - Create `CmPlatformProjectUsageTab.tsx`
   - Implement progress bars and usage visualization
   - Add plan limit management

#### Task 3: Member Management (0.5 days)

**Location**: Members tab in Project Detail view

1. **Member List Component**
   - Create `CmPlatformProjectMemberList.tsx`
   - Show existing members with roles
   - Add actions for role changes and removal

2. **Invite Member Modal**
   - Create `CmPlatformProjectMemberInviteModal.tsx`
   - Implement email validation and role selection
   - Connect to invitation API endpoints

### Phase 4: Integration & Polish (1 day)

1. **Service Integration** (0.5 days)
   - Create proper CE service providers for platform admin features
   - Implement error handling and loading states
   - Add internationalization support

2. **UI Integration & Testing** (0.5 days)
   - Connect all components to services
   - Add responsive styling
   - Implement loading states and error handling
   - Perform cross-browser testing

## Directory Structure

### Frontend Structure

```
packages/
└── react-ui/
    └── src/
        ├── ce/
        │   └── platform/
        │       ├── projects/
        │       │   ├── components/
        │       │   │   ├── cm-platform-project-list.tsx
        │       │   │   ├── cm-platform-project-table.tsx
        │       │   │   ├── cm-platform-project-create-modal.tsx
        │       │   │   ├── cm-platform-project-detail.tsx
        │       │   │   ├── cm-platform-project-detail-tab.tsx
        │       │   │   ├── cm-platform-project-usage-tab.tsx
        │       │   │   ├── cm-platform-project-member-list.tsx
        │       │   │   └── cm-platform-project-member-invite-modal.tsx
        │       │   ├── services/
        │       │   │   └── cm-platform-project.service.ts
        │       │   └── hooks/
        │       │       └── cm-platform-project.hooks.ts
        └── app/
            └── platform/
                └── routes.tsx  // Add CE project routes here
```

### Backend Structure

```
packages/
└── server/
    └── api/
        └── src/
            └── app/
                ├── ce/
                │   └── platform/
                │       ├── platform-project.controller.ts
                │       └── platform-project.service.ts
                └── project/
                    └── project-service.ts  // Existing core service to use
```

### Technical Implementation Details

#### Example Component Implementation (Following CE Code Guide)
```typescript
// cm-platform-project-list.tsx
import { useEffect, useState } from 'react';
import { PlatformAdminContainer } from '../../../app/components/platform-admin-container';
import { cmPlatformProjectService } from '../services/cm-platform-project.service';

export const CmPlatformProjectList = () => {
  const [cmProjects, setCmProjects] = useState([]);
  const [cmLoading, setCmLoading] = useState(true);
  
  useEffect(() => {
    cmPlatformProjectService.list()
      .then(response => {
        setCmProjects(response.data);
        setCmLoading(false);
      })
      .catch(error => {
        console.error('Failed to load projects', error);
        setCmLoading(false);
      });
  }, []);
  
  return (
    <div className="cm-container">
      <h1>Projects</h1>
      {cmLoading ? (
        <div>Loading...</div>
      ) : (
        <CmPlatformProjectTable projects={cmProjects} />
      )}
      <button 
        className="cm-button cm-primary-button"
        onClick={() => /* Open create modal */}
      >
        Create Project
      </button>
    </div>
  );
};
```

#### Example Service Implementation (Following CE Code Guide)
```typescript
// cm-platform-project.service.ts
import axios from 'axios';

const CM_BASE_URL = '/api/v1/ce/platform/projects';

export const cmPlatformProjectService = {
  list: async (params = {}) => {
    const response = await axios.get(CM_BASE_URL, { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await axios.get(`${CM_BASE_URL}/${id}`);
    return response.data;
  },
  
  create: async (project) => {
    const response = await axios.post(CM_BASE_URL, project);
    return response.data;
  },
  
  update: async ({ id, ...data }) => {
    const response = await axios.patch(`${CM_BASE_URL}/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    await axios.delete(`${CM_BASE_URL}/${id}`);
  }
};
```

## Timeline and Roadmap

### April 2025
- Week 1: Phase 1 (Backend APIs) and Phase 2 (Platform UI Integration)
- Week 2: Phase 3 (Project Management UI Components)

### May 2025
- Week 1-2: Testing and refinement
- Week 3-4: Documentation and deployment preparation

## Implementation Notes

### 2025-03-20: Plan Updated

Updated the implementation approach to correctly leverage the existing Project entity in the core codebase:

1. Identified that the existing `Project` model in `packages/shared/src/lib/project/project.ts` is part of the core/shared codebase, not EE-specific.

2. Changed implementation strategy:
   - Use existing Project entities and repositories instead of creating duplicate models
   - Focus on implementing CE-compliant admin UI and controllers
   - Integrate with existing platform admin console instead of creating a separate admin interface

3. Revised directory structure:
   - Placed CE components under `ce/platform/projects/` for integration with platform admin
   - Backend controllers use `/v1/ce/platform/projects` API endpoints
   - Components follow CE naming conventions but integrate with core platform UI

4. Updated component implementation strategy:
   - Components connect to existing project data model through CE-specific services
   - UI follows platform admin design patterns for consistent user experience
   - Proper permission checks integrated with platform admin security model

## Conclusion

This updated implementation plan correctly leverages the existing Project entity while adding Commons Edition (CE) administrative capabilities that were previously only available in Enterprise Edition. By following this approach, we avoid unnecessary duplication of data models and ensure proper integration with the existing platform admin console, resulting in a more maintainable and consistent codebase.
