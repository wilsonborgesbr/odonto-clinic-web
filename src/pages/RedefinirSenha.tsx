import { useId, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Building2, CheckCircle2, Eye, EyeOff, Lock } from 'lucide-react';
import { AuthShell, PainelEstado } from '../components/AuthShell';
import { MedidorForcaSenha } from '../components/MedidorForcaSenha';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Field';
import { Skeleton } from '../components/ui/Skeleton';
import { ApiError } from '../lib/api';
import { SENHA_MIN_CARACTERES } from '../lib/utils';
import { useRedefinirSenha, useValidarTokenReset } from '../services/authService';

const MSG_FALHA = 'Não foi possível salvar a nova senha. Tente novamente.';

const comCodigo = (rota: string, codigo: string) =>
  `${rota}${codigo ? `?c=${encodeURIComponent(codigo)}` : ''}`;

const VoltarLogin = ({ codigo }: { codigo: string }) => (
  <div className="flex justify-center">
    <Link
      to={comCodigo('/login', codigo)}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-bokka-primary hover:text-bokka-primary-hover"
    >
      <ArrowLeft className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
      Voltar para o login
    </Link>
  </div>
);

const MostrarSenha = ({ visivel, onToggle }: { visivel: boolean; onToggle: () => void }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
    aria-pressed={visivel}
    className="-m-2 p-2 text-bokka-ink-3 hover:text-bokka-ink rounded-md"
  >
    {visivel ? (
      <EyeOff className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
    ) : (
      <Eye className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
    )}
  </button>
);

export const RedefinirSenha = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token')?.trim() || null;
  const codigoUrl = params.get('c')?.trim().toLowerCase() ?? '';

  const validarQ = useValidarTokenReset(token);
  const redefinirM = useRedefinirSenha();
  const idMedidor = useId();

  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [verSenha, setVerSenha] = useState(false);
  const [verConfirmacao, setVerConfirmacao] = useState(false);
  const [erros, setErros] = useState<{ senha?: string; confirmacao?: string }>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [tokenRejeitado, setTokenRejeitado] = useState(false);
  const [concluido, setConcluido] = useState(false);

  const clinicaNome = validarQ.data?.clinicaNome;
  const codigo = (validarQ.data?.clinicaCodigo ?? codigoUrl).toLowerCase();

  const validando = !!token && validarQ.isLoading;
  const linkValido = !!token && !tokenRejeitado && validarQ.data?.valido === true;

  const erroConfirmacao = (valor: string, base: string) =>
    valor && valor !== base ? 'As senhas não coincidem.' : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setErroGeral(null);

    const novos = {
      senha: senha.length < SENHA_MIN_CARACTERES
        ? `Use pelo menos ${SENHA_MIN_CARACTERES} caracteres.`
        : undefined,
      confirmacao: confirmacao !== senha ? 'As senhas não coincidem.' : undefined,
    };
    setErros(novos);
    if (novos.senha || novos.confirmacao) return;

    try {
      await redefinirM.mutateAsync({ token, novaSenha: senha });
      setConcluido(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        const porCampo = err.fieldErrors();
        if (porCampo.novaSenha) {
          setErros({ senha: porCampo.novaSenha });
          return;
        }
        // 400 também é "link já usado/expirado": confere o link de novo antes de culpar a senha.
        const novamente = await validarQ.refetch();
        if (novamente.isError || novamente.data?.valido !== true) {
          setTokenRejeitado(true);
          return;
        }
        setErroGeral(err.friendlyMessage() || MSG_FALHA);
        return;
      }
      setErroGeral(MSG_FALHA);
    }
  };

  if (concluido) {
    return (
      <AuthShell title="Senha alterada" focusKey="concluido">
        <PainelEstado
          tom="sucesso"
          icone={CheckCircle2}
          acoes={
            <Button type="button" fullWidth size="lg" onClick={() => navigate(comCodigo('/login', codigo))}>
              Ir para o login
            </Button>
          }
        >
          Pronto! Já pode entrar no Bokka com a nova senha. Enviamos um aviso de segurança para o seu
          e-mail.
        </PainelEstado>
      </AuthShell>
    );
  }

  if (validando) {
    return (
      <AuthShell title="Criar nova senha">
        <div className="space-y-4" aria-busy="true" role="status">
          <span className="sr-only">Verificando o link...</span>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </AuthShell>
    );
  }

  if (!linkValido) {
    return (
      <AuthShell title="Link inválido ou expirado" focusKey="invalido">
        <PainelEstado
          tom="aviso"
          icone={AlertTriangle}
          acoes={
            <Button
              type="button"
              fullWidth
              size="lg"
              onClick={() => navigate(comCodigo('/recuperar-senha', codigo))}
            >
              Pedir novo link
            </Button>
          }
        >
          Por segurança, o link de recuperação vale por 30 minutos e só pode ser usado uma vez. Peça um
          novo para continuar.
        </PainelEstado>
        <VoltarLogin codigo={codigo} />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Criar nova senha"
      subtitle="Escolha uma senha que você não usa em outros lugares."
      focusKey="formulario"
    >
      {clinicaNome && (
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-bokka-surface-3 px-3 py-1 text-xs font-medium text-bokka-ink-2 max-w-full">
            <Building2 className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span className="truncate" title={clinicaNome}>
              {clinicaNome}
            </span>
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {erroGeral && (
          <div
            role="alert"
            className="text-sm text-bokka-danger-ink bg-bokka-danger-soft border border-bokka-danger/20 rounded-md px-3 py-2"
          >
            {erroGeral}
          </div>
        )}

        <div>
          <Input
            label="Nova senha"
            type={verSenha ? 'text' : 'password'}
            required
            autoComplete="new-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            error={erros.senha}
            aria-invalid={!!erros.senha}
            aria-describedby={idMedidor}
            leadingIcon={<Lock className="w-4 h-4" strokeWidth={1.75} />}
            trailingIcon={<MostrarSenha visivel={verSenha} onToggle={() => setVerSenha((v) => !v)} />}
          />
          <MedidorForcaSenha senha={senha} id={idMedidor} />
        </div>

        <Input
          label="Confirmar nova senha"
          type={verConfirmacao ? 'text' : 'password'}
          required
          autoComplete="new-password"
          value={confirmacao}
          onChange={(e) => setConfirmacao(e.target.value)}
          onBlur={() => setErros((a) => ({ ...a, confirmacao: erroConfirmacao(confirmacao, senha) }))}
          error={erros.confirmacao}
          aria-invalid={!!erros.confirmacao}
          leadingIcon={<Lock className="w-4 h-4" strokeWidth={1.75} />}
          trailingIcon={
            <MostrarSenha visivel={verConfirmacao} onToggle={() => setVerConfirmacao((v) => !v)} />
          }
        />

        <Button type="submit" loading={redefinirM.isPending} fullWidth size="lg">
          Salvar nova senha
        </Button>
      </form>

      <VoltarLogin codigo={codigo} />
    </AuthShell>
  );
};
