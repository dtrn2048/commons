import { t } from 'i18next';
import { LayoutIcon } from '@radix-ui/react-icons';

export const cmPlatformProjectsSidebarItem = {
  type: 'link' as const,
  to: '/platform/ce-projects',
  label: t('Projects'),
  icon: LayoutIcon,
  isSubItem: false,
};
