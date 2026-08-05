import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BokkaMark } from '../components/BokkaMark';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Field';
import { ApiError } from '../lib/api';
import { bokkaToast } from '../components/ui/Toast';

export const Registro = () => {
  const { registerClinica } = useAuth();
  const navigate = useNavigate();
  const [clinicaCodigo, setClinicaCodigo] = useState('');
  const [clinicaNome, setClinicaNome] = useState('');
  const [adminNome, setAdminNome] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);
    try {
      await registerClinica({
        clinicaCodigo: clinicaCodigo.trim().toLowerCase(),
        clinicaNome: clinicaNome.trim(),
        adminNome: adminNome.trim(),
        adminEmail: adminEmail.trim(),
        adminPassword,
      });
      bokkaToast.success('Clínica criada — você é a proprietária.');
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        const fe = err.fieldErrors();
        if (Object.keys(fe).length) setFieldErrors(fe);
        else setError(err.friendlyMessage());
      } else {
        setError('Não foi possível criar a clínica.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bokka-surface-2 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[480px]">
        <div className="flex flex-col items-center mb-8">
          <BokkaMark size={44} />
          <h1 className="text-2xl font-bold tracking-tight text-bokka-ink mt-4">
            Cadastrar nova clínica
          </h1>
          <p className="text-sm text-bokka-ink-3 mt-1 text-center max-w-xs">
            Você será a proprietária, com acesso total. Adicione outros usuários depois em Configurações.
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

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-bokka-ink-3 mb-3">
              Sobre a clínica
            </h2>
            <div className="space-y-4">
              <Input
                label="Código da clínica"
                required
                value={clinicaCodigo}
                onChange={(e) => setClinicaCodigo(e.target.value)}
                placeholder="minhaclinica"
                hint="Identificador único usado no login. 4–40 caracteres, minúsculas e números."
                leadingIcon={<Building2 className="w-4 h-4" strokeWidth={1.75} />}
                error={fieldErrors.clinicaCodigo}
                minLength={4}
                maxLength={40}
              />
              <Input
                label="Nome da clínica"
                required
                value={clinicaNome}
                onChange={(e) => setClinicaNome(e.target.value)}
                placeholder="Ex.: Odonto Socorro Ltda"
                error={fieldErrors.clinicaNome}
              />
            </div>
          </div>

          <div className="border-t border-bokka-border pt-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-bokka-ink-3 mb-3">
              Sua conta (proprietário)
            </h2>
            <div className="space-y-4">
              <Input
                label="Nome completo"
                required
                autoComplete="name"
                value={adminNome}
                onChange={(e) => setAdminNome(e.target.value)}
                placeholder="Dra. Tainah Borges"
                leadingIcon={<User className="w-4 h-4" strokeWidth={1.75} />}
                error={fieldErrors.adminNome}
              />
              <Input
                label="E-mail"
                type="email"
                required
                autoComplete="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="voce@clinica.com"
                leadingIcon={<Mail className="w-4 h-4" strokeWidth={1.75} />}
                error={fieldErrors.adminEmail}
              />
              <Input
                label="Senha"
                type="password"
                required
                autoComplete="new-password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                leadingIcon={<Lock className="w-4 h-4" strokeWidth={1.75} />}
                error={fieldErrors.adminPassword}
                minLength={6}
              />
            </div>
          </div>

          <Button type="submit" loading={loading} fullWidth size="lg">
            Criar clínica
          </Button>

          <p className="text-sm text-bokka-ink-3 text-center">
            Já tem clínica cadastrada?{' '}
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
