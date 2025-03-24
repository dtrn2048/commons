import { FastifyInstance, FastifyRequest } from 'fastify'
import {
    ActivepiecesError,
    ErrorCode,
    PlatformRole,
    ProjectId,
} from '@activepieces/shared'

import { cmPlatformProjectService, CmCreateProjectRequest, CmUpdateProjectRequest } from './cm-platform-project.service'
import { platformService } from '../../platform/platform.service'
import { userService } from '../../user/user-service'

// Simple query params schema for projects listing
const ListProjectsSchema = {
    querystring: {
        type: 'object',
        properties: {
            limit: { type: 'number' },
            cursor: { type: 'string' },
            displayName: { type: 'string' },
        },
    },
}

type ListProjectsRequest = FastifyRequest<{
    Querystring: {
        limit?: number
        cursor?: string
        displayName?: string
    }
}>

const GetProjectRequest = {
    params: {
        type: 'object',
        required: ['id'],
        properties: {
            id: { type: 'string' },
        },
    },
}

type GetProjectRequest = FastifyRequest<{
    Params: {
        id: ProjectId
    }
}>

const CreateProjectSchema = {
    body: {
        type: 'object',
        required: ['displayName'],
        properties: {
            displayName: { type: 'string' },
            externalId: { type: 'string' },
            notifyStatus: { 
                type: 'string',
                enum: ['NEVER', 'ALWAYS', 'NEW_ISSUE'],
            },
        },
    },
}

type CreateProjectRequest = FastifyRequest<{
    Body: Omit<CmCreateProjectRequest, 'ownerId' | 'platformId'>
}>

const UpdateProjectSchema = {
    params: {
        type: 'object',
        required: ['id'],
        properties: {
            id: { type: 'string' },
        },
    },
    body: {
        type: 'object',
        properties: {
            displayName: { type: 'string' },
            externalId: { type: 'string' },
            notifyStatus: { 
                type: 'string',
                enum: ['NEVER', 'ALWAYS', 'NEW_ISSUE'],
            },
        },
    },
}

type UpdateProjectRequest = FastifyRequest<{
    Params: {
        id: ProjectId
    }
    Body: CmUpdateProjectRequest
}>

export const cmPlatformProjectController = async (fastify: FastifyInstance) => {
    fastify.register(async (router) => {
        router.get('/', {
            schema: ListProjectsSchema,
        }, listProjects)

        router.get('/:id', {
            schema: GetProjectRequest,
        }, getProject)
        
        router.post('/', {
            schema: CreateProjectSchema,
        }, createProject)

        router.patch('/:id', {
            schema: UpdateProjectSchema,
        }, updateProject)
        
        router.delete('/:id', {
            schema: GetProjectRequest,
        }, deleteProject)
    }, { prefix: '/v1/ce/platform/projects' })
}

// Helper function to verify platform admin
async function isPlatformAdmin(request: FastifyRequest): Promise<boolean> {
    const user = await userService.getOneOrFail({
        id: request.principal.id,
    })

    return user.platformRole === PlatformRole.ADMIN
}

// Helper to get platform ID
async function getPlatformId(request: FastifyRequest): Promise<string> {
    const user = await userService.getOneOrFail({
        id: request.principal.id,
    })
    
    if (!user.platformId) {
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: {
                entityType: 'platform',
                message: 'User does not belong to a platform',
            },
        })
    }

    return user.platformId
}

const listProjects = async (request: ListProjectsRequest) => {
    // Check if the user is a platform admin
    const isAdmin = await isPlatformAdmin(request)
    if (!isAdmin) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {
                message: 'Only platform admins can access this resource',
            },
        })
    }

    const platformId = await getPlatformId(request)
    const projects = await cmPlatformProjectService.list(platformId)
    
    return {
        data: projects,
        cursor: null, // CE implementation uses simplified pagination (no cursor)
    }
}

const getProject = async (request: GetProjectRequest) => {
    // Check if user is platform admin
    const isAdmin = await isPlatformAdmin(request)
    if (!isAdmin) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {
                message: 'Only platform admins can access this resource',
            },
        })
    }

    const projectId = request.params.id
    const project = await cmPlatformProjectService.getById(projectId)

    if (!project) {
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: {
                entityId: projectId,
                entityType: 'project',
            },
        })
    }

    return project
}

const createProject = async (request: CreateProjectRequest) => {
    // Check if user is platform admin
    const isAdmin = await isPlatformAdmin(request)
    if (!isAdmin) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {
                message: 'Only platform admins can access this resource',
            },
        })
    }

    const platformId = await getPlatformId(request)

    // Validate platform exists
    const platform = await platformService.getOneOrThrow(platformId)

    const project = await cmPlatformProjectService.create({
        ownerId: request.principal.id,
        platformId,
        displayName: request.body.displayName,
        externalId: request.body.externalId,
        notifyStatus: request.body.notifyStatus,
    })

    return project
}

const updateProject = async (request: UpdateProjectRequest) => {
    // Check if user is platform admin
    const isAdmin = await isPlatformAdmin(request)
    if (!isAdmin) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {
                message: 'Only platform admins can access this resource',
            },
        })
    }

    const projectId = request.params.id
    const updatedProject = await cmPlatformProjectService.update(projectId, {
        displayName: request.body.displayName,
        externalId: request.body.externalId,
        notifyStatus: request.body.notifyStatus,
    })

    return updatedProject
}

const deleteProject = async (request: GetProjectRequest) => {
    // Check if user is platform admin
    const isAdmin = await isPlatformAdmin(request)
    if (!isAdmin) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {
                message: 'Only platform admins can access this resource',
            },
        })
    }

    const projectId = request.params.id
    await cmPlatformProjectService.delete(projectId)

    return {
        success: true,
    }
}
