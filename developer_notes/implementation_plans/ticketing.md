# Ticketing System Implementation Plan

## Overview
This document outlines a plan to implement a new Ticketing feature for the Activepieces platform. The ticketing system will allow users to create, track, and manage tickets for various purposes such as support requests, incident tracking, and issue management. The system will also integrate with the Activepieces flows, allowing tickets to be created, updated, and monitored via automation.

## Feature Analysis

### Core Functionality
1. **Ticket Management** - Create, read, update, and delete ticket records
2. **Status Workflow** - Manage ticket status lifecycle (New, Acknowledged, In Progress, etc.)
3. **User Assignment** - Assign tickets to users and teams
4. **Severity Classification** - Label tickets with different severity levels
5. **Tagging System** - Organize tickets with flexible tagging
6. **History Tracking** - Record all changes and events related to tickets
7. **Attachment Support** - Allow files and evidence to be attached to tickets
8. **Flow Integration** - Create triggers and actions for Activepieces flows
9. **Notification System** - Send email notifications to assignees and reporters

### Key Components

#### 1. Ticket Data Model
The core of the ticketing system is based on the ticket schema, with a few additions:

```typescript
interface Ticket {
  id: string;              // Unique identifier
  title: string;           // Brief summary
  description: string;     // Detailed explanation
  status: TicketStatus;    // Current state
  severity: TicketSeverity;// Risk/impact level
  created_at: Date;        // Creation timestamp
  updated_at: Date;        // Last modification timestamp
  resolved_at: Date | null;// Resolution timestamp
  due_date: Date | null;   // Due date for the ticket
  reporter: string;        // User/system who created ticket
  assignee: string;        // User/team responsible
  source: string;          // Originating system or flow
  tags: string[];          // Classification tags
  attachments: Attachment[];// Supporting files/documents
  history: HistoryEntry[]; // Record of changes
  project_id: string;      // Project the ticket belongs to
}
```

#### 2. Ticket Lifecycle Management
The ticket workflow is based on definable statuses:

- **New**: Initial state when ticket is created
- **Acknowledged/Assigned**: Ticket is received and assigned
- **In Progress/Investigating**: Being actively worked on
- **Resolved**: Issue addressed, pending validation
- **Closed/Done**: Final state after resolution is confirmed
- **Deferred/On Hold**: Temporarily paused
- **Canceled**: Ticket withdrawn or no longer active

#### 3. Flow Integration Components
To support integration with Activepieces flows:

- **Trigger Pieces**: Create flow triggers for ticket events (created, updated, status changed)
- **Action Pieces**: Create flow actions for ticket manipulation (create, update, close)

## Implementation Strategy

Following the Commons Edition (CE) code guide, we'll implement the ticketing system as a modular feature with proper prefixing and separation.

### 1. Database Schema

#### 1.1 Entity Definitions

**Ticket Entity**
```typescript
// cm_ticket.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'cm_ticket' })
export class CmTicketEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column()
  status: string;

  @Column()
  severity: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ nullable: true })
  resolved_at: Date;

  @Column({ nullable: true })
  due_date: Date;

  @Column()
  reporter: string;

  @Column()
  assignee: string;

  @Column()
  source: string;

  @Column()
  project_id: string;

  @Column('simple-array')
  tags: string[];
}
```

**Ticket History Entity**
```typescript
// cm_ticket_history.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity({ name: 'cm_ticket_history' })
export class CmTicketHistoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  ticket_id: string;

  @Column()
  event: string;

  @CreateDateColumn()
  timestamp: Date;

  @Column()
  changed_by: string;

  @Column('jsonb')
  changes: Record<string, { old: any, new: any }>;
}
```

**Ticket Attachment Entity**
```typescript
// cm_ticket_attachment.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity({ name: 'cm_ticket_attachment' })
export class CmTicketAttachmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  ticket_id: string;

  @Column()
  file_name: string;

  @Column()
  url: string;

  @CreateDateColumn()
  uploaded_at: Date;

  @Column()
  uploaded_by: string;
}
```

#### 1.2 Database Migrations

Create migrations for ticket-related tables:

```typescript
// migrations/CmCreateTicketTables1234567890123.ts
import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CmCreateTicketTables1234567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ticket table
    await queryRunner.createTable(
      new Table({
        name: 'cm_ticket',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'title',
            type: 'varchar',
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'status',
            type: 'varchar',
          },
          {
            name: 'severity',
            type: 'varchar',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'resolved_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'due_date',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'reporter',
            type: 'uuid',
          },
          {
            name: 'assignee',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'source',
            type: 'varchar',
          },
          {
            name: 'project_id',
            type: 'uuid',
          },
          {
            name: 'tags',
            type: 'varchar',
            isArray: true,
            default: '{}',
          },
        ],
      }),
      true
    );

    // Create foreign key relationships
    await queryRunner.createForeignKey(
      'cm_ticket',
      new TableForeignKey({
        columnNames: ['project_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'project',
        onDelete: 'CASCADE',
      })
    );

    // Create ticket history table
    await queryRunner.createTable(
      new Table({
        name: 'cm_ticket_history',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'ticket_id',
            type: 'uuid',
          },
          {
            name: 'event',
            type: 'varchar',
          },
          {
            name: 'timestamp',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'changed_by',
            type: 'uuid',
          },
          {
            name: 'changes',
            type: 'jsonb',
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Create foreign key for history
    await queryRunner.createForeignKey(
      'cm_ticket_history',
      new TableForeignKey({
        columnNames: ['ticket_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'cm_ticket',
        onDelete: 'CASCADE',
      })
    );

    // Create ticket attachment table
    await queryRunner.createTable(
      new Table({
        name: 'cm_ticket_attachment',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'ticket_id',
            type: 'uuid',
          },
          {
            name: 'file_name',
            type: 'varchar',
          },
          {
            name: 'url',
            type: 'varchar',
          },
          {
            name: 'uploaded_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'uploaded_by',
            type: 'uuid',
          },
        ],
      }),
      true
    );

    // Create foreign key for attachments
    await queryRunner.createForeignKey(
      'cm_ticket_attachment',
      new TableForeignKey({
        columnNames: ['ticket_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'cm_ticket',
        onDelete: 'CASCADE',
      })
    );

    // Create indices for better query performance
    await queryRunner.query(`
      CREATE INDEX idx_cm_ticket_project_id ON cm_ticket(project_id);
      CREATE INDEX idx_cm_ticket_reporter ON cm_ticket(reporter);
      CREATE INDEX idx_cm_ticket_assignee ON cm_ticket(assignee);
      CREATE INDEX idx_cm_ticket_status ON cm_ticket(status);
      CREATE INDEX idx_cm_ticket_tags ON cm_ticket USING GIN(tags);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('cm_ticket_attachment');
    await queryRunner.dropTable('cm_ticket_history');
    await queryRunner.dropTable('cm_ticket');
  }
}
```

### 2. Server-Side Implementation

#### 2.1 Models and Type Definitions

```typescript
// cm_ticket.models.ts
import { Static, Type } from '@sinclair/typebox';

