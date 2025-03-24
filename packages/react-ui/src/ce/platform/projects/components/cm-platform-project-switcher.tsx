'use client';

import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import * as React from 'react';
import { useLocation } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import { ScrollArea } from '@/components/ui/scroll-area';
import { cmPlatformProjectHooks } from '../hooks/cm-platform-project.hooks';
import { ProjectWithLimits } from '@activepieces/shared';

export function CmPlatformProjectSwitcher() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { data: cmProjects } = cmPlatformProjectHooks.useCmProjects();
  const [cmOpen, setCmOpen] = React.useState(false);
  const { data: cmCurrentProject, setCurrentProject } = cmPlatformProjectHooks.useCmCurrentProject();

  const cmFilterProjects = React.useCallback(
    (projectId: string, search: string) => {
      // Radix UI lowercases the value string (projectId)
      const project = cmProjects?.data.find(
        (project) => project.id.toLowerCase() === projectId
      );
      
      if (!project) {
        return 0;
      }
      
      return project.displayName.toLowerCase().includes(search.toLowerCase())
        ? 1
        : 0;
    },
    [cmProjects]
  );

  // If there are no projects, don't render the switcher
  if (!cmProjects?.data || cmProjects.data.length === 0) {
    return null;
  }

  return (
    <Popover open={cmOpen} onOpenChange={setCmOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          size={'sm'}
          aria-expanded={cmOpen}
          aria-label="Select a project"
          className="gap-2 max-w-[200px] justify-between gap-10"
        >
          <div className="flex flex-col justify-start items-start">
            <span className="truncate">{cmCurrentProject?.displayName}</span>
          </div>
          <CaretSortIcon className="ml-auto size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="max-w-[200px] p-0">
        <Command filter={cmFilterProjects}>
          <CommandList>
            <CommandInput placeholder={t('Search project...')} />
            <CommandEmpty>{t('No projects found')}</CommandEmpty>
            <CommandGroup heading={t('Projects')}>
              <ScrollArea viewPortClassName="max-h-[200px]">
                {cmProjects.data.map((project: ProjectWithLimits) => (
                  <CommandItem
                    key={project.id}
                    onSelect={() => {
                      setCurrentProject(
                        queryClient,
                        project,
                        location.pathname
                      );
                      setCmOpen(false);
                    }}
                    value={project.id}
                    className="text-sm break-all"
                  >
                    {project.displayName}
                    <CheckIcon
                      className={cn(
                        'ml-auto h-4 w-4 shrink-0',
                        cmCurrentProject?.id === project.id
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                    />
                  </CommandItem>
                ))}
              </ScrollArea>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
