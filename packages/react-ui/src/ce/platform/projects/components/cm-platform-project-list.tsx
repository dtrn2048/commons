import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CmPlatformProjectTable } from './cm-platform-project-table';
import { CmPlatformProjectCreateModal } from './cm-platform-project-create-modal';
import { cmPlatformProjectHooks } from '../hooks/cm-platform-project.hooks';
import { useTranslation } from 'react-i18next';
import { PlusIcon } from '@radix-ui/react-icons';

export const CmPlatformProjectList = () => {
  const { t } = useTranslation();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  // Set up debounced search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  const { data: projectsData, isLoading, isError } = cmPlatformProjectHooks.useCmProjects({
    displayName: debouncedSearchTerm || undefined,
    limit: 10,
  });

  return (
    <div className="cm-container p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('Projects')}</h1>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="cm-button cm-primary-button"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          {t('Create Project')}
        </Button>
      </div>
      
      <div className="mb-4">
        <input
          type="text"
          placeholder={t('Search projects...')}
          className="px-4 py-2 border rounded-md w-full max-w-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {isError ? (
        <div className="text-red-500 p-4 border border-red-300 rounded-md">
          {t('Failed to load projects. Please try again.')}
        </div>
      ) : (
        <CmPlatformProjectTable 
          projects={projectsData?.data || []} 
          isLoading={isLoading}
          cursor={projectsData?.cursor}
        />
      )}
      
      <CmPlatformProjectCreateModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};