// Enums
export enum CmTicketStatus {
  NEW = 'new',
  ACKNOWLEDGED = 'acknowledged',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  DEFERRED = 'deferred',
  CANCELED = 'canceled',
}

export enum CmTicketSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

// Request/Response types
export const CmTicketAttachmentSchema = Type.Object({
  id: Type.String(),
  file_name: Type.String(),
  url: Type.String(),
  uploaded_at: Type.String(),
  uploaded_by: Type.String(),
});
export type CmTicketAttachmentType = Static<typeof CmTicketAttachmentSchema>;

export const CmTicketHistoryEntrySchema = Type.Object({
  id: Type.String(),
  event: Type.String(),
  timestamp: Type.String(),
  changed_by: Type.String(),
  changes: Type.Optional(Type.Record(Type.String(), Type.Any())),
});
export type CmTicketHistoryEntryType = Static<typeof CmTicketHistoryEntrySchema>;

export const CmTicketSchema = Type.Object({
  id: Type.String(),
  title: Type.String(),
  description: Type.String(),
  status: Type.Enum(CmTicketStatus),
  severity: Type.Enum(CmTicketSeverity),
  created_at: Type.String(),
  updated_at: Type.String(),
  resolved_at: Type.Optional(Type.String()),
  due_date: Type.Optional(Type.String()),
  reporter: Type.String(),
  assignee: Type.String(),
  source: Type.String(),
  project_id: Type.String(),
  tags: Type.Array(Type.String()),
  attachments: Type.Optional(Type.Array(CmTicketAttachmentSchema)),
  history: Type.Optional(Type.Array(CmTicketHistoryEntrySchema)),
});
export type CmTicketType = Static<typeof CmTicketSchema>;

export const CmCreateTicketRequestSchema = Type.Object({
  title: Type.String(),
  description: Type.String(),
  severity: Type.Enum(CmTicketSeverity),
  due_date: Type.Optional(Type.String()),
  assignee: Type.Optional(Type.String()),
  source: Type.Optional(Type.String()),
  tags: Type.Optional(Type.Array(Type.String())),
});
export type CmCreateTicketRequestType = Static<typeof CmCreateTicketRequestSchema>;

export const CmUpdateTicketRequestSchema = Type.Object({
  title: Type.Optional(Type.String()),
  description: Type.Optional(Type.String()),
  status: Type.Optional(Type.Enum(CmTicketStatus)),
  severity: Type.Optional(Type.Enum(CmTicketSeverity)),
  due_date: Type.Optional(Type.String()),
  assignee: Type.Optional(Type.String()),
  tags: Type.Optional(Type.Array(Type.String())),
});
export type CmUpdateTicketRequestType = Static<typeof CmUpdateTicketRequestSchema>;

export const CmAddCommentRequestSchema = Type.Object({
  comment: Type.String(),
});
export type CmAddCommentRequestType = Static<typeof CmAddCommentRequestSchema>;

export const CmSearchTicketsRequestSchema = Type.Object({
  status: Type.Optional(Type.Enum(CmTicketStatus)),
  severity: Type.Optional(Type.Enum(CmTicketSeverity)),
  reporter: Type.Optional(Type.String()),
  assignee: Type.Optional(Type.String()),
  tags: Type.Optional(Type.Array(Type.String())),
  created_after: Type.Optional(Type.String()),
  created_before: Type.Optional(Type.String()),
  due_after: Type.Optional(Type.String()),
  due_before: Type.Optional(Type.String()),
  limit: Type.Optional(Type.Number()),
  cursor: Type.Optional(Type.String()),
});
export type CmSearchTicketsRequestType = Static<typeof CmSearchTicketsRequestSchema>;
```

#### 2.2 Repository Implementation

```typescript
// cm_ticket.repository.ts
import { DatabaseService } from '../../database/database.service';
import { CmTicketEntity } from './cm_ticket.entity';
import { CmTicketHistoryEntity } from './cm_ticket_history.entity';
import { CmTicketAttachmentEntity } from './cm_ticket_attachment.entity';
import { CmSearchTicketsRequestType } from './cm_ticket.models';

