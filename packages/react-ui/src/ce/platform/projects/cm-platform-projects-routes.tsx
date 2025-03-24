import { Navigate, Route, Routes } from 'react-router-dom';
import { CmPlatformProjectList } from './components/cm-platform-project-list';
import { CmPlatformProjectDetail } from './components/cm-platform-project-detail';

export const CmPlatformProjectsRoutes = () => {
  return (
    <Routes>
      <Route 
        path="/" 
        element={<CmPlatformProjectList />}
      />
      <Route 
        path="/:id" 
        element={<CmPlatformProjectDetail />}
      />
      <Route 
        path="*" 
        element={<Navigate to="/platform/ce-projects" replace />} 
      />
    </Routes>
  );
};
