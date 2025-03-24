import { useState } from 'react';
import { ProjectWithLimits } from '@activepieces/shared';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Pencil1Icon } from '@radix-ui/react-icons';
import { cmPlatformProjectHooks } from '../hooks/cm-platform-project.hooks';
import { CmPlatformProjectEditForm } from './cm-platform-project-edit-form';

type CmPlatformProjectDetailsTabProps = {
  project: ProjectWithLimits;
};

export const CmPlatformProjectDetailsTab = ({ project }: CmPlatformProjectDetailsTabProps) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const updateProjectMutation = cmPlatformProjectHooks.useCmUpdateProject(project.id);
  
  const handleUpdateProject = async (values: {
    displayName: string;
    externalId?: string;
  }) => {
    try {
      await updateProjectMutation.mutateAsync({
        displayName: values.displayName,
        externalId: values.externalId,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update project:', error);
    }
  };
  
  return (
    <div className="cm-project-details">
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t('Project Information')}</CardTitle>
            <CardDescription>{t('Basic information about this project')}</CardDescription>
          </div>
          {!isEditing && (
            <Button 
              variant="outline" 
              onClick={() => setIsEditing(true)} 
              className="cm-edit-button"
            >
              <Pencil1Icon className="h-4 w-4 mr-2" />
              {t('Edit')}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <CmPlatformProjectEditForm
              project={project}
              onSubmit={handleUpdateProject}
              onCancel={() => setIsEditing(false)}
              isSubmitting={updateProjectMutation.isPending}
            />
          ) : (
            <dl className="cm-info-list grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">{t('Project Name')}</dt>
                <dd className="mt-1">{project.displayName}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">{t('External ID')}</dt>
                <dd className="mt-1">{project.externalId || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">{t('Created')}</dt>
                <dd className="mt-1">
                  {new Date(project.created).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">{t('Platform ID')}</dt>
                <dd className="mt-1">{project.platformId || '-'}</dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('Settings')}</CardTitle>
          <CardDescription>{t('Configuration and preferences for this project')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="cm-settings-list">
            <div className="cm-setting-item flex items-center justify-between py-3">
              <div>
                <h4 className="text-base font-medium">{t('Notification Status')}</h4>
                <p className="text-sm text-gray-500">{t('Control when notifications are sent for this project')}</p>
              </div>
              <div className="text-right">
                <span className="font-medium">{project.notifyStatus}</span>
              </div>
            </div>
            <div className="cm-setting-item flex items-center justify-between py-3 border-t">
              <div>
                <h4 className="text-base font-medium">{t('Releases Enabled')}</h4>
                <p className="text-sm text-gray-500">{t('Whether project releases functionality is enabled')}</p>
              </div>
              <div className="text-right">
                <span className="font-medium">{project.releasesEnabled ? t('Yes') : t('No')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