export class CmTicketRepository {
  static async create(ticket: Partial<CmTicketEntity>): Promise<CmTicketEntity> {
    const dbService = await DatabaseService.getInstance();
    return await dbService.getEntityManager().save(CmTicketEntity, ticket);
  }

  static async findOne(id: string, projectId: string): Promise<CmTicketEntity | null> {
    const dbService = await DatabaseService.getInstance();
    return await dbService.getEntityManager().findOne(CmTicketEntity, {
      where: {
        id,
        project_id: projectId,
      },
    });
  }

  static async update(id: string, projectId: string, ticket: Partial<CmTicketEntity>): Promise<CmTicketEntity | null> {
    const dbService = await DatabaseService.getInstance();
    await dbService.getEntityManager().update(
      CmTicketEntity,
      { id, project_id: projectId },
      ticket
    );
    return this.findOne(id, projectId);
  }

  static async delete(id: string, projectId: string): Promise<void> {
    const dbService = await DatabaseService.getInstance();
    await dbService.getEntityManager().delete(CmTicketEntity, {
      id,
      project_id: projectId,
    });
  }

  static async search(projectId: string, params: CmSearchTicketsRequestType): Promise<{
    data: CmTicketEntity[];
    cursor: string | null;
  }> {
    const dbService = await DatabaseService.getInstance();
    const qb = dbService.getEntityManager()
      .createQueryBuilder(CmTicketEntity, 'ticket')
      .where('ticket.project_id = :projectId', { projectId })
      .orderBy('ticket.created_at', 'DESC');
    
    // Apply filters
    if (params.status) {
      qb.andWhere('ticket.status = :status', { status: params.status });
    }
    if (params.severity) {
      qb.andWhere('ticket.severity = :severity', { severity: params.severity });
    }
    if (params.reporter) {
      qb.andWhere('ticket.reporter = :reporter', { reporter: params.reporter });
    }
    if (params.assignee) {
      qb.andWhere('ticket.assignee = :assignee', { assignee: params.assignee });
    }
    if (params.created_after) {
      qb.andWhere('ticket.created_at >= :createdAfter', { createdAfter: params.created_after });
    }
    if (params.created_before) {
      qb.andWhere('ticket.created_at <= :createdBefore', { createdBefore: params.created_before });
    }
    if (params.due_after) {
      qb.andWhere('ticket.due_date >= :dueAfter', { dueAfter: params.due_after });
    }
    if (params.due_before) {
      qb.andWhere('ticket.due_date <= :dueBefore', { dueBefore: params.due_before });
    }
    if (params.tags && params.tags.length > 0) {
      qb.andWhere('ticket.tags && :tags', { tags: params.tags });
    }
    
    // Apply pagination
    const limit = params.limit || 10;
    if (params.cursor) {
      const decodedCursor = Buffer.from(params.cursor, 'base64').toString('ascii');
      qb.andWhere('ticket.created_at < :cursor', { cursor: decodedCursor });
    }
    qb.take(limit + 1);
    
    const tickets = await qb.getMany();
    let nextCursor = null;
    
    if (tickets.length > limit) {
      tickets.pop(); // Remove the extra item
      const lastTicket = tickets[tickets.length - 1];
      nextCursor = Buffer.from(lastTicket.created_at.toISOString()).toString('base64');
    }
    
    return {
      data: tickets,
      cursor: nextCursor,
    };
  }

  static async addHistory(history: Partial<CmTicketHistoryEntity>): Promise<CmTicketHistoryEntity> {
    const dbService = await DatabaseService.getInstance();
    return await dbService.getEntityManager().save(CmTicketHistoryEntity, history);
  }

  static async getHistory(ticketId: string): Promise<CmTicketHistoryEntity[]> {
    const dbService = await DatabaseService.getInstance();
    return await dbService.getEntityManager().find(CmTicketHistoryEntity, {
      where: { ticket_id: ticketId },
      order: { timestamp: 'DESC' },
    });
  }

  static async addAttachment(attachment: Partial<CmTicketAttachmentEntity>): Promise<CmTicketAttachmentEntity> {
    const dbService = await DatabaseService.getInstance();
    return await dbService.getEntityManager().save(CmTicketAttachmentEntity, attachment);
  }

  static async getAttachments(ticketId: string): Promise<CmTicketAttachmentEntity[]> {
    const dbService = await DatabaseService.getInstance();
    return await dbService.getEntityManager().find(CmTicketAttachmentEntity, {
      where: { ticket_id: ticketId },
    });
  }

  static async deleteAttachment(id: string, ticketId: string): Promise<void> {
    const dbService = await DatabaseService.getInstance();
    await dbService.getEntityManager().delete(CmTicketAttachmentEntity, {
      id,
      ticket_id: ticketId,
    });
  }
}
```

#### 2.3 Service Implementation

```typescript
// cm_ticket.service.ts
import { CmTicketRepository } from './cm_ticket.repository';
import { CmTicketEntity } from './cm_ticket.entity';
import { CmTicketHistoryEntity } from './cm_ticket_history.entity';
import { CmTicketAttachmentEntity } from './cm_ticket_attachment.entity';
import { 
  CmCreateTicketRequestType, 
  CmUpdateTicketRequestType, 
  CmTicketStatus, 
  CmSearchTicketsRequestType,
  CmAddCommentRequestType
} from './cm_ticket.models';
import { NotificationService } from '../notification/notification.service';
import { UserService } from '../user/user.service';
import { ProjectService } from '../project/project.service';
import { StorageService } from '../file/storage.service';
import { ApId } from '../helper/id-generator';
import { ActivepiecesError, ErrorCode } from '@activepieces/shared';

