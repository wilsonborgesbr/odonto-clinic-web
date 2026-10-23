import { useRef, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Mail, Lock, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthShell } from '../components/AuthShell';
import { SeletorClinicaModal } from '../components/SeletorClinicaModal';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Field';
import { ApiError } from '../lib/api';
import { lerClinicaSalva } from '../lib/clinicaStorage';
import { normalizeEmail, validateEmail } from '../lib/utils';
import { loginTemToken } from '../services/authService';
import type { SelecaoClinicaDTO } from '../types';

const MSG_SELECAO_EXPIRADA = 'A seleção expirou. Digite sua senha novamente.';
const MSG_SELECAO_FALHOU = 'Não foi possível entrar nessa clínica. Tente novamente.';

export const Login = () => {
  const { login, selecionarClinica } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [clinicaCodigo, setClinicaCodigo] = useState<string>(
    () => params.get('c')?.trim() || lerClinicaSalva(),
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Seleção de clínica (mesma senha em mais de uma clínica)
  const [selecao, setSelecao] = useState<SelecaoClinicaDTO | null>(null);
  const [seletorAberto, setSeletorAberto] = useState(false);
  const [escolhendoId, setEscolhendoId] = useState<string | null>(null);
  const [erroSeletor, setErroSeletor] = useState<string | null>(null);

  const [erros, setErros] = useState<{ codigo?: string; email?: string; senha?: string }>({});
  const codigoRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const senhaRef = useRef<HTMLInputElement>(null);

  const codigoLimpo = clinicaCodigo.trim().toLowerCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const novos = {
      codigo: codigoLimpo ? undefined : 'Informe o código da clínica.',
      email: validateEmail(email, { required: true }),
      senha: password ? undefined : 'Informe sua senha.',
    };
    setErros(novos);
    if (novos.codigo || novos.email || novos.senha) {
      (novos.codigo ? codigoRef : novos.email ? emailRef : senhaRef).current?.focus();
      return;
    }

    setLoading(true);
    try {
      const resultado = await login({
        clinicaCodigo: codigoLimpo,
        email: normalizeEmail(email),
        password,
      });
      if (!loginTemToken(resultado)) {
        setSelecao(resultado);
        setErroSeletor(null);
        setSeletorAberto(true);
        return;
      }
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

  const escolherClinica = async (clinicaId: string) => {
    if (!selecao) return;
    setErroSeletor(null);
    setEscolhendoId(clinicaId);
    try {
      await selecionarClinica(selecao.ticket, clinicaId);
      navigate('/', { replace: true });
    } catch (err) {
      // Ticket vencido ou inválido: volta para a senha. Outras falhas deixam a lista clicável.
      const expirou = err instanceof ApiError && [400, 401, 410].includes(err.status);
      if (expirou) {
        setSeletorAberto(false);
        setSelecao(null);
        setPassword('');
        setError(MSG_SELECAO_EXPIRADA);
      } else {
        setErroSeletor(MSG_SELECAO_FALHOU);
      }
    } finally {
      setEscolhendoId(null);
    }
  };

  return (
    <AuthShell title="Entrar no Bokka" subtitle="Gerencie a rotina da sua clínica ou consultório.">
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {error && (
          <div
            role="alert"
            className="text-sm text-bokka-danger-ink bg-bokka-danger-soft border border-bokka-danger/20 rounded-md px-3 py-2"
          >
            {error}
          </div>
        )}

        <Input
          ref={codigoRef}
          label="Código da clínica"
          required
          autoComplete="organization"
          value={clinicaCodigo}
          onChange={(e) => {
            setClinicaCodigo(e.target.value);
            setErros((a) => ({ ...a, codigo: undefined }));
          }}
          placeholder="minhaclinica"
          error={erros.codigo}
          aria-invalid={!!erros.codigo}
          leadingIcon={<Building2 className="w-4 h-4" strokeWidth={1.75} />}
        />

        <Input
          ref={emailRef}
          label="E-mail"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setErros((a) => ({ ...a, email: undefined }));
          }}
          placeholder="voce@email.com"
          error={erros.email}
          aria-invalid={!!erros.email}
          leadingIcon={<Mail className="w-4 h-4" strokeWidth={1.75} />}
        />

        <Input
          ref={senhaRef}
          label="Senha"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setErros((a) => ({ ...a, senha: undefined }));
          }}
          placeholder="••••••••"
          error={erros.senha}
          aria-invalid={!!erros.senha}
          leadingIcon={<Lock className="w-4 h-4" strokeWidth={1.75} />}
        />

        <div className="flex justify-end -mt-2">
          <Link
            to={`/recuperar-senha${codigoLimpo ? `?c=${encodeURIComponent(codigoLimpo)}` : ''}`}
            className="text-sm text-bokka-primary font-semibold hover:text-bokka-primary-hover"
          >
            Esqueci minha senha
          </Link>
        </div>

        <Button type="submit" loading={loading} fullWidth size="lg">
          Entrar
        </Button>

        <p className="text-sm text-bokka-ink-3 text-center">
          Ainda não tem conta?{' '}
          <Link
            to="/registro"
            className="text-bokka-primary font-semibold hover:text-bokka-primary-hover"
          >
            Cadastre-se agora
          </Link>
        </p>
      </form>

      <SeletorClinicaModal
        open={seletorAberto}
        clinicas={selecao?.clinicas ?? []}
        ultimoCodigo={lerClinicaSalva()}
        escolhendoId={escolhendoId}
        erro={erroSeletor}
        onEscolher={escolherClinica}
        onClose={() => setSeletorAberto(false)}
      />
    </AuthShell>
  );
};
