# Knowledge Extension Feature Implementation Plan

## Overview
This document outlines a plan to implement the Knowledge extension feature. This feature will enable users to create and manage knowledge containers for vector-indexed/embedded knowledge that can be utilized primarily for AI/LLM enhancement. The feature will include database storage for knowledge containers and their associated data, as well as the necessary UI components and API endpoints to interface with them.

## Feature Analysis

### Core Functionality
1. **Knowledge Container Management** - Creating and managing containers that hold related knowledge data
2. **Document Ingestion** - Processing various document types (PDFs, TXTs, DOCs, etc.) into embeddings
3. **Vector Search** - Performing similarity searches using pgvector
4. **Access Control** - Managing permissions for knowledge containers (project-level or tenant-wide)
5. **Custom Piece Integration** - Creating a piece that can retrieve/query knowledge within flows

### Key Components

#### 1. Knowledge Container Schema
Knowledge containers will organize and group related knowledge data, with the following attributes:
- Unique identifier
- Name and description
- Project ID association
- Owner (user ID) 
- Created/updated timestamps
- Tenant-wide access flag (boolean)
- Optional metadata

#### 2. Knowledge Data Schema
Individual knowledge entries will store the processed documents and their embeddings:
- Unique identifier
- Reference to parent knowledge container
- Original document (reference or content)
- Body (processed content ready for embedding)
- Vector embedding (using pgvector)
- Keywords for filtering
- File metadata (type, size, name)
- Created/updated timestamps

#### 3. Vector Database Integration
The implementation will use pgvector extension with the existing PostgreSQL database:
- Vector data type for storing embeddings
- Similarity search capabilities using vector operations
- Indexing for optimal query performance

#### 4. Document Processing Pipeline
A processing pipeline for ingesting and converting various document types:
- File upload handling for various formats
- Text extraction from different document types
- Text chunking with appropriate size
- Embedding generation using Google Gemini
- Vector storage and indexing

#### 5. Custom Knowledge Piece
A custom Activepieces piece for interacting with knowledge containers in flows:
- Knowledge retrieval operations
- Similarity search with configurable parameters
- Knowledge persistence operations
- Container management operations

#### 6. UI Components
UI components for the knowledge management interface:
- New "AI" section in the main sidebar
- Knowledge container listing and creation
- Document upload and management interface
- Container settings and access control

## Implementation Strategy

### 1. Database Schema Design

#### Knowledge Container Entity
Create a database entity for knowledge containers with the following schema:

```typescript
@Entity({ name: 'knowledge' })
export class KnowledgeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  projectId: string;

  @Column()
  owner: string; // user_id

  @Column({ default: false })
  tenantWide: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;

  @ManyToOne(() => ProjectEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: ProjectEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner' })
  user: UserEntity;
}
```

#### Knowledge Data Entity
Create a database entity for knowledge data with the following schema:

```typescript
@Entity({ name: 'knowledge_data' })
export class KnowledgeDataEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  containerId: string; // knowledge_id

  @Column({ nullable: true, type: 'text' })
  originalDocument: string; // could be a file reference or the full text

  @Column({ type: 'text' })
  body: string; // processed content ready for embedding

  @Column({ array: true, nullable: true })
  keywords: string[];

  @Column({ type: 'int', nullable: true })
  fileSize: number;

  @Column({ type: 'varchar', nullable: true })
  fileName: string;

  @Column({ type: 'varchar', nullable: true })
  fileType: string;

  @Column({ type: 'vector', nullable: true })
  embedding: number[]; // Using pgvector's vector data type

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;

  @ManyToOne(() => KnowledgeEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'containerId' })
  container: KnowledgeEntity;
}
```

### 2. Database Migrations

Create the necessary migrations to set up the database schema:

1. Install and enable the pgvector extension:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