export class CmTicketService {
  static async create(
    projectId: string,
    userId: string,
    params: CmCreateTicketRequestType
  ): Promise<CmTicketEntity> {
    // Verify project exists
    await ProjectService.getOneOrThrow(projectId);
    
    const ticketData: Partial<CmTicketEntity> = {
      id: ApId.create(),
      title: params.title,
      description: params.description,
      status: CmTicketStatus.NEW,
      severity: params.severity,
      reporter: userId,
      assignee: params.assignee || userId,
      source: params.source || 'manual',
      project_id: projectId,
      tags: params.tags || [],
      due_date: params.due_date ? new Date(params.due_date) : null,
    };

    const ticket = await CmTicketRepository.create(ticketData);

    // Record creation in history
    await this.recordHistory(ticket.id, userId, 'TICKET_CREATED', {
      old: null,
      new: {
        title: ticket.title,
        description: ticket.description,
        status: ticket.status,
        severity: ticket.severity,
        assignee: ticket.assignee,
      }
    });

    // Send notifications
    await this.sendNotifications('TICKET_CREATED', ticket);

    return ticket;
  }

  static async getOne(id: string, projectId: string): Promise<CmTicketEntity> {
    const ticket = await CmTicketRepository.findOne(id, projectId);
    if (!ticket) {
      throw new ActivepiecesError({
        code: ErrorCode.ENTITY_NOT_FOUND,
        params: {
          entityType: 'ticket',
          entityId: id,
        },
      });
    }
    return ticket;
  }

  static async update(
    id: string,
    projectId: string,
    userId: string,
    params: CmUpdateTicketRequestType
  ): Promise<CmTicketEntity> {
    const ticket = await this.getOne(id, projectId);
    const changes: Record<string, { old: any, new: any }> = {};
    const updatedData: Partial<CmTicketEntity> = {};

    // Track changes for each field
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && ticket[key] !== value) {
        changes[key] = {
          old: ticket[key],
          new: value,
        };
        updatedData[key] = value;
      }
    }

    // Handle status transition to RESOLVED
    if (params.status === CmTicketStatus.RESOLVED && ticket.status !== CmTicketStatus.RESOLVED) {
      updatedData.resolved_at = new Date();
    }

    // If no changes, just return the ticket
    if (Object.keys(changes).length === 0) {
      return ticket;
    }

    const updatedTicket = await CmTicketRepository.update(id, projectId, updatedData);

    // Record history
    await this.recordHistory(id, userId, 'TICKET_UPDATED', changes);

    // Send notifications for important changes
    if (changes.status || changes.assignee) {
      await this.sendNotifications('TICKET_UPDATED', updatedTicket!);
    }

    return updatedTicket!;
  }

  static async delete(id: string, projectId: string, userId: string): Promise<void> {
    const ticket = await this.getOne(id, projectId);

    await CmTicketRepository.delete(id, projectId);

    // Record deletion in history (even though the ticket is deleted,
    // we might want to keep a record of deleted tickets in an audit log)
    await this.recordHistory(id, userId, 'TICKET_DELETED', {
      old: {
        title: ticket.title,
        description: ticket.description,
        status: ticket.status,
      },
      new: null,
    });
  }

  static async addComment(
    id: string,
    projectId: string,
    userId: string,
    params: CmAddCommentRequestType
  ): Promise<void> {
    // Verify ticket exists
    await this.getOne(id, projectId);

    // Record comment in history
    await this.recordHistory(id, userId, 'COMMENT_ADDED', {
      comment: params.comment,
    });

    // Send notification
    await this.sendNotifications('COMMENT_ADDED', {
      id,
      project_id: projectId,
      comment: params.comment,
      commented_by: userId,
    });
  }

  static async search(
    projectId: string,
    params: CmSearchTicketsRequestType
  ): Promise<{
    data: CmTicketEntity[];
    cursor: string | null;
  }> {
    return await CmTicketRepository.search(projectId, params);
  }

  static async getTicketWithDetails(
    id: string, 
    projectId: string
  ): Promise<CmTicketEntity & { 
    history: CmTicketHistoryEntity[],
    attachments: CmTicketAttachmentEntity[] 
  }> {
    const ticket = await this.getOne(id, projectId);
    const history = await CmTicketRepository.getHistory(id);
    const attachments = await CmTicketRepository.getAttachments(id);

    return {
      ...ticket,
      history,
      attachments,
    };
  }

  static async uploadAttachment(
    id: string,
    projectId: string,
    userId: string,
    file: { filename: string, buffer: Buffer }
  ): Promise<CmTicketAttachmentEntity> {
    // Verify ticket exists
    await this.getOne(id, projectId);

    // Upload file to storage
    const url = await StorageService.upload(`tickets/${id}/${file.filename}`, file.buffer);

    // Save attachment record
    const attachment = await CmTicketRepository.addAttachment({
      id: ApId.create(),
      ticket_id: id,
      file_name: file.filename,
      url,
      uploaded_by: userId,
    });

    // Record in history
    await this.recordHistory(id, userId, 'ATTACHMENT_ADDED', {
      attachment: {
        id: attachment.id,
        file_name: file.filename,
      },
    });

    return attachment;
  }

  static async deleteAttachment(
    ticketId: string,
    attachmentId: string,
    projectId: string,
    userId: string
  ): Promise<void> {
    // Verify ticket exists
    await this.getOne(ticketId, projectId);

    // Delete attachment
    await CmTicketRepository.deleteAttachment(attachmentId, ticketId);

    // Record in history
    await this.recordHistory(ticketId, userId, 'ATTACHMENT_REMOVED', {
      attachment_id: attachmentId,
    });
  }

  private static async recordHistory(
    ticketId: string,
    userId: string,
    event: string,
    changes: Record<string, any>
  ): Promise<void> {
    const historyEntry: Partial<CmTicketHistoryEntity> = {
      id: ApId.create(),
      ticket_id: ticketId,
      event,
      changed_by: userId,
      changes,
    };

    await CmTicketRepository.addHistory(historyEntry);
  }

  private static async sendNotifications(
    eventType: string,
    data: any
  ): Promise<void> {
    // This is a placeholder for notification service integration
    // In reality, we would integrate with a notification system
    // to send emails, in-app notifications, etc.

    switch (eventType) {
      case 'TICKET_CREATED':
        // Notify assignee
        if (data.assignee && data.assignee !== data.reporter) {
          await NotificationService.sendEmail(
            data.assignee,
            `New ticket assigned: ${data.title}`,
            `You have been assigned a new ticket: ${data.title}\n\n${data.description}`
          );
        }
        break;

      case 'TICKET_UPDATED':
        // Notify assignee of changes
        if (data.assignee) {
          await NotificationService.sendEmail(
            data.assignee,
            `Ticket updated: ${data.title}`,
            `A ticket assigned to you has been updated: ${data.title}`
          );
        }
        
        // Notify reporter of status changes
        if (data.reporter && data.reporter !== data.assignee) {
          await NotificationService.sendEmail(
            data.reporter,
            `Ticket status update: ${data.title}`,
            `A ticket you reported has been updated: ${data.title}`
          );
        }
        break;

      case 'COMMENT_ADDED':
        // Notify all participants
        const ticket = await CmTicketRepository.findOne(data.id, data.project_id);
        if (ticket) {
          const uniqueRecipients = [ticket.reporter, ticket.assignee].filter(
            (user, index, self) => user && user !== data.commented_by && self.indexOf(user) === index
          );
          
          for (const recipient of uniqueRecipients) {
            await NotificationService.sendEmail(
              recipient,
              `New comment on ticket: ${ticket.title}`,
              `${data.commented_by} commented on ticket ${ticket.title}: "${data.comment}"`
            );
          }
        }
        break;
    }
  }
}
```

#### 2.4 Controller Implementation

```typescript
// cm_ticket.controller.ts
import { FastifyInstance, FastifyRequest } from 'fastify';
import { CmTicketService } from './cm_ticket.service';
import { 
  CmAddCommentRequestSchema, 
  CmAddCommentRequestType,
  CmCreateTicketRequestSchema, 
  CmCreateTicketRequestType,
  CmSearchTicketsRequestSchema,
  CmSearchTicketsRequestType,
  CmTicketSchema,
  CmUpdateTicketRequestSchema, 
  CmUpdateTicketRequestType
} from './cm_ticket.models';
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox';
import { projectMemberPermission } from '../project/project-member-permission';

