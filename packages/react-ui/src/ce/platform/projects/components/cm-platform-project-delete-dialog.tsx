import { ProjectId } from '@activepieces/shared';
import { TrashIcon } from '@radix-ui/react-icons'; 
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { cmPlatformProjectHooks } from '../hooks/cm-platform-project.hooks';
import { useState } from 'react';

type CmPlatformProjectDeleteDialogProps = {
  projectId: ProjectId | null;
  open: boolean;
  onClose: () => void;
};

export const CmPlatformProjectDeleteDialog = ({
  projectId,
  open,
  onClose
}: CmPlatformProjectDeleteDialogProps) => {
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteProjectMutation = cmPlatformProjectHooks.useCmDeleteProject();
  
  const handleDelete = async () => {
    if (!projectId) return;
    
    setIsDeleting(true);
    try {
      await deleteProjectMutation.mutateAsync(projectId);
      onClose();
    } catch (error) {
      console.error('Failed to delete project:', error);
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) onClose();
    }}>
      <DialogContent className="cm-delete-dialog sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('Delete Project')}</DialogTitle>
          <DialogDescription>
            {t('Are you sure you want to delete this project? This action cannot be undone. All associated data, including flows, connections, and runs will be permanently removed.')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="cm-delete-warning mt-2 p-3 bg-red-50 border border-red-100 rounded-md">
          <p className="text-red-600 text-sm">
            {t('Warning: This is a destructive action that will delete all data associated with this project.')}
          </p>
        </div>
        
        <DialogFooter className="gap-2 mt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            disabled={isDeleting}
          >
            {t('Cancel')}
          </Button>
          <Button 
            type="button" 
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="cm-delete-button"
          >
            {isDeleting ? t('Deleting...') : t('Delete Project')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