2. Create the knowledge table:
```sql
CREATE TABLE "knowledge" (
    "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" varchar NOT NULL,
    "description" varchar,
    "projectId" uuid NOT NULL,
    "owner" uuid NOT NULL,
    "tenantWide" boolean DEFAULT false,
    "metadata" jsonb,
    "created" TIMESTAMP NOT NULL DEFAULT now(),
    "updated" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "FK_knowledge_project" FOREIGN KEY ("projectId") 
    REFERENCES "project"("id") ON DELETE CASCADE,
    CONSTRAINT "FK_knowledge_owner" FOREIGN KEY ("owner") 
    REFERENCES "user"("id") ON DELETE CASCADE
);
```

3. Create the knowledge_data table:
```sql
CREATE TABLE "knowledge_data" (
    "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    "containerId" uuid NOT NULL,
    "originalDocument" text,
    "body" text NOT NULL,
    "keywords" varchar[] NULL,
    "fileSize" integer,
    "fileName" varchar,
    "fileType" varchar,
    "embedding" vector,
    "metadata" jsonb,
    "created" TIMESTAMP NOT NULL DEFAULT now(),
    "updated" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "FK_knowledge_data_container" FOREIGN KEY ("containerId") 
    REFERENCES "knowledge"("id") ON DELETE CASCADE
);
```

4. Create indices for improved query performance:
```sql
CREATE INDEX "idx_knowledge_project_id" ON "knowledge" ("projectId");
CREATE INDEX "idx_knowledge_owner" ON "knowledge" ("owner");
CREATE INDEX "idx_knowledge_data_container_id" ON "knowledge_data" ("containerId");
CREATE INDEX "idx_knowledge_data_embedding" ON "knowledge_data" USING ivfflat (embedding vector_cosine_ops);
```

### 3. Service Layer Implementation

#### Knowledge Container Service
Implement the service for managing knowledge containers:

```typescript
export class KnowledgeService {
  /**
   * Create a new knowledge container
   */
  static async create(params: {
    name: string;
    description?: string;
    projectId: string;
    owner: string;
    tenantWide?: boolean;
    metadata?: Record<string, unknown>;
  }): Promise<KnowledgeEntity> {
    // Implementation
  }

  /**
   * List knowledge containers for a project
   */
  static async list(params: {
    projectId: string;
    includeTenantWide?: boolean;
  }): Promise<KnowledgeEntity[]> {
    // Implementation
  }

  /**
   * Update knowledge container
   */
  static async update(params: {
    id: string;
    name?: string;
    description?: string;
    tenantWide?: boolean;
    metadata?: Record<string, unknown>;
  }): Promise<KnowledgeEntity> {
    // Implementation
  }

  /**
   * Delete knowledge container
   */
  static async delete(id: string): Promise<void> {
    // Implementation
  }

  /**
   * Get knowledge container by ID
   */
  static async get(id: string): Promise<KnowledgeEntity | null> {
    // Implementation
  }

  /**
   * Check if user has access to this knowledge container
   */
  static async checkAccess(params: {
    userId: string;
    containerId: string;
    projectId: string;
  }): Promise<boolean> {
    // Implementation
  }
}
```

#### Knowledge Data Service
Implement the service for managing knowledge data:

```typescript
export class KnowledgeDataService {
  /**
   * Add document to knowledge container
   */
  static async addDocument(params: {
    containerId: string;
    file: File | { content: string, name?: string, type?: string };
    metadata?: Record<string, unknown>;
  }): Promise<KnowledgeDataEntity> {
    // Implementation
  }

  /**
   * List documents in a knowledge container
   */
  static async list(params: {
    containerId: string;
    limit?: number;
    cursor?: string;
  }): Promise<{ data: KnowledgeDataEntity[]; cursor?: string }> {
    // Implementation
  }

  /**
   * Delete document from knowledge container
   */
  static async delete(id: string): Promise<void> {
    // Implementation
  }

  /**
   * Query knowledge using vector similarity search
   */
  static async query(params: {
    containerId: string;
    query: string;
    limit?: number;
    threshold?: number;
  }): Promise<Array<{ data: KnowledgeDataEntity; similarity: number }>> {
    // Implementation using pgvector similarity search
  }

  /**
   * Process and chunk document text
   */
  private static async processDocument(text: string): Promise<string[]> {
    // Implementation of text chunking with appropriate size
  }

  /**
   * Generate embeddings for text chunks
   */
  private static async generateEmbeddings(chunks: string[]): Promise<number[][]> {
    // Implementation using Google Gemini embeddings API
  }
}
```

