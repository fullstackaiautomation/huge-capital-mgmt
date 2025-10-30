import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { Login } from './components/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { FundingDashboard } from './pages/FundingDashboard';
import { AIAutomationTasks } from './pages/AIAutomationTasks';
import { ContentManagement } from './pages/ContentManagement';
import { TaskTracker } from './pages/TaskTracker';
import { DillonDaily } from './pages/DillonDaily';
import { Projects } from './pages/Projects';
import { BugsIdeas } from './pages/BugsIdeas';
import { Logins } from './pages/Logins';
import Lenders from './pages/Lenders';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<FundingDashboard />} />
            <Route path="tasks" element={<AIAutomationTasks />} />
            <Route path="projects" element={<Projects />} />
            <Route path="content" element={<ContentManagement />} />
            <Route path="lenders" element={<Lenders />} />
            <Route path="tracker" element={<TaskTracker />} />
            <Route path="tracker/dillon-daily" element={<DillonDaily />} />
            <Route path="bugs" element={<BugsIdeas />} />
            <Route path="logins" element={<Logins />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
