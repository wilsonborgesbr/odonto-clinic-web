import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RequirePermission } from './components/RequirePermission';

const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Registro = lazy(() => import('./pages/Registro').then(m => ({ default: m.Registro })));
const PacientesPage = lazy(() => import('./pages/pacientes/PacientesPage').then(m => ({ default: m.PacientesPage })));
const PacienteDetalhePage = lazy(() => import('./pages/pacientes/PacienteDetalhePage').then(m => ({ default: m.PacienteDetalhePage })));
const DentistasPage = lazy(() => import('./pages/dentistas/DentistasPage').then(m => ({ default: m.DentistasPage })));
const AgendaPage = lazy(() => import('./pages/agenda/AgendaPage').then(m => ({ default: m.AgendaPage })));
const AuditoriaPage = lazy(() => import('./pages/financeiro/AuditoriaPage').then(m => ({ default: m.AuditoriaPage })));
const OdontogramaPacientePage = lazy(() => import('./pages/odontograma/OdontogramaPacientePage').then(m => ({ default: m.OdontogramaPacientePage })));
const FuncionariosPage = lazy(() => import('./pages/funcionarios/FuncionariosPage').then(m => ({ default: m.FuncionariosPage })));
const EstoquePage = lazy(() => import('./pages/estoque/EstoquePage').then(m => ({ default: m.EstoquePage })));
const ConveniosPage = lazy(() => import('./pages/convenios/ConveniosPage').then(m => ({ default: m.ConveniosPage })));
const Usuarios = lazy(() => import('./pages/Usuarios').then(m => ({ default: m.Usuarios })));
const Perfil = lazy(() => import('./pages/Perfil').then(m => ({ default: m.Perfil })));
const Configuracoes = lazy(() => import('./pages/Configuracoes').then(m => ({ default: m.Configuracoes })));

const PageFallback = () => (
  <div className="flex items-center justify-center h-full min-h-[60vh]">
    <div className="w-8 h-8 border-3 border-bokka-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const RedirectIfAuthed = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppRoutes = () => (
  <Suspense fallback={<PageFallback />}>
    <Routes>
      <Route
        path="/login"
        element={
          <RedirectIfAuthed>
            <Login />
          </RedirectIfAuthed>
        }
      />
      <Route
        path="/registro"
        element={
          <RedirectIfAuthed>
            <Registro />
          </RedirectIfAuthed>
        }
      />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/configuracoes" element={<Configuracoes />} />

          <Route
            path="/"
            element={
              <RequirePermission permissao="DASHBOARD">
                <Dashboard />
              </RequirePermission>
            }
          />
          <Route
            path="/pacientes"
            element={
              <RequirePermission permissao="PACIENTES">
                <PacientesPage />
              </RequirePermission>
            }
          />
          <Route
            path="/pacientes/:id"
            element={
              <RequirePermission permissao="PACIENTES">
                <PacienteDetalhePage />
              </RequirePermission>
            }
          />
          <Route
            path="/pacientes/:id/odontograma"
            element={
              <RequirePermission permissao="ODONTOGRAMA">
                <OdontogramaPacientePage />
              </RequirePermission>
            }
          />
          <Route
            path="/agenda"
            element={
              <RequirePermission permissao="AGENDAMENTOS">
                <AgendaPage />
              </RequirePermission>
            }
          />
          <Route
            path="/financeiro/auditoria"
            element={
              <RequirePermission permissao="AUDITORIA_FINANCEIRA">
                <AuditoriaPage />
              </RequirePermission>
            }
          />
          <Route path="/contas-receber" element={<Navigate to="/financeiro/auditoria" replace />} />
          <Route path="/contas-pagar" element={<Navigate to="/financeiro/auditoria" replace />} />

          <Route
            path="/dentistas"
            element={
              <RequirePermission permissao="DENTISTAS">
                <DentistasPage />
              </RequirePermission>
            }
          />
          <Route
            path="/convenios"
            element={
              <RequirePermission permissao="CONVENIOS">
                <ConveniosPage />
              </RequirePermission>
            }
          />
          <Route
            path="/funcionarios"
            element={
              <RequirePermission permissao="FUNCIONARIOS">
                <FuncionariosPage />
              </RequirePermission>
            }
          />
          <Route
            path="/estoque"
            element={
              <RequirePermission permissao="ESTOQUE">
                <EstoquePage />
              </RequirePermission>
            }
          />
          <Route
            path="/usuarios"
            element={
              <RequirePermission permissao="USUARIOS_E_PERMISSOES">
                <Usuarios />
              </RequirePermission>
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
);

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