### 4. Document Processing Pipeline

Implement a document processing pipeline that handles:

1. File upload handling:
   - Support for PDF, TXT, DOCX, XLSX, etc.
   - File size validation (limit to 100MB)

2. Text extraction:
   - PDF parsing using a library like pdf.js or pdf-parse
   - DOCX parsing using a library like mammoth.js
   - XLSX parsing using a library like xlsx
   - Direct text input support

3. Text chunking:
   - Split large documents into chunks of appropriate size
   - Maintain context and minimize information loss at chunk boundaries
   - Fixed chunk size (e.g., 1000 tokens)

4. Embedding generation:
   - Integration with Google Gemini embeddings API
   - Batch processing for efficiency
   - Error handling and retries

5. Storage and indexing:
   - Save processed chunks to the database
   - Create vector indices for efficient similarity search

### 5. API Implementation

#### Knowledge Container API Endpoints

1. List knowledge containers:
```
GET /v1/knowledge
```

2. Create knowledge container:
```
POST /v1/knowledge
```

3. Get knowledge container:
```
GET /v1/knowledge/:id
```

4. Update knowledge container:
```
PATCH /v1/knowledge/:id
```

5. Delete knowledge container:
```
DELETE /v1/knowledge/:id
```

#### Knowledge Data API Endpoints

1. List documents in a container:
```
GET /v1/knowledge/:containerId/data
```

2. Add document to container:
```
POST /v1/knowledge/:containerId/data
```

3. Delete document from container:
```
DELETE /v1/knowledge/:containerId/data/:id
```

4. Query knowledge:
```
POST /v1/knowledge/:containerId/query
```

### 6. Custom Piece Implementation

Create a custom piece for knowledge interactions in flows:

```typescript
import { createPiece, PieceAuth, Property } from '@activepieces/pieces-framework';

export const knowledgePiece = createPiece({
  name: 'knowledge',
  displayName: 'Knowledge',
  description: 'Interact with knowledge containers',
  auth: PieceAuth.None(),
  actions: [
    {
      name: 'queryKnowledge',
      displayName: 'Query Knowledge',
      description: 'Search knowledge using vector similarity',
      props: {
        containerId: Property.ShortText({
          displayName: 'Knowledge Container',
          description: 'Select a knowledge container',
          required: true,
        }),
        query: Property.LongText({
          displayName: 'Query',
          description: 'The query to search for',
          required: true,
        }),
        limit: Property.Number({
          displayName: 'Result Limit',
          description: 'Maximum number of results to return',
          required: false,
          defaultValue: 5,
        }),
        threshold: Property.Number({
          displayName: 'Similarity Threshold',
          description: 'Minimum similarity score (0-1)',
          required: false,
          defaultValue: 0.7,
        }),
      },
      async run(ctx) {
        // Implementation of query using KnowledgeDataService
      },
    },
    {
      name: 'addKnowledge',
      displayName: 'Add Knowledge',
      description: 'Add document to knowledge container',
      props: {
        containerId: Property.ShortText({
          displayName: 'Knowledge Container',
          description: 'Select a knowledge container',
          required: true,
        }),
        content: Property.LongText({
          displayName: 'Content',
          description: 'The content to add',
          required: true,
        }),
        metadata: Property.Object({
          displayName: 'Metadata',
          description: 'Additional metadata',
          required: false,
        }),
      },
      async run(ctx) {
        // Implementation of adding knowledge using KnowledgeDataService
      },
    },
    {
      name: 'deleteKnowledge',
      displayName: 'Delete Knowledge',
      description: 'Delete document from knowledge container',
      props: {
        dataId: Property.ShortText({
          displayName: 'Knowledge Data ID',
          description: 'ID of the knowledge data to delete',
          required: true,
        }),
      },
      async run(ctx) {
        // Implementation of delete using KnowledgeDataService
      },
    },
  ],
});
```

