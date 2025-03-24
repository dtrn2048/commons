import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cmPlatformProjectHooks } from '../hooks/cm-platform-project.hooks';
import { CmPlatformProjectDetailsTab } from './cm-platform-project-details-tab';
import { CmPlatformProjectUsageTab } from './cm-platform-project-usage-tab';
import { CmPlatformProjectMemberTab } from './cm-platform-project-member-tab';
import { ArrowLeftIcon, TrashIcon } from '@radix-ui/react-icons';
import { CmPlatformProjectDeleteDialog } from './cm-platform-project-delete-dialog';
import { ProjectId } from '@activepieces/shared';

export const CmPlatformProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const projectId = id as ProjectId;
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  
  const { data: project, isLoading, isError } = cmPlatformProjectHooks.useCmProject(projectId);
  
  const handleNavigateBack = () => {
    navigate('/platform/ce-projects');
  };
  
  if (isLoading) {
    return (
      <div className="cm-loading-container p-8 text-center">
        <div className="cm-loading-spinner"></div>
        <p>{t('Loading project details...')}</p>
      </div>
    );
  }
  
  if (isError || !project) {
    return (
      <div className="cm-error-container p-8 text-center">
        <h2 className="text-lg font-medium text-red-500 mb-2">
          {t('Error loading project')}
        </h2>
        <p className="mb-4">{t('The requested project could not be found or there was an error loading it.')}</p>
        <Button onClick={handleNavigateBack} variant="outline">
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          {t('Back to Projects')}
        </Button>
      </div>
    );
  }
  
  return (
    <div className="cm-container p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={handleNavigateBack}
            className="flex items-center text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            <span>{t('Back to Projects')}</span>
          </button>
          <h1 className="text-2xl font-bold">{project.displayName}</h1>
          {project.externalId && (
            <p className="text-sm text-gray-500">
              {t('External ID')}: {project.externalId}
            </p>
          )}
        </div>
        
        <Button
          variant="destructive"
          onClick={() => setIsDeleteDialogOpen(true)}
          className="cm-delete-button"
        >
          <TrashIcon className="h-4 w-4 mr-2" />
          {t('Delete Project')}
        </Button>
      </div>
      
      {/* Project Info */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="cm-info-card p-4 border rounded-md bg-white shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">{t('Created')}</h3>
          <p className="mt-1 font-medium">
            {new Date(project.created).toLocaleDateString()} 
            {' '}
            {new Date(project.created).toLocaleTimeString()}
          </p>
        </div>
        
        <div className="cm-info-card p-4 border rounded-md bg-white shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">{t('Status')}</h3>
          <p className="mt-1 font-medium">
            <span className="cm-status-badge cm-status-active">{t('Active')}</span>
          </p>
        </div>
        
        <div className="cm-info-card p-4 border rounded-md bg-white shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">{t('Owner')}</h3>
          <p className="mt-1 font-medium">
            {project.ownerId}
          </p>
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="cm-tabs">
        <TabsList className="mb-4">
          <TabsTrigger value="details">{t('Details')}</TabsTrigger>
          <TabsTrigger value="usage">{t('Usage')}</TabsTrigger>
          <TabsTrigger value="members">{t('Members')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="mt-0">
          <CmPlatformProjectDetailsTab project={project} />
        </TabsContent>
        
        <TabsContent value="usage" className="mt-0">
          <CmPlatformProjectUsageTab project={project} />
        </TabsContent>
        
        <TabsContent value="members" className="mt-0">
          <CmPlatformProjectMemberTab projectId={project.id} />
        </TabsContent>
      </Tabs>
      
      {/* Delete Dialog */}
      <CmPlatformProjectDeleteDialog
        projectId={isDeleteDialogOpen ? projectId : null}
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
      />
    </div>
  );
};