export const cmTicketController: FastifyPluginAsyncTypebox = async (app) => {
  app.register(async (router) => {
    router.get(
      '/',
      {
        schema: {
          querystring: CmSearchTicketsRequestSchema,
          response: {
            200: Type.Object({
              data: Type.Array(CmTicketSchema),
              cursor: Type.Union([Type.String(), Type.Null()]),
            }),
          },
        },
        preHandler: [projectMemberPermission],
      },
      async (request) => {
        const params = request.query as CmSearchTicketsRequestType;
        return await CmTicketService.search(request.params.projectId, params);
      }
    );

    router.post(
      '/',
      {
        schema: {
          body: CmCreateTicketRequestSchema,
          response: {
            200: CmTicketSchema,
          },
        },
        preHandler: [projectMemberPermission],
      },
      async (request) => {
        const params = request.body as CmCreateTicketRequestType;
        return await CmTicketService.create(
          request.params.projectId,
          request.principal.id,
          params
        );
      }
    );

    router.get(
      '/:ticketId',
      {
        schema: {
          params: Type.Object({
            projectId: Type.String(),
            ticketId: Type.String(),
          }),
          response: {
            200: Type.Intersect([
              CmTicketSchema,
              Type.Object({
                history: Type.Array(Type.Any()),
                attachments: Type.Array(Type.Any()),
              }),
            ]),
          },
        },
        preHandler: [projectMemberPermission],
      },
      async (request) => {
        return await CmTicketService.getTicketWithDetails(
          request.params.ticketId,
          request.params.projectId
        );
      }
    );

    router.patch(
      '/:ticketId',
      {
        schema: {
          params: Type.Object({
            projectId: Type.String(),
            ticketId: Type.String(),
          }),
          body: CmUpdateTicketRequestSchema,
          response: {
            200: CmTicketSchema,
          },
        },
        preHandler: [projectMemberPermission],
      },
      async (request) => {
        const params = request.body as CmUpdateTicketRequestType;
        return await CmTicketService.update(
          request.params.ticketId,
          request.params.projectId,
          request.principal.id,
          params
        );
      }
    );

    router.delete(
      '/:ticketId',
      {
        schema: {
          params: Type.Object({
            projectId: Type.String(),
            ticketId: Type.String(),
          }),
        },
        preHandler: [projectMemberPermission],
      },
      async (request, reply) => {
        await CmTicketService.delete(
          request.params.ticketId,
          request.params.projectId,
          request.principal.id
        );
        return reply.status(204).send();
      }
    );

    router.post(
      '/:ticketId/comment',
      {
        schema: {
          params: Type.Object({
            projectId: Type.String(),
            ticketId: Type.String(),
          }),
          body: CmAddCommentRequestSchema,
        },
        preHandler: [projectMemberPermission],
      },
      async (request, reply) => {
        const params = request.body as CmAddCommentRequestType;
        await CmTicketService.addComment(
          request.params.ticketId,
          request.params.projectId,
          request.principal.id,
          params
        );
        return reply.status(200).send({ success: true });
      }
    );

    router.post(
      '/:ticketId/attachment',
      {
        schema: {
          params: Type.Object({
            projectId: Type.String(),
            ticketId: Type.String(),
          }),
          consumes: ['multipart/form-data'],
        },
        preHandler: [projectMemberPermission],
      },
      async (request: FastifyRequest, reply) => {
        const data = await request.file();
        if (!data) {
          return reply.status(400).send({ error: 'No file provided' });
        }

        const buffer = await data.toBuffer();
        const attachment = await CmTicketService.uploadAttachment(
          request.params.ticketId,
          request.params.projectId,
          request.principal.id,
          {
            filename: data.filename,
            buffer,
          }
        );
        return reply.status(200).send(attachment);
      }
    );

    router.delete(
      '/:ticketId/attachment/:attachmentId',
      {
        schema: {
          params: Type.Object({
            projectId: Type.String(),
            ticketId: Type.String(),
            attachmentId: Type.String(),
          }),
        },
        preHandler: [projectMemberPermission],
      },
      async (request, reply) => {
        await CmTicketService.deleteAttachment(
          request.params.ticketId,
          request.params.attachmentId,
          request.params.projectId,
          request.principal.id
        );
        return reply.status(204).send();
      }
    );
  }, { prefix: '/v1/ce/projects/:projectId/tickets' });
};
```

### 3. Activepieces Flow Integration

To support integration with Activepieces flows, we need to create both trigger and action pieces:

#### 3.1 Ticket Trigger Pieces

```typescript
// packages/pieces/community/ticketing/src/lib/triggers/ticket-created.ts
import { createTrigger } from '@activepieces/pieces-framework';
import { cmTicketCommon } from '../common';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { ticketingAuth } from '../auth';

