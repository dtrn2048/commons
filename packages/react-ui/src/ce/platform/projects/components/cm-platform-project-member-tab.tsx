import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ProjectId } from '@activepieces/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusIcon } from '@radix-ui/react-icons';

type CmPlatformProjectMemberTabProps = {
  projectId: ProjectId;
};

export const CmPlatformProjectMemberTab = ({ projectId }: CmPlatformProjectMemberTabProps) => {
  const { t } = useTranslation();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  
  // In a real implementation, we would fetch members data here
  const members = []; // Placeholder for member data
  
  return (
    <div className="cm-members-tab">
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t('Project Members')}</CardTitle>
            <CardDescription>{t('Users with access to this project')}</CardDescription>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setIsInviteModalOpen(true)}
            className="cm-invite-button"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            {t('Invite Member')}
          </Button>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="cm-empty-state text-center p-8">
              <h3 className="text-lg font-medium mb-2">{t('No additional members')}</h3>
              <p className="text-gray-500 mb-4">
                {t('This project currently has no additional members. Invite users to collaborate.')}
              </p>
            </div>
          ) : (
            <div className="cm-members-list">
              {/* Member list would go here if we had real data */}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* In a real implementation, we would include an invite modal component */}
      {/* <CmPlatformProjectMemberInviteModal 
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        projectId={projectId}
      /> */}
    </div>
  );
};
