# Audit Logs Feature Implementation Plan

## Overview
This document outlines a plan to rebuild the Audit Logs feature from ActivePieces Enterprise Edition. Audit logs provide comprehensive tracking of application events for security and compliance purposes. The feature allows administrators to monitor and review important actions taken within the platform.

## Feature Analysis

### Core Functionality
1. **Event Tracking** - Capturing detailed information about various system events
2. **Event Storage** - Persisting event data in a structured format
3. **Event Retrieval** - Querying and filtering stored events
4. **Integration Points** - Hooks into various parts of the system to capture events

### Key Components

#### 1. Event Schema Definition
The core of the audit log system is the event schemas that define what information is captured. These schemas are defined in `packages/ee/shared/src/lib/audit-events/index.ts`. They include:

- Base event properties (platformId, projectId, userId, etc.)
- Event-specific data structures (Flow events, Connection events, Authentication events, etc.)
- Event type enumerations (ApplicationEventName)
- Event summarization utilities

#### 2. Database Entity
The audit events are stored in a database table defined by the `AuditEventEntity` schema in `packages/server/api/src/app/ee/audit-logs/audit-event-entity.ts`.

Key aspects:
- Table name: "audit_event"
- Core columns: id, platformId, projectId, action, userEmail, userId, data (JSONB), etc.
- Performance indices on platformId, projectId, userId, and action columns
- Relation to the platform entity

#### 3. Service Layer
The audit log service (`auditLogService`) in `packages/server/api/src/app/ee/audit-logs/audit-event-service.ts` provides:

- Methods to send user events and worker events
- Event recording with platform validation
- Filtering and pagination for retrieving events
- Integration with user identity and project services

#### 4. API Endpoints
The audit event controller in `packages/server/api/src/app/ee/audit-logs/audit-event-module.ts` provides:

- GET endpoint to list audit events with filtering options
- Authorization middleware to ensure proper access control

#### 5. System Integration
The audit log system is integrated with the main application through:

- Registration in the app setup (`auditEventModule`)
- Event hooks (`eventsHooks.set(auditLogService)`)
- Proper placement in the application initialization sequence

## Implementation Strategy

### 1. Event Schema Definition

Implement the existing event schema definitions as found in the current codebase:

1. Reproduce the base event properties schema exactly as defined in `packages/ee/shared/src/lib/audit-events/index.ts`
2. Implement all existing event types for different actions:
   - Flow events (created, updated, deleted, run)
   - Connection events (created, updated, deleted)
   - User events (sign-up, sign-in, password reset)
   - Folder events (created, updated, deleted)
   - Other system events (signing key creation, project roles, etc.)
3. Replicate the existing event summarization utility functions

### 2. Database Layer

Rebuild the database entity exactly as it exists in the current implementation:

1. Reproduce the audit event entity with all columns as defined in `packages/server/api/src/app/ee/audit-logs/audit-event-entity.ts`
2. Set up the same indices for performance as in the current implementation:
   - Combined indices on platformId, projectId, userId, and action
3. Use the existing database migration structure for the audit_event table

### 3. Service Layer

Rebuild the audit log service with the exact functionality found in the current implementation:

1. Implement the existing event recording methods:
   - `sendUserEvent`: Record events triggered by users
   - `sendWorkerEvent`: Record events triggered by the system
   - `sendUserEventFromRequest`: Extract information from HTTP requests
2. Reproduce the event retrieval functionality:
   - List events with filtering (platformId, userId, action, projectId)
   - Support pagination with cursor-based navigation
   - Apply proper ordering (newest first)
3. Include the platform validation check for audit logs enablement

### 4. API Layer

Rebuild the audit event controller matching the existing implementation:

1. Reproduce the GET endpoint for listing events with all current query parameters:
   - Filtering parameters (action, projectId, userId)
   - Pagination parameters (limit, cursor)
   - Time range parameters (createdBefore, createdAfter)
2. Implement the same authorization middleware:
   - Platform ownership validation
   - Feature enablement check

### 5. System Integration

Rebuild the system integration exactly as in the original implementation:

1. Register the audit log module in the application setup
2. Set up event hooks to capture events from various system components
3. Maintain the proper placement in the application initialization sequence

## Implementation Steps

### Phase 1: Core Schema and Database Setup

1. Reproduce the shared event schemas from `packages/ee/shared/src/lib/audit-events/index.ts`
2. Replicate the database entity from `packages/server/api/src/app/ee/audit-logs/audit-event-entity.ts`
3. Use the existing database migration structure for the audit_event table

### Phase 2: Service Implementation

1. Rebuild the audit log service using `packages/server/api/src/app/ee/audit-logs/audit-event-service.ts` as reference
2. Reproduce the helper functions for event formatting and saving
3. Implement the list function with filtering and pagination matching the current implementation

### Phase 3: API Endpoints and Integration

1. Rebuild the audit event controller based on `packages/server/api/src/app/ee/audit-logs/audit-event-module.ts`
2. Reproduce the authorization middleware
3. Register the module in the application setup as it's currently done
4. Set up event hooks to capture system events using the current implementation as reference

### Phase 4: Testing and Validation

1. Unit tests for event schema validation
2. Integration tests for service methods
3. API endpoint testing for proper filtering and authorization
4. System-wide testing to ensure events are properly captured

## Existing Database Schema