export const ticketCreatedTrigger = createTrigger({
  name: 'ticket_created',
  displayName: 'Ticket Created',
  description: 'Triggers when a new ticket is created',
  props: {
    auth: ticketingAuth,
    project_id: cmTicketCommon.project_id
  },
  sampleData: {
    id: '1234567890',
    title: 'Sample Ticket Title',
    description: 'This is a sample ticket description',
    status: 'new',
    severity: 'medium',
    created_at: '2025-03-19T12:00:00.000Z',
    updated_at: '2025-03-19T12:00:00.000Z',
    reporter: 'user123',
    assignee: 'user456',
    source: 'manual',
    project_id: '7890123456',
    tags: ['bug', 'frontend']
  },
  type: 'webhook',
  async onEnable(context) {
    const { auth, project_id } = context.propsValue;
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${auth.baseUrl}/v1/ce/projects/${project_id}/webhooks`,
      body: {
        name: `Ticket Created ${context.webhookUrl}`,
        event_type: 'TICKET_CREATED',
        url: context.webhookUrl
      },
      headers: {
        Authorization: `Bearer ${auth.apiKey}`
      }
    });
    return {
      webhookId: response.body.id
    };
  },
  async onDisable(context) {
    const { auth, project_id } = context.propsValue;
    const webhookId = context.webhookId;
    await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `${auth.baseUrl}/v1/ce/projects/${project_id}/webhooks/${webhookId}`,
      headers: {
        Authorization: `Bearer ${auth.apiKey}`
      }
    });
  },
  async run(context) {
    return context.payload.body;
  }
});
```

```typescript
// packages/pieces/community/ticketing/src/lib/triggers/ticket-updated.ts
import { createTrigger } from '@activepieces/pieces-framework';
import { cmTicketCommon } from '../common';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { ticketingAuth } from '../auth';

export const ticketUpdatedTrigger = createTrigger({
  name: 'ticket_updated',
  displayName: 'Ticket Updated',
  description: 'Triggers when a ticket is updated',
  props: {
    auth: ticketingAuth,
    project_id: cmTicketCommon.project_id,
    status: cmTicketCommon.status_filter
  },
  sampleData: {
    id: '1234567890',
    title: 'Updated Ticket Title',
    description: 'This is an updated ticket description',
    status: 'in_progress',
    severity: 'high',
    created_at: '2025-03-19T12:00:00.000Z',
    updated_at: '2025-03-19T12:30:00.000Z',
    reporter: 'user123',
    assignee: 'user789',
    source: 'manual',
    project_id: '7890123456',
    tags: ['bug', 'frontend', 'priority'],
    changes: {
      status: {
        old: 'new',
        new: 'in_progress'
      },
      assignee: {
        old: 'user456',
        new: 'user789'
      }
    }
  },
  type: 'webhook',
  async onEnable(context) {
    const { auth, project_id, status } = context.propsValue;
    const body: Record<string, unknown> = {
      name: `Ticket Updated ${context.webhookUrl}`,
      event_type: 'TICKET_UPDATED',
      url: context.webhookUrl
    };
    
    if (status) {
      body.filters = {
        status_changed_to: status
      };
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${auth.baseUrl}/v1/ce/projects/${project_id}/webhooks`,
      body,
      headers: {
        Authorization: `Bearer ${auth.apiKey}`
      }
    });
    return {
      webhookId: response.body.id
    };
  },
  async onDisable(context) {
    const { auth, project_id } = context.propsValue;
    const webhookId = context.webhookId;
    await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `${auth.baseUrl}/v1/ce/projects/${project_id}/webhooks/${webhookId}`,
      headers: {
        Authorization: `Bearer ${auth.apiKey}`
      }
    });
  },
  async run(context) {
    return context.payload.body;
  }
});
```

#### 3.2 Ticket Action Pieces

```typescript
// packages/pieces/community/ticketing/src/lib/actions/create-ticket.ts
import { createAction } from '@activepieces/pieces-framework';
import { cmTicketCommon } from '../common';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { ticketingAuth } from '../auth';
import { Property } from '@activepieces/pieces-framework';