### 7. UI Implementation

The UI implementation will include:

1. Add a new "AI" section to the main sidebar

2. Create knowledge container listing page:
   - Table view of containers with name, description, creation date, etc.
   - "New Container" button
   - Options to edit/delete containers

3. Implement container creation/edit form:
   - Name and description fields
   - Tenant-wide access toggle
   - Save/cancel buttons

4. Create knowledge data management page:
   - List of documents in the container
   - Upload interface for adding new documents
   - Delete options for documents
   - Progress bar for upload/processing operations

5. Implement document upload features:
   - File upload for PDFs, TXTs, DOCXs, etc.
   - Direct text input option
   - URL input for web content
   - Upload progress and status indicators

## Implementation Steps

### Phase 1: Core Infrastructure (1-2 weeks)

1. **Database Setup**
   - Add pgvector extension to PostgreSQL
   - Create knowledge and knowledge_data tables
   - Set up appropriate indices

2. **Basic Services**
   - Implement KnowledgeService for container CRUD operations
   - Create initial KnowledgeDataService structure
   - Set up access control logic

### Phase 2: Document Processing (2-3 weeks)

1. **File Handling**
   - Implement file upload and storage
   - Create text extraction for different file types
   - Develop text chunking algorithm

2. **Embedding Pipeline**
   - Integrate with Google Gemini embeddings API
   - Implement embedding generation and storage
   - Set up vector similarity search

### Phase 3: API Endpoints (1-2 weeks)

1. **Container Endpoints**
   - Implement container CRUD operations
   - Set up proper authorization checks
   - Add pagination and filtering

2. **Data Endpoints**
   - Create endpoints for document management
   - Implement query endpoint
   - Add file upload endpoints

### Phase 4: UI Implementation (2-3 weeks)

1. **UI Components**
   - Add AI section to sidebar
   - Create knowledge container listing
   - Implement container creation/edit forms

2. **Document Management UI**
   - Build document upload interface
   - Create document listing and management
   - Implement progress indicators and status updates

### Phase 5: Custom Piece (1 week)

1. **Knowledge Piece**
   - Create custom piece for knowledge interactions
   - Implement query action
   - Add knowledge management actions

2. **Piece Testing**
   - Test piece actions in flows
   - Ensure proper integration with flows system
   - Optimize performance

### Phase 6: Testing and Refinement (1-2 weeks)

1. **System Testing**
   - Test end-to-end knowledge workflows
   - Verify vector search accuracy
   - Performance testing for large documents

2. **Bug Fixes and Optimization**
   - Address any issues from testing
   - Optimize performance bottlenecks
   - Refine UI/UX based on feedback

## Database Schema

The knowledge extension will use these database tables:

