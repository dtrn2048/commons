import { t } from 'i18next';

import { flagsHooks } from '@/hooks/flags-hooks';

const FullLogo = () => {
  const branding = flagsHooks.useWebsiteBranding();

  return (
    <div className="h-[35px] flex items-center justify-center">
      <img
        className="h-[35px] w-auto"
        src={branding.logos.fullLogoUrl}
        alt={t('logo')}
      />
    </div>
  );
};
FullLogo.displayName = 'FullLogo';
export { FullLogo };