The audit logs feature utilizes the following database structure that we'll replicate exactly:

```sql
CREATE TABLE "audit_event" (
    "id" character varying(21) NOT NULL PRIMARY KEY,
    "created" TIMESTAMP NOT NULL,
    "updated" TIMESTAMP NOT NULL,
    "platformId" character varying NOT NULL,
    "projectId" character varying NULL,
    "action" character varying NOT NULL,
    "userEmail" character varying NULL,
    "projectDisplayName" character varying NULL,
    "data" JSONB NOT NULL,
    "ip" character varying NULL,
    "userId" character varying NULL,
    CONSTRAINT "FK_audit_event_platform" FOREIGN KEY ("platformId") 
    REFERENCES "platform"("id") ON DELETE CASCADE
);

CREATE INDEX "audit_event_platform_id_project_id_user_id_action_idx" 
ON "audit_event" ("platformId", "projectId", "userId", "action");

CREATE INDEX "audit_event_platform_id_user_id_action_idx" 
ON "audit_event" ("platformId", "userId", "action");

CREATE INDEX "audit_event_platform_id_action_idx" 
ON "audit_event" ("platformId", "action");
```

## Existing API Endpoint Specification

The implementation will match the existing API endpoint as follows:

### List Audit Events

**Endpoint:** `GET /v1/audit-events`

**Query Parameters:**
- `limit` (optional): Number of events to return (default: 20)
- `cursor` (optional): Pagination cursor
- `action` (optional): Filter by action type (array)
- `projectId` (optional): Filter by project ID (array)
- `userId` (optional): Filter by user ID
- `createdBefore` (optional): Filter by creation date (before)
- `createdAfter` (optional): Filter by creation date (after)

**Response:**
```json
{
  "data": [
    {
      "id": "string",
      "created": "string (ISO date)",
      "updated": "string (ISO date)",
      "platformId": "string",
      "projectId": "string",
      "action": "string (event name)",
      "userEmail": "string",
      "userId": "string",
      "data": { ... },
      "ip": "string"
    }
  ],
  "cursor": {
    "next": "string",
    "previous": "string"
  }
}
```

## Existing Event Types and Integration Points

The implementation will support all existing event types found in the current codebase:

### Core Event Types
1. **Flow Events**
   - Flow created, updated, deleted
   - Flow runs (started, finished)
   
2. **Connection Events**
   - Connection created/updated, deleted
   
3. **Folder Events**
   - Folder created, updated, deleted
   
4. **User Events**
   - User sign-up, sign-in
   - Password reset, email verification

5. **System Events**
   - Signing key creation
   - Project role management
   - Project release creation

### Integration Points
These events are captured at various points in the system, which we'll replicate:

1. **Flow Management**
   - Flow creation, update, and deletion handlers
   - Flow run execution points

2. **Connection Management**
   - Connection creation, update, and deletion handlers

3. **Authentication System**
   - Sign-in, sign-up handlers
   - Password reset functionality

4. **Project Management**
   - Project role operations
   - Project release creation

## Performance Considerations from Existing Implementation

The current implementation includes several performance optimizations that we'll maintain:

1. **Indexing Strategy**
   - Multiple indices on platformId, projectId, userId, and action
   - Compound indices for commonly queried combinations

2. **Pagination**
   - Cursor-based pagination for efficiency
   - Limit parameter to control response size

3. **Data Storage**
   - JSONB type for flexible event data storage
   - Selective column indexing

4. **Query Optimization**
   - Filtering at the database level
   - Efficient use of WHERE clauses and indices

## Implementation Timeline

According to the enterprise features analysis, rebuilding the Audit Logs feature is estimated to take **2-3 weeks** for a developer familiar with the ActivePieces codebase. Here's a more detailed breakdown of the estimated timeline:

### Week 1 (Days 1-5)
- **Days 1-2**: Implement event schema definitions and database entity structure
  - Reproduce the ApplicationEventName enum and all event type schemas
  - Create the database entity and migration files
  - Set up indices for query optimization
- **Days 3-5**: Implement core service layer functionality
  - Build the event recording methods
  - Create helper functions for event processing
  - Implement platform validation checks

### Week 2 (Days 6-10)
- **Days 6-7**: Complete service layer implementation
  - Implement event retrieval and filtering functionality
  - Build pagination support
  - Add integration with user identity and project services
- **Days 8-10**: Implement API endpoints and authorization
  - Create the controller with proper endpoint definition
  - Implement authorization middleware
  - Add request validation and error handling

### Week 3 (Days 11-15)
- **Days 11-12**: System integration
  - Register the module in the application setup
  - Set up event hooks for various system components
  - Ensure proper initialization sequence
- **Days 13-15**: Testing and refinement
  - Implement unit and integration tests
  - Fix bugs and edge cases
  - Performance optimization if needed

This timeline assumes:
- One developer working full-time on the feature
- Familiarity with TypeORM, Fastify, and the ActivePieces codebase structure
- No major architectural changes or dependencies on other features being rebuilt simultaneously

## Conclusion

This implementation plan outlines how to rebuild the Audit Logs feature to match the existing functionality exactly. The approach focuses on replicating the current implementation without introducing any extensions or changes to the database schema or API endpoints. 

By following this plan over the estimated 2-3 week timeline, we will recreate the Audit Logs functionality that provides comprehensive tracking of application events for security and compliance purposes, identical to the original implementation.