export const createTicketAction = createAction({
  name: 'create_ticket',
  displayName: 'Create Ticket',
  description: 'Creates a new ticket',
  props: {
    auth: ticketingAuth,
    project_id: cmTicketCommon.project_id,
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the ticket',
      required: true
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Detailed description of the ticket',
      required: true
    }),
    severity: Property.StaticDropdown({
      displayName: 'Severity',
      description: 'The severity level of the ticket',
      required: true,
      options: {
        options: [
          { label: 'Critical', value: 'critical' },
          { label: 'High', value: 'high' },
          { label: 'Medium', value: 'medium' },
          { label: 'Low', value: 'low' }
        ]
      }
    }),
    assignee: Property.ShortText({
      displayName: 'Assignee',
      description: 'User ID to assign the ticket to (defaults to the creator if not specified)',
      required: false
    }),
    due_date: Property.DateTime({
      displayName: 'Due Date',
      description: 'Due date for the ticket',
      required: false
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags for categorizing the ticket',
      required: false
    }),
    source: Property.ShortText({
      displayName: 'Source',
      description: 'Source of the ticket (defaults to "flow")',
      required: false,
      defaultValue: 'flow'
    })
  },
  async run(context) {
    const { auth, project_id, title, description, severity, assignee, due_date, tags, source } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${auth.baseUrl}/v1/ce/projects/${project_id}/tickets`,
      body: {
        title,
        description,
        severity,
        assignee,
        due_date,
        tags,
        source: source || 'flow'
      },
      headers: {
        Authorization: `Bearer ${auth.apiKey}`
      }
    });

    return response.body;
  }
});
```

```typescript
// packages/pieces/community/ticketing/src/lib/actions/update-ticket.ts
import { createAction } from '@activepieces/pieces-framework';
import { cmTicketCommon } from '../common';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { ticketingAuth } from '../auth';
import { Property } from '@activepieces/pieces-framework';

export const updateTicketAction = createAction({
  name: 'update_ticket',
  displayName: 'Update Ticket',
  description: 'Updates an existing ticket',
  props: {
    auth: ticketingAuth,
    project_id: cmTicketCommon.project_id,
    ticket_id: Property.ShortText({
      displayName: 'Ticket ID',
      description: 'ID of the ticket to update',
      required: true
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the ticket',
      required: false
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Detailed description of the ticket',
      required: false
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'The status of the ticket',
      required: false,
      options: {
        options: [
          { label: 'New', value: 'new' },
          { label: 'Acknowledged', value: 'acknowledged' },
          { label: 'In Progress', value: 'in_progress' },
          { label: 'Resolved', value: 'resolved' },
          { label: 'Closed', value: 'closed' },
          { label: 'Deferred', value: 'deferred' },
          { label: 'Canceled', value: 'canceled' }
        ]
      }
    }),
    severity: Property.StaticDropdown({
      displayName: 'Severity',
      description: 'The severity level of the ticket',
      required: false,
      options: {
        options: [
          { label: 'Critical', value: 'critical' },
          { label: 'High', value: 'high' },
          { label: 'Medium', value: 'medium' },
          { label: 'Low', value: 'low' }
        ]
      }
    }),
    assignee: Property.ShortText({
      displayName: 'Assignee',
      description: 'User ID to assign the ticket to',
      required: false
    }),
    due_date: Property.DateTime({
      displayName: 'Due Date',
      description: 'Due date for the ticket',
      required: false
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags for categorizing the ticket',
      required: false
    })
  },
  async run(context) {
    const { 
      auth, 
      project_id,
      ticket_id, 
      title, 
      description, 
      status,
      severity, 
      assignee, 
      due_date, 
      tags 
    } = context.propsValue;

    // Build update object with only defined fields
    const updateData: Record<string, unknown> = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (severity !== undefined) updateData.severity = severity;
    if (assignee !== undefined) updateData.assignee = assignee;
    if (due_date !== undefined) updateData.due_date = due_date;
    if (tags !== undefined) updateData.tags = tags;

    const response = await httpClient.sendRequest({
      method: HttpMethod.PATCH,
      url: `${auth.baseUrl}/v1/ce/projects/${project_id}/tickets/${ticket_id}`,
      body: updateData,
      headers: {
        Authorization: `Bearer ${auth.apiKey}`
      }
    });

    return response.body;
  }
});
```

```typescript
// packages/pieces/community/ticketing/src/lib/actions/add-comment.ts
import { createAction } from '@activepieces/pieces-framework';
import { cmTicketCommon } from '../common';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { ticketingAuth } from '../auth';
import { Property } from '@activepieces/pieces-framework';

export const addCommentAction = createAction({
  name: 'add_comment',
  displayName: 'Add Comment',
  description: 'Adds a comment to an existing ticket',
  props: {
    auth: ticketingAuth,
    project_id: cmTicketCommon.project_id,
    ticket_id: Property.ShortText({
      displayName: 'Ticket ID',
      description: 'ID of the ticket to comment on',
      required: true
    }),
    comment: Property.LongText({
      displayName: 'Comment',
      description: 'The comment text to add',
      required: true
    })
  },
  async run(context) {
    const { auth, project_id, ticket_id, comment } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${auth.baseUrl}/v1/ce/projects/${project_id}/tickets/${ticket_id}/comment`,
      body: {
        comment
      },
      headers: {
        Authorization: `Bearer ${auth.apiKey}`
      }
    });

    return response.body;
  }
});
```

### 4. Webhook System for Flow Integration

To support triggers in Activepieces flows, we need to implement a webhook system:

```typescript
// cm_ticket_webhook.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity({ name: 'cm_ticket_webhook' })
export class CmTicketWebhookEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  project_id: string;

  @Column()
  name: string;
  
  @Column()
  event_type: string;

  @Column()
  url: string;

  @Column('jsonb', { nullable: true })
  filters: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;
}
```

```typescript
// cm_ticket_webhook.service.ts
import { CmTicketWebhookEntity } from './cm_ticket_webhook.entity';
import { DatabaseService } from '../../database/database.service';
import { ApId } from '../helper/id-generator';
import { ActivepiecesError, ErrorCode } from '@activepieces/shared';
import axios from 'axios';