```sql
-- Knowledge container table
CREATE TABLE "knowledge" (
    "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" varchar NOT NULL,
    "description" varchar,
    "projectId" uuid NOT NULL,
    "owner" uuid NOT NULL,
    "tenantWide" boolean DEFAULT false,
    "metadata" jsonb,
    "created" TIMESTAMP NOT NULL DEFAULT now(),
    "updated" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "FK_knowledge_project" FOREIGN KEY ("projectId") 
    REFERENCES "project"("id") ON DELETE CASCADE,
    CONSTRAINT "FK_knowledge_owner" FOREIGN KEY ("owner") 
    REFERENCES "user"("id") ON DELETE CASCADE
);

-- Knowledge data table
CREATE TABLE "knowledge_data" (
    "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    "containerId" uuid NOT NULL,
    "originalDocument" text,
    "body" text NOT NULL,
    "keywords" varchar[] NULL,
    "fileSize" integer,
    "fileName" varchar,
    "fileType" varchar,
    "embedding" vector(1536), -- Adjust dimension based on embedding model
    "metadata" jsonb,
    "created" TIMESTAMP NOT NULL DEFAULT now(),
    "updated" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "FK_knowledge_data_container" FOREIGN KEY ("containerId") 
    REFERENCES "knowledge"("id") ON DELETE CASCADE
);

-- Indices for performance
CREATE INDEX "idx_knowledge_project_id" ON "knowledge" ("projectId");
CREATE INDEX "idx_knowledge_owner" ON "knowledge" ("owner");
CREATE INDEX "idx_knowledge_data_container_id" ON "knowledge_data" ("containerId");
CREATE INDEX "idx_knowledge_data_embedding" ON "knowledge_data" USING ivfflat (embedding vector_cosine_ops);
```

## API Endpoint Specifications

The implementation will match these API endpoints:

### Knowledge Container Endpoints

#### List Knowledge Containers

**Endpoint:** `GET /v1/knowledge`

**Query Parameters:**
- `projectId` (required): Filter by project ID
- `includeTenantWide` (optional): Whether to include tenant-wide containers

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "My Knowledge",
      "description": "Description text",
      "projectId": "uuid",
      "owner": "uuid",
      "tenantWide": false,
      "metadata": {},
      "created": "ISO string date",
      "updated": "ISO string date"
    }
  ]
}
```

#### Create Knowledge Container

**Endpoint:** `POST /v1/knowledge`

**Request Body:**
```json
{
  "name": "My Knowledge",
  "description": "Description text",
  "projectId": "uuid",
  "tenantWide": false,
  "metadata": {}
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "My Knowledge",
  "description": "Description text",
  "projectId": "uuid",
  "owner": "uuid",
  "tenantWide": false,
  "metadata": {},
  "created": "ISO string date",
  "updated": "ISO string date"
}
```

#### Get Knowledge Container

**Endpoint:** `GET /v1/knowledge/:id`

**Response:**
```json
{
  "id": "uuid",
  "name": "My Knowledge",
  "description": "Description text",
  "projectId": "uuid",
  "owner": "uuid",
  "tenantWide": false,
  "metadata": {},
  "created": "ISO string date",
  "updated": "ISO string date"
}
```

#### Update Knowledge Container

**Endpoint:** `PATCH /v1/knowledge/:id`

**Request Body:**
```json
{
  "name": "Updated Knowledge",
  "description": "Updated description",
  "tenantWide": true
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Updated Knowledge",
  "description": "Updated description",
  "projectId": "uuid",
  "owner": "uuid",
  "tenantWide": true,
  "metadata": {},
  "created": "ISO string date",
  "updated": "ISO string date"
}
```

#### Delete Knowledge Container

**Endpoint:** `DELETE /v1/knowledge/:id`

**Response:** `204 No Content`

### Knowledge Data Endpoints

#### List Knowledge Data

**Endpoint:** `GET /v1/knowledge/:containerId/data`

**Query Parameters:**
- `limit` (optional): Number of items to return
- `cursor` (optional): Pagination cursor

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "containerId": "uuid",
      "fileName": "document.pdf",
      "fileType": "application/pdf",
      "fileSize": 1024,
      "keywords": ["keyword1", "keyword2"],
      "metadata": {},
      "created": "ISO string date",
      "updated": "ISO string date"
    }
  ],
  "cursor": "string"
}
```

#### Add Document to Knowledge Container

**Endpoint:** `POST /v1/knowledge/:containerId/data`

**Request Body:** Multipart form data with file or JSON object

