import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BokkaMark } from '../components/BokkaMark';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Field';
import { ApiError } from '../lib/api';

const LAST_CLINICA_KEY = 'bokka:lastClinicaCodigo';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [clinicaCodigo, setClinicaCodigo] = useState<string>(() =>
    localStorage.getItem(LAST_CLINICA_KEY) ?? '',
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const codigo = clinicaCodigo.trim().toLowerCase();
      await login({ clinicaCodigo: codigo, email, password });
      localStorage.setItem(LAST_CLINICA_KEY, codigo);
      navigate('/', { replace: true });
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.friendlyMessage()
          : 'Não foi possível entrar. Verifique suas credenciais.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bokka-surface-2 flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        <div className="flex flex-col items-center mb-8">
          <BokkaMark size={44} />
          <h1 className="text-2xl font-bold tracking-tight text-bokka-ink mt-4">
            Entrar no Bokka
          </h1>
          <p className="text-sm text-bokka-ink-3 mt-1">
            Gerencie a rotina da sua clínica.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-bokka-surface border border-bokka-border rounded-2xl p-6 shadow-sm space-y-5"
        >
          {error && (
            <div className="text-sm text-bokka-danger-ink bg-bokka-danger-soft border border-bokka-danger/20 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <Input
            label="Código da clínica"
            required
            autoComplete="organization"
            value={clinicaCodigo}
            onChange={(e) => setClinicaCodigo(e.target.value)}
            placeholder="minhaclinica"
            hint="Identificador único da clínica onde você trabalha."
            leadingIcon={<Building2 className="w-4 h-4" strokeWidth={1.75} />}
          />

          <Input
            label="E-mail"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@clinica.com"
            leadingIcon={<Mail className="w-4 h-4" strokeWidth={1.75} />}
          />

          <Input
            label="Senha"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            leadingIcon={<Lock className="w-4 h-4" strokeWidth={1.75} />}
          />

          <Button type="submit" loading={loading} fullWidth size="lg">
            Entrar
          </Button>

          <p className="text-sm text-bokka-ink-3 text-center">
            Ainda não tem clínica cadastrada?{' '}
            <Link
              to="/registro"
              className="text-bokka-primary font-semibold hover:text-bokka-primary-hover"
            >
              Criar clínica
            </Link>
          </p>
        </form>

        <p className="text-xs text-bokka-ink-3 text-center mt-6">
          Bokka · sistema de gestão para clínicas odontológicas
        </p>
      </div>
    </div>
  );
};
