import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { Registro } from './pages/Registro';
import { Placeholder } from './pages/Placeholder';
import { PacientesPage } from './pages/pacientes/PacientesPage';
import { PacienteDetalhePage } from './pages/pacientes/PacienteDetalhePage';
import { AgendaPage } from './pages/agenda/AgendaPage';
import { ContasReceberPage } from './pages/financeiro/ContasReceberPage';
import { OdontogramaPacientePage } from './pages/odontograma/OdontogramaPacientePage';
import { Perfil } from './pages/Perfil';

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
        <Route path="/" element={<Dashboard />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/pacientes" element={<PacientesPage />} />
        <Route path="/pacientes/:id" element={<PacienteDetalhePage />} />
        <Route path="/pacientes/:id/odontograma" element={<OdontogramaPacientePage />} />
        <Route path="/agenda" element={<AgendaPage />} />
        <Route path="/contas-receber" element={<ContasReceberPage />} />

        <Route
          path="/dentistas"
          element={
            <Placeholder
              title="Dentistas"
              descricao="Cadastro e gerenciamento do quadro de dentistas."
            />
          }
        />
        <Route
          path="/procedimentos"
          element={
            <Placeholder
              title="Procedimentos"
              descricao="Registro dos procedimentos realizados nos pacientes."
            />
          }
        />
        <Route
          path="/anamnese"
          element={
            <Placeholder
              title="Anamnese"
              descricao="Histórico clínico dos pacientes. Consulte pela ficha do paciente."
            />
          }
        />
        <Route
          path="/odontograma"
          element={
            <Placeholder
              title="Odontograma"
              descricao="Mapeamento dental dos pacientes. Consulte pela ficha do paciente."
            />
          }
        />
        <Route
          path="/contas-pagar"
          element={
            <Placeholder
              title="Contas a Pagar"
              descricao="Controle das despesas e obrigações da clínica."
            />
          }
        />
        <Route
          path="/convenios"
          element={
            <Placeholder
              title="Convênios"
              descricao="Cadastro dos convênios odontológicos parceiros."
            />
          }
        />
        <Route
          path="/funcionarios"
          element={
            <Placeholder
              title="Funcionários"
              descricao="Cadastro da equipe administrativa e auxiliar."
            />
          }
        />
        <Route
          path="/estoque"
          element={
            <Placeholder
              title="Estoque"
              descricao="Controle de insumos, materiais e medicamentos."
            />
          }
        />
        <Route
          path="/documentos"
          element={
            <Placeholder
              title="Documentos"
              descricao="Arquivos vinculados aos pacientes."
            />
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
