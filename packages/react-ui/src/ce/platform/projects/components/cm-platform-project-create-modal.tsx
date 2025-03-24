import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cmPlatformProjectHooks } from '../hooks/cm-platform-project.hooks';
import { NotificationStatus } from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

type CmPlatformProjectCreateModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const projectFormSchema = z.object({
  displayName: z.string()
    .min(1, { message: 'Project name is required' })
    .max(64, { message: 'Project name must be 64 characters or less' }),
  externalId: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

export const CmPlatformProjectCreateModal = ({
  isOpen,
  onClose
}: CmPlatformProjectCreateModalProps) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createProjectMutation = cmPlatformProjectHooks.useCmCreateProject();
  
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      displayName: '',
      externalId: '',
    },
  });
  
  const handleSubmit = async (values: ProjectFormValues) => {
    setIsSubmitting(true);
    try {
      await createProjectMutation.mutateAsync({
        displayName: values.displayName,
        externalId: values.externalId || undefined,
        notifyStatus: NotificationStatus.ALWAYS,
      });
      form.reset();
      onClose();
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleClose = () => {
    form.reset();
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(isOpen) => {
      if (!isOpen) handleClose();
    }}>
      <DialogContent className="cm-create-dialog sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('Create New Project')}</DialogTitle>
          <DialogDescription>
            {t('Create a new project with isolated resources and settings.')}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Project Name')}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t('Enter project name')} 
                      {...field} 
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="externalId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('External ID')} <span className="text-sm text-gray-500">({t('Optional')})</span></FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('Enter external ID')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={isSubmitting}
              >
                {t('Cancel')}
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting || !form.formState.isValid}
                className="cm-create-button"
              >
                {isSubmitting ? t('Creating...') : t('Create Project')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