**Response:**
```json
{
  "id": "uuid",
  "containerId": "uuid",
  "fileName": "document.pdf",
  "fileType": "application/pdf",
  "fileSize": 1024,
  "keywords": ["keyword1", "keyword2"],
  "metadata": {},
  "created": "ISO string date",
  "updated": "ISO string date"
}
```

#### Delete Knowledge Data

**Endpoint:** `DELETE /v1/knowledge/:containerId/data/:id`

**Response:** `204 No Content`

#### Query Knowledge

**Endpoint:** `POST /v1/knowledge/:containerId/query`

**Request Body:**
```json
{
  "query": "Search query text",
  "limit": 5,
  "threshold": 0.7
}
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "containerId": "uuid",
      "body": "Matching text content",
      "fileName": "document.pdf",
      "similarity": 0.92,
      "metadata": {},
      "created": "ISO string date"
    }
  ]
}
```

## Performance Considerations

The implementation includes several performance optimizations:

1. **Vector Indexing**
   - Use of IVFFlat index for efficient similarity search
   - Appropriate vector dimensions based on embedding model

2. **Document Processing**
   - Batch processing for embeddings generation
   - Efficient text chunking to minimize API calls

3. **Query Optimization**
   - Similarity threshold to filter out low-relevance results
   - Proper indices on frequently queried columns

4. **File Handling**
   - File size limits to prevent processing extremely large documents
   - Stream processing for large files to minimize memory usage

## Security Considerations

The implementation must account for these security aspects:

1. **Access Control**
   - Container-level permissions tied to project access
   - Owner-specific operations (delete, update)
   - Tenant-wide access opt-in by owner only

2. **File Validation**
   - Proper file type validation
   - Size limits (100MB max)
   - Content scanning (optional)

3. **API Security**
   - Proper authorization checks on all endpoints
   - Validation of input parameters
   - Protection against injection attacks

4. **Embedding API Security**
   - Secure handling of API keys for Google Gemini
   - Rate limiting for embedding generation
   - Fallback mechanisms for API failures

## Implementation Timeline

Building the Knowledge extension feature is estimated to take **8-10 weeks** for a developer familiar with the ActivePieces codebase. Here's a more detailed breakdown:

### Weeks 1-2: Core Infrastructure & Research
- Research and evaluate pgvector implementation details
- Set up database schema and migrations
- Implement core service layer for knowledge containers
- Plan document processing pipeline

### Weeks 3-4: Document Processing Pipeline
- Implement file handling and upload functionality
- Develop text extraction for various document types
- Create text chunking algorithm
- Integrate with Google Gemini for embeddings

### Weeks 5-6: API & Vector Search
- Implement all API endpoints
- Develop vector similarity search
- Create proper authorization and access control
- Test performance of vector operations

### Weeks 7-8: UI Implementation
- Add new AI section to sidebar
- Create knowledge container management UI
- Implement document upload and management interface
- Add progress indicators and status updates

### Weeks 9-10: Custom Piece & Testing
- Develop the knowledge custom piece
- Test integration with flows
- Perform end-to-end testing
- Optimize performance
- Fix bugs and refine UI/UX

This timeline assumes:
- One developer working full-time on the feature
- Familiarity with TypeORM, Angular, and the ActivePieces codebase
- No major architectural changes or dependencies

## Conclusion

This implementation plan outlines how to build the Knowledge extension feature in ActivePieces. The approach focuses on creating a robust system for managing knowledge containers with vector search capabilities, which will primarily enhance AI/LLM functionality within the platform.

By following this plan, we will create a comprehensive knowledge management system that allows users to:
1. Create and manage knowledge containers
2. Upload and process various document types
3. Perform vector similarity searches using pgvector
4. Control access to knowledge at project or tenant level
5. Integrate knowledge queries into flows using a custom piece

The feature will be integrated into the UI under a new "AI" section, making it a seamless part of the ActivePieces experience while maintaining proper separation from core functionality.
