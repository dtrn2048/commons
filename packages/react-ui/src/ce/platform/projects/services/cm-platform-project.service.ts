import axios from 'axios';
import { NotificationStatus, ProjectId, ProjectWithLimits } from '@activepieces/shared';
import { authenticationSession } from '@/lib/authentication-session';

// Using absolute URL to bypass proxy issues during development
const CM_API_BASE_URL = 'http://localhost:3000/v1/ce/platform/projects';

// Create axios instance with auth header
const axiosInstance = axios.create();

// Add a request interceptor to include the auth token
axiosInstance.interceptors.request.use((config) => {
  const token = authenticationSession.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export type CmCreateProjectRequest = {
  displayName: string;
  externalId?: string;
  notifyStatus?: NotificationStatus;
};

export type CmUpdateProjectRequest = {
  displayName?: string;
  externalId?: string;
  notifyStatus?: NotificationStatus;
};

export type CmProjectResponse = {
  data: ProjectWithLimits[];
  cursor: string | null;
};

export const cmPlatformProjectService = {
  list: async (params?: {
    limit?: number;
    cursor?: string;
    displayName?: string;
  }): Promise<CmProjectResponse> => {
    const response = await axiosInstance.get(CM_API_BASE_URL, { params });
    return response.data;
  },

  getById: async (id: ProjectId): Promise<ProjectWithLimits> => {
    const response = await axiosInstance.get(`${CM_API_BASE_URL}/${id}`);
    return response.data;
  },

  create: async (request: CmCreateProjectRequest): Promise<ProjectWithLimits> => {
    const response = await axiosInstance.post(CM_API_BASE_URL, request);
    return response.data;
  },

  update: async (id: ProjectId, request: CmUpdateProjectRequest): Promise<ProjectWithLimits> => {
    const response = await axiosInstance.patch(`${CM_API_BASE_URL}/${id}`, request);
    return response.data;
  },

  delete: async (id: ProjectId): Promise<void> => {
    await axiosInstance.delete(`${CM_API_BASE_URL}/${id}`);
  },
};
