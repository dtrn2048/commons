import {
    ActivepiecesError,
    apId,
    ErrorCode,
    NotificationStatus,
    PiecesFilterType,
    Project,
    ProjectId,
    ProjectPlan,
    ProjectUsage,
    ProjectWithLimits,
    UserId,
} from '@activepieces/shared'
import { IsNull } from 'typeorm'
import { projectRepo } from '../../project/project-service'

export type CmCreateProjectRequest = {
    ownerId: UserId
    displayName: string
    platformId: string
    externalId?: string
    notifyStatus?: NotificationStatus
}

export type CmUpdateProjectRequest = {
    displayName?: string
    externalId?: string
    notifyStatus?: NotificationStatus
}

export const cmPlatformProjectService = {
    async list(platformId: string): Promise<ProjectWithLimits[]> {
        const projects = await projectRepo().findBy({
            platformId,
            deleted: IsNull(),
        })

        return this.enrichProjectsWithLimits(projects)
    },

    async getById(projectId: ProjectId): Promise<ProjectWithLimits | null> {
        const project = await projectRepo().findOneBy({
            id: projectId,
            deleted: IsNull(),
        })
        
        if (!project) {
            return null
        }

        return this.enrichProjectWithLimits(project)
    },

    async create(params: CmCreateProjectRequest): Promise<ProjectWithLimits> {
        const newProject: Omit<Project, 'created' | 'updated' | 'deleted'> = {
            id: apId(),
            ownerId: params.ownerId,
            displayName: params.displayName,
            platformId: params.platformId,
            externalId: params.externalId,
            notifyStatus: params.notifyStatus ?? NotificationStatus.ALWAYS,
            releasesEnabled: false,
        }

        const createdProject = await projectRepo().save(newProject)
        return this.enrichProjectWithLimits(createdProject)
    },

    async update(projectId: ProjectId, params: CmUpdateProjectRequest): Promise<ProjectWithLimits> {
        const project = await projectRepo().findOneBy({
            id: projectId,
            deleted: IsNull(),
        })

        if (!project) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityId: projectId,
                    entityType: 'project',
                },
            })
        }

        await projectRepo().update(
            { id: projectId },
            {
                ...(params.displayName !== undefined && { displayName: params.displayName }),
                ...(params.externalId !== undefined && { externalId: params.externalId }),
                ...(params.notifyStatus !== undefined && { notifyStatus: params.notifyStatus }),
            }
        )

        const updatedProject = await projectRepo().findOneByOrFail({
            id: projectId,
            deleted: IsNull(),
        })

        return this.enrichProjectWithLimits(updatedProject)
    },

    async delete(projectId: ProjectId): Promise<void> {
        const project = await projectRepo().findOneBy({
            id: projectId,
            deleted: IsNull(),
        })

        if (!project) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityId: projectId,
                    entityType: 'project',
                },
            })
        }

        // Soft delete by setting deleted timestamp
        await projectRepo().update(
            { id: projectId },
            { deleted: new Date().toISOString() }
        )
    },

    async enrichProjectsWithLimits(projects: Project[]): Promise<ProjectWithLimits[]> {
        return Promise.all(projects.map(project => this.enrichProjectWithLimits(project)))
    },

    async enrichProjectWithLimits(project: Project): Promise<ProjectWithLimits> {
        // Create default plan for Community Edition with AI pieces enabled
        const defaultPlan: ProjectPlan = {
            id: `cm_default_plan_${project.id}`,
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            projectId: project.id,
            name: 'Community Plan',
            piecesFilterType: PiecesFilterType.NONE,
            pieces: [
                '@activepieces/piece-utility-ai',
                '@activepieces/piece-image-ai',
                '@activepieces/piece-text-ai'
            ],
            tasks: null, // Unlimited tasks in CE
            aiTokens: null, // Unlimited AI tokens in CE
        }

        // Create default usage stats
        const defaultUsage: ProjectUsage = {
            tasks: 0,
            teamMembers: 0,
            aiTokens: 0,
            nextLimitResetDate: new Date(
                new Date().getFullYear(),
                new Date().getMonth() + 1,
                1
            ).toISOString(),
        }

        // Create default analytics
        const defaultAnalytics = {
            totalUsers: 0,
            activeUsers: 0,
            totalFlows: 0,
            activeFlows: 0,
        }

        return {
            ...project,
            plan: defaultPlan,
            usage: defaultUsage,
            analytics: defaultAnalytics,
        }
    },
}
