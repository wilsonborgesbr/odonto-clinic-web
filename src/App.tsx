import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { AppLayout } from './components/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { PacientesPage } from './pages/pacientes/PacientesPage';
import { AgendaPage } from './pages/agenda/AgendaPage';
import { FinanceiroPage } from './pages/financeiro/FinanceiroPage';
import { DentistasPage } from './pages/dentistas/DentistasPage';
import { FuncionariosPage } from './pages/funcionarios/FuncionariosPage';
import { ConveniosPage } from './pages/convenios/ConveniosPage';
import { EstoquePage } from './pages/estoque/EstoquePage';
import { DocumentosPage } from './pages/documentos/DocumentosPage';
import { AnamnesePage } from './pages/anamnese/AnamnesePage';
import { OdontogramaPage } from './pages/odontograma/OdontogramaPage';
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
          <Route path="/dentistas" element={<DentistasPage />} />
          <Route path="/funcionarios" element={<FuncionariosPage />} />
          <Route path="/financeiro" element={<FinanceiroPage />} />
          <Route path="/estoque" element={<EstoquePage />} />
          <Route path="/convenios" element={<ConveniosPage />} />
          <Route path="/documentos" element={<DocumentosPage />} />
          <Route path="/anamnese" element={<AnamnesePage />} />
          <Route path="/odontograma" element={<OdontogramaPage />} />
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
