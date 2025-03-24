import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ProjectWithLimits } from '@activepieces/shared';
import { useTranslation } from 'react-i18next';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

type CmPlatformProjectEditFormProps = {
  project: ProjectWithLimits;
  onSubmit: (values: { displayName: string; externalId?: string }) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
};

const projectFormSchema = z.object({
  displayName: z.string()
    .min(1, { message: 'Project name is required' })
    .max(64, { message: 'Project name must be 64 characters or less' }),
  externalId: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

export const CmPlatformProjectEditForm = ({
  project,
  onSubmit,
  onCancel,
  isSubmitting
}: CmPlatformProjectEditFormProps) => {
  const { t } = useTranslation();
  
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      displayName: project.displayName,
      externalId: project.externalId || '',
    },
  });
  
  const handleSubmit = async (values: ProjectFormValues) => {
    await onSubmit({
      displayName: values.displayName,
      externalId: values.externalId || undefined,
    });
  };
  
  return (
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
        
        <div className="flex justify-end gap-2 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {t('Cancel')}
          </Button>
          <Button 
            type="submit"
            disabled={isSubmitting || !form.formState.isValid}
            className="cm-save-button"
          >
            {isSubmitting ? t('Saving...') : t('Save Changes')}
          </Button>
        </div>
      </form>
    </Form>
  );
};
