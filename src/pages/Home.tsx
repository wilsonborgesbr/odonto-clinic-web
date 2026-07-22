import { useAuth } from '../context/AuthContext';

export const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <main className="p-8 max-w-4xl mx-auto text-center space-y-6">
      <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-2">
          Bem-vindo ao OdontoClinic System
        </h2>
        <p className="text-slate-600 dark:text-slate-300">
          Sistema completo para gestão odontológica, prontuários, agendamentos e controle financeiro.
        </p>

        <div className="mt-4 text-sm font-semibold text-slate-500">
          Status de Autenticação: {isAuthenticated ? 'Autenticado' : 'Visitante'}
        </div>

        <div className="mt-6 inline-block bg-blue-50 dark:bg-slate-700 p-4 rounded-lg text-sm text-blue-700 dark:text-blue-300 font-medium">
          Status da Conexão Backend: API configurada para <code className="bg-blue-100 dark:bg-slate-600 px-2 py-1 rounded">{import.meta.env.VITE_API_URL}</code>
        </div>
      </div>
    </main>
  );
};
