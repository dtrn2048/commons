import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProjectWithLimits, ProjectId } from '@activepieces/shared';
import { useTranslation } from 'react-i18next';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { cmPlatformProjectHooks } from '../hooks/cm-platform-project.hooks';
import { 
  DotsVerticalIcon,
  Pencil1Icon,
  TrashIcon
} from '@radix-ui/react-icons';
import { CmPlatformProjectDeleteDialog } from './cm-platform-project-delete-dialog';

type CmPlatformProjectTableProps = {
  projects: ProjectWithLimits[];
  isLoading: boolean;
  cursor?: string | null;
};

export const CmPlatformProjectTable = ({
  projects,
  isLoading,
  cursor
}: CmPlatformProjectTableProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [projectToDelete, setProjectToDelete] = useState<ProjectId | null>(null);
  
  const handleViewProject = (id: ProjectId) => {
    navigate(`/platform/ce-projects/${id}`);
  };

  const handleEditProject = (id: ProjectId) => {
    navigate(`/platform/ce-projects/${id}/edit`);
  };

  if (isLoading) {
    return (
      <div className="cm-loading-container p-8 text-center">
        <div className="cm-loading-spinner"></div>
        <p>{t('Loading projects...')}</p>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="cm-empty-state p-8 border rounded-md text-center">
        <h2 className="text-lg font-medium mb-2">{t('No projects found')}</h2>
        <p className="text-gray-500">
          {t('No projects match your search or no projects exist yet.')}
        </p>
      </div>
    );
  }

  return (
    <>
      <Table className="cm-table">
        <TableHeader>
          <TableRow>
            <TableHead className="w-1/4">{t('Name')}</TableHead>
            <TableHead className="w-1/4">{t('External ID')}</TableHead>
            <TableHead className="w-1/4">{t('Created')}</TableHead>
            <TableHead className="w-1/4">{t('Status')}</TableHead>
            <TableHead className="w-[60px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow 
              key={project.id} 
              className="cm-table-row cursor-pointer"
              onClick={() => handleViewProject(project.id)}
            >
              <TableCell className="font-medium">{project.displayName}</TableCell>
              <TableCell>{project.externalId || '-'}</TableCell>
              <TableCell>
                {new Date(project.created).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <div className={`cm-status-badge cm-status-active`}>
                  {t('Active')}
                </div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">{t('Open menu')}</span>
                      <DotsVerticalIcon className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      handleEditProject(project.id);
                    }}>
                      <Pencil1Icon className="mr-2 h-4 w-4" />
                      <span>{t('Edit')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-red-600 focus:text-red-700" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setProjectToDelete(project.id);
                      }}
                    >
                      <TrashIcon className="mr-2 h-4 w-4" />
                      <span>{t('Delete')}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {cursor && (
        <div className="cm-load-more mt-4 text-center">
          <Button variant="outline" onClick={() => {
            // Load more implementation would go here
            // It would require updating the hook to handle pagination
          }}>
            {t('Load More')}
          </Button>
        </div>
      )}
      
      <CmPlatformProjectDeleteDialog
        projectId={projectToDelete}
        open={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
      />
    </>
  );
};
