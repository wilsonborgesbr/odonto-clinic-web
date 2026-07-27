import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { AppLayout } from './components/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Placeholder } from './pages/Placeholder';
import { PacientesPage } from './pages/pacientes/PacientesPage';
import { AgendaPage } from './pages/agenda/AgendaPage';
import { Login } from './pages/Login';
import { Registro } from './pages/Registro';
import { ProtectedRoute } from './components/ProtectedRoute';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pacientes" element={<PacientesPage />} />
          <Route path="/agenda" element={<AgendaPage />} />
          <Route
            path="/dentistas"
            element={<Placeholder title="Dentistas" descricao="Cadastro e gerenciamento de dentistas" />}
          />
          <Route
            path="/funcionarios"
            element={<Placeholder title="Funcionários" descricao="Cadastro e gerenciamento de funcionários" />}
          />
          <Route
            path="/financeiro"
            element={<Placeholder title="Financeiro" descricao="Contas a pagar e a receber" />}
          />
          <Route
            path="/estoque"
            element={<Placeholder title="Estoque" descricao="Controle de materiais e insumos" />}
          />
          <Route
            path="/convenios"
            element={<Placeholder title="Convênios" descricao="Convênios e tabelas de preços" />}
          />
          <Route
            path="/documentos"
            element={<Placeholder title="Documentos" descricao="Documentos e anexos dos pacientes" />}
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
