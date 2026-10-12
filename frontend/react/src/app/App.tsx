import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { AuthProvider, RequireAuth, RequireRole } from '@/features/auth';
import { AgreementsPage } from './AgreementsPage';
import { DirectReportPage } from './DirectReportPage';
import { DirectReportsPage } from './DirectReportsPage';
import { HomePage } from './HomePage';
import { LoginPage } from './LoginPage';
import { NewDirectReportPage } from './NewDirectReportPage';
import { NewSessionPage } from './NewSessionPage';
import { SessionPage } from './SessionPage';
import { SettingsPage } from './SettingsPage';
import { NotFoundPage } from './NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="*"
              element={
                <RequireAuth>
                  <RequireRole role="lider">
                    <AppShell>
                      <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/pessoas" element={<DirectReportsPage />} />
                        <Route path="/combinados" element={<AgreementsPage />} />
                        <Route path="/pessoas/nova" element={<NewDirectReportPage />} />
                        <Route path="/pessoas/:id" element={<DirectReportPage />} />
                        <Route path="/pessoas/:id/novo-encontro" element={<NewSessionPage />} />
                        <Route path="/encontros/:id" element={<SessionPage />} />
                        <Route path="/configuracoes" element={<SettingsPage />} />
                        <Route path="*" element={<NotFoundPage />} />
                      </Routes>
                    </AppShell>
                  </RequireRole>
                </RequireAuth>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