export class CmTicketWebhookService {
  static async create(
    projectId: string,
    params: {
      name: string;
      event_type: string;
      url: string;
      filters?: Record<string, any>;
    }
  ): Promise<CmTicketWebhookEntity> {
    const dbService = await DatabaseService.getInstance();
    
    const webhook: Partial<CmTicketWebhookEntity> = {
      id: ApId.create(),
      project_id: projectId,
      name: params.name,
      event_type: params.event_type,
      url: params.url,
      filters: params.filters || {},
    };

    return await dbService.getEntityManager().save(CmTicketWebhookEntity, webhook);
  }

  static async delete(
    id: string,
    projectId: string
  ): Promise<void> {
    const dbService = await DatabaseService.getInstance();
    await dbService.getEntityManager().delete(CmTicketWebhookEntity, {
      id,
      project_id: projectId,
    });
  }

  static async findForEvent(
    projectId: string,
    eventType: string,
    eventData: any
  ): Promise<CmTicketWebhookEntity[]> {
    const dbService = await DatabaseService.getInstance();
    const webhooks = await dbService.getEntityManager().find(CmTicketWebhookEntity, {
      where: {
        project_id: projectId,
        event_type: eventType,
      },
    });

    // Filter webhooks by their filter criteria
    return webhooks.filter((webhook) => {
      if (!webhook.filters || Object.keys(webhook.filters).length === 0) {
        return true;
      }

      // Apply filters based on webhook.filters and eventData
      // Example: Check if status_changed_to filter matches
      if (
        webhook.filters.status_changed_to &&
        eventData.changes?.status?.new === webhook.filters.status_changed_to
      ) {
        return true;
      }

      // Add more filter logic as needed
      return false;
    });
  }

  static async triggerWebhooks(
    webhooks: CmTicketWebhookEntity[],
    payload: any
  ): Promise<void> {
    const promises = webhooks.map(async (webhook) => {
      try {
        await axios.post(webhook.url, payload, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        // Log webhook delivery failure but don't throw
        console.error(`Failed to deliver webhook ${webhook.id} to ${webhook.url}:`, error);
      }
    });

    await Promise.all(promises);
  }
}
```

### 5. Application Module Registration

```typescript
// cm_ticket.module.ts
import { FastifyInstance } from 'fastify';
import { cmTicketController } from './cm_ticket.controller';
import { cmTicketWebhookController } from './cm_ticket_webhook.controller';

export const cmTicketModule = async (app: FastifyInstance): Promise<void> => {
  await app.register(cmTicketController);
  await app.register(cmTicketWebhookController);
};
```

### 6. Frontend Components

While the backend implementation is detailed above, we'll also need to create frontend components to interact with the ticket system. Key components would include:

1. Ticket List View
2. Ticket Detail View
3. Ticket Creation Form
4. Ticket Edit Form
5. Comment Section

The frontend implementation would follow the Commons Edition code guide with proper prefixing (e.g., `cm-ticket-list.component.ts`).

## Implementation Timeline

The complete implementation of the ticketing feature is estimated to take approximately 3-4 weeks, broken down as follows:

### Week 1: Database and Core Backend
- Days 1-2: Setup database schema and migrations
- Days 3-4: Implement core ticket service and repository
- Day 5: Implement history tracking and comments functionality

### Week 2: API Endpoints and Flow Integration
- Days 1-2: Implement REST API controllers and endpoints
- Days 3-4: Create webhook system for flow integration
- Day 5: Implement attachment handling

### Week 3: Flow Pieces and Frontend
- Days 1-2: Implement trigger and action pieces for Activepieces flows
- Days 3-5: Create core frontend components (list and detail views)

### Week 4: UI Refinement and Testing
- Days 1-2: Implement ticket creation and editing UI
- Days 3-4: Add filtering, sorting, and search capabilities
- Day 5: Testing, bug fixing, and documentation

## Testing Strategy

1. **Unit Tests**: Create unit tests for service methods, focusing on:
   - Ticket CRUD operations
   - Status transitions
   - History tracking
   - Search and filtering

2. **Integration Tests**: Test the API endpoints and database interactions:
   - API response formats
   - Authentication and permissions
   - Webhook delivery system
   - File attachment handling

3. **Flow Integration Tests**: Verify that the ticketing pieces work correctly with Activepieces flows:
   - Trigger accuracy
   - Action execution
   - Data formatting

## Conclusion

The ticketing system implementation follows the Commons Edition code guide to maintain a clean separation from enterprise code. The feature provides comprehensive ticket management capabilities with full integration with Activepieces flows, allowing for powerful automation of ticket-related processes.

The system is designed to be flexible and extensible, with a solid foundation that can be enhanced with additional features in the future, such as SLA tracking, role-based access control, or integration with external systems.
