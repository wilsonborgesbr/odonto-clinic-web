import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RequirePermission } from './components/RequirePermission';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { Registro } from './pages/Registro';
import { PacientesPage } from './pages/pacientes/PacientesPage';
import { PacienteDetalhePage } from './pages/pacientes/PacienteDetalhePage';
import { DentistasPage } from './pages/dentistas/DentistasPage';
import { AgendaPage } from './pages/agenda/AgendaPage';
import { AuditoriaPage } from './pages/financeiro/AuditoriaPage';
import { OdontogramaPacientePage } from './pages/odontograma/OdontogramaPacientePage';
import { FuncionariosPage } from './pages/funcionarios/FuncionariosPage';
import { EstoquePage } from './pages/estoque/EstoquePage';
import { ConveniosPage } from './pages/convenios/ConveniosPage';
import { Usuarios } from './pages/Usuarios';
import { Perfil } from './pages/Perfil';
import { Configuracoes } from './pages/Configuracoes';

const RedirectIfAuthed = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppRoutes = () => (
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
        {/* Página de "Meu perfil" e "Configurações" são sempre acessíveis pra qualquer user logado */}
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
);

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
