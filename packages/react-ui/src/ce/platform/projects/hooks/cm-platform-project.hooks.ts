import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { NotificationStatus, ProjectId, ProjectWithLimits } from '@activepieces/shared';
import { cmPlatformProjectService, CmCreateProjectRequest, CmUpdateProjectRequest } from '../services/cm-platform-project.service';
import { useToast } from '@/components/ui/use-toast';
import { t } from 'i18next';
import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authenticationSession } from '@/lib/authentication-session';

const CM_CURRENT_PROJECT_KEY = 'cm_current_project';

export const cmPlatformProjectHooks = {
  useCmCurrentProject: () => {
    const { data: cmProjects } = cmPlatformProjectHooks.useCmProjects();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const getCmCurrentProject = useCallback(() => {
      if (!cmProjects?.data || cmProjects.data.length === 0) {
        return null;
      }

      try {
        const storedProjectId = localStorage.getItem(CM_CURRENT_PROJECT_KEY);
        if (storedProjectId) {
          const foundProject = cmProjects.data.find(
            (project) => project.id === storedProjectId
          );
          if (foundProject) {
            return foundProject;
          }
        }
      } catch (error) {
        console.error('Error accessing localStorage:', error);
      }

      // Default to first project if no saved project found
      return cmProjects.data[0];
    }, [cmProjects]);

    const setCmCurrentProject = useCallback(
      async (queryClient: any, project: ProjectWithLimits, currentPath: string) => {
        try {
          localStorage.setItem(CM_CURRENT_PROJECT_KEY, project.id);
          queryClient.invalidateQueries({ queryKey: ['cm_current_project'] });
          
          // Switch to this project session
          await authenticationSession.switchToSession(project.id);
          
          // Navigate to the project using URL replacement
          if (currentPath.includes('/projects/')) {
            const pathNameWithNewProjectId = currentPath.replace(
              /\/projects\/[^/]+/,
              `/projects/${project.id}`
            );
            window.location.href = pathNameWithNewProjectId;
          }
        } catch (error) {
          console.error('Error setting current project:', error);
        }
      },
      [navigate]
    );

    return {
      data: cmProjects ? getCmCurrentProject() : undefined,
      setCurrentProject: setCmCurrentProject,
    };
  },

  useCmProjects: (params?: {
    limit?: number;
    cursor?: string;
    displayName?: string;
  }) => {
    return useQuery({
      queryKey: ['cm-projects', params],
      queryFn: () => cmPlatformProjectService.list(params),
    });
  },

  useCmProject: (projectId: ProjectId | undefined) => {
    return useQuery({
      queryKey: ['cm-project', projectId],
      queryFn: () => 
        projectId ? cmPlatformProjectService.getById(projectId) : Promise.resolve(null),
      enabled: !!projectId,
    });
  },

  useCmCreateProject: () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
      mutationFn: (request: CmCreateProjectRequest) => 
        cmPlatformProjectService.create(request),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['cm-projects'] });
        toast({
          title: t('Success'),
          description: t('Project created successfully'),
        });
      },
      onError: (error) => {
        toast({
          title: t('Error'),
          description: t('Failed to create project'),
          variant: 'destructive',
        });
        console.error('Create project error', error);
      },
    });
  },

  useCmUpdateProject: (projectId: ProjectId) => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
      mutationFn: (request: CmUpdateProjectRequest) => 
        cmPlatformProjectService.update(projectId, request),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['cm-projects'] });
        queryClient.invalidateQueries({ queryKey: ['cm-project', projectId] });
        toast({
          title: t('Success'),
          description: t('Project updated successfully'),
        });
      },
      onError: (error) => {
        toast({
          title: t('Error'),
          description: t('Failed to update project'),
          variant: 'destructive',
        });
        console.error('Update project error', error);
      },
    });
  },

  useCmDeleteProject: () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
      mutationFn: (projectId: ProjectId) => 
        cmPlatformProjectService.delete(projectId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['cm-projects'] });
        toast({
          title: t('Success'),
          description: t('Project deleted successfully'),
        });
      },
      onError: (error) => {
        toast({
          title: t('Error'),
          description: t('Failed to delete project'),
          variant: 'destructive',
        });
        console.error('Delete project error', error);
      },
    });
  },
};
