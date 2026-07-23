import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    // Redireciona o usuário para a página de login se não estiver autenticado
    return <Navigate to="/login" replace />;
  }

  // Renderiza a rota filha se estiver autenticado
  return <Outlet />;
};
