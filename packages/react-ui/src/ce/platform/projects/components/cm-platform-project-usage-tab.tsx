import { ProjectWithLimits } from '@activepieces/shared';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type CmPlatformProjectUsageTabProps = {
  project: ProjectWithLimits;
};

export const CmPlatformProjectUsageTab = ({ project }: CmPlatformProjectUsageTabProps) => {
  const { t } = useTranslation();
  
  // Extract plan and usage values from project
  const { plan, usage, analytics } = project;
  
  return (
    <div className="cm-usage-tab">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('Usage & Analytics')}</CardTitle>
          <CardDescription>{t('Current usage metrics for this project')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="cm-usage-metrics space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="cm-stat-card p-4 border rounded-md">
                <h4 className="text-sm font-medium text-gray-500">{t('Tasks Used')}</h4>
                <p className="text-2xl font-bold mt-2">{usage.tasks.toLocaleString()}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {plan.tasks === null ? t('Unlimited') :
                    plan.tasks ? t('Limit: {{limit}}', { limit: plan.tasks.toLocaleString() }) :
                    t('No limit set')}
                </p>
              </div>
              
              <div className="cm-stat-card p-4 border rounded-md">
                <h4 className="text-sm font-medium text-gray-500">{t('Team Members')}</h4>
                <p className="text-2xl font-bold mt-2">{usage.teamMembers.toLocaleString()}</p>
              </div>
              
              <div className="cm-stat-card p-4 border rounded-md">
                <h4 className="text-sm font-medium text-gray-500">{t('AI Tokens Used')}</h4>
                <p className="text-2xl font-bold mt-2">{usage.aiTokens.toLocaleString()}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {plan.aiTokens === null ? t('Unlimited') :
                    plan.aiTokens ? t('Limit: {{limit}}', { limit: plan.aiTokens.toLocaleString() }) :
                    t('No limit set')}
                </p>
              </div>
              
              <div className="cm-stat-card p-4 border rounded-md">
                <h4 className="text-sm font-medium text-gray-500">{t('Next Reset Date')}</h4>
                <p className="text-xl font-bold mt-2">
                  {new Date(usage.nextLimitResetDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('Project Analytics')}</CardTitle>
          <CardDescription>{t('Key metrics for this project')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="cm-stat-card p-4 border rounded-md">
              <h4 className="text-sm font-medium text-gray-500">{t('Active Flows')}</h4>
              <p className="text-2xl font-bold mt-2">{analytics.activeFlows}</p>
            </div>
            
            <div className="cm-stat-card p-4 border rounded-md">
              <h4 className="text-sm font-medium text-gray-500">{t('Total Flows')}</h4>
              <p className="text-2xl font-bold mt-2">{analytics.totalFlows}</p>
            </div>
            
            <div className="cm-stat-card p-4 border rounded-md">
              <h4 className="text-sm font-medium text-gray-500">{t('Active Users')}</h4>
              <p className="text-2xl font-bold mt-2">{analytics.activeUsers}</p>
            </div>
            
            <div className="cm-stat-card p-4 border rounded-md">
              <h4 className="text-sm font-medium text-gray-500">{t('Total Users')}</h4>
              <p className="text-2xl font-bold mt-2">{analytics.totalUsers}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
