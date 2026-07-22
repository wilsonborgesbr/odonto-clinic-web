import { useAuth } from '../context/AuthContext';

export const Header = () => {
  const { isAuthenticated, logout } = useAuth();

  return (
    <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md">
      <h1 className="text-xl font-bold tracking-tight text-blue-400">
        OdontoClinic Web
      </h1>
      {isAuthenticated && (
        <button
          onClick={logout}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
        >
          Sair
        </button>
      )}
    </header>
  );
};
