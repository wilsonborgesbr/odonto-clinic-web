import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BokkaMark } from '../components/BokkaMark';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Field';
import { ApiError } from '../lib/api';
import { bokkaToast } from '../components/ui/Toast';

export const Registro = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);
    try {
      await register({ name, email, password });
      bokkaToast.success('Conta criada. Bem-vinda ao Bokka!');
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        const fe = err.fieldErrors();
        if (Object.keys(fe).length) setFieldErrors(fe);
        else setError(err.friendlyMessage());
      } else {
        setError('Não foi possível criar a conta.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bokka-surface-2 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[400px]">
        <div className="flex flex-col items-center mb-8">
          <BokkaMark size={44} />
          <h1 className="text-2xl font-bold tracking-tight text-bokka-ink mt-4">
            Criar conta no Bokka
          </h1>
          <p className="text-sm text-bokka-ink-3 mt-1">Comece a organizar a clínica hoje.</p>
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
            label="Nome completo"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Dra. Tainah Borges"
            leadingIcon={<User className="w-4 h-4" strokeWidth={1.75} />}
            error={fieldErrors.name}
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
            error={fieldErrors.email}
          />
          <Input
            label="Senha"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            leadingIcon={<Lock className="w-4 h-4" strokeWidth={1.75} />}
            error={fieldErrors.password}
            minLength={6}
          />

          <Button type="submit" loading={loading} fullWidth size="lg">
            Criar conta
          </Button>

          <p className="text-sm text-bokka-ink-3 text-center">
            Já tem conta?{' '}
            <Link
              to="/login"
              className="text-bokka-primary font-semibold hover:text-bokka-primary-hover"
            >
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};
