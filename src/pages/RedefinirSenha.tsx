import { useId, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Building2, CheckCircle2, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { AuthShell, PainelEstado } from '../components/AuthShell';
import { CodigoRecuperacao } from '../components/CodigoRecuperacao';
import { MedidorForcaSenha } from '../components/MedidorForcaSenha';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Field';
import { Skeleton } from '../components/ui/Skeleton';
import { ApiError } from '../lib/api';
import { lerClinicaSalva } from '../lib/clinicaStorage';
import {
  guardarTicketRecuperacao,
  lerTicketRecuperacao,
  limparTicketRecuperacao,
} from '../lib/ticketRecuperacao';
import type { SessaoRecuperacao } from '../lib/ticketRecuperacao';
import { SENHA_MIN_CARACTERES } from '../lib/utils';
import { useRedefinirSenha, useValidarTokenReset } from '../services/authService';
import type { ValidarCodigoRecuperacaoResponseDTO } from '../types';

const MSG_FALHA = 'Não foi possível salvar a nova senha. Tente novamente.';

const comCodigo = (rota: string, codigo: string) =>
  `${rota}${codigo ? `?c=${encodeURIComponent(codigo)}` : ''}`;

const VoltarLogin = ({ codigo }: { codigo: string }) => (
  <div className="flex justify-center">
    <Link
      to={comCodigo('/login', codigo)}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-bokka-primary-text hover:text-bokka-primary-text-hover"
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

  // Sem token na URL a pessoa usa o código de 6 dígitos: o ticket que ele devolve (5 min, uso único) faz o
  // papel do token e vive só em memória. Pode ter vindo da tela "Confira seu e-mail" ou ser digitado aqui.
  const [sessao, setSessao] = useState<SessaoRecuperacao | null>(() => (token ? null : lerTicketRecuperacao()));
  const [emailCodigo, setEmailCodigo] = useState('');
  const [clinicaDigitada, setClinicaDigitada] = useState(() => codigoUrl || lerClinicaSalva());
  const [ticketRejeitado, setTicketRejeitado] = useState(false);
  const credencial = token ?? sessao?.ticket ?? null;

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
  const codigo = (validarQ.data?.clinicaCodigo ?? sessao?.clinicaCodigo ?? codigoUrl).toLowerCase();

  const validando = !!token && validarQ.isLoading;
  const linkValido = !!token && !tokenRejeitado && validarQ.data?.valido === true;

  const erroConfirmacao = (valor: string, base: string) =>
    valor && valor !== base ? 'As senhas não coincidem.' : undefined;

  const codigoAceito = (r: ValidarCodigoRecuperacaoResponseDTO) => {
    guardarTicketRecuperacao({
      ticket: r.ticket,
      nomeUsuario: r.nomeUsuario,
      clinicaNome: r.clinicaNome,
      clinicaCodigo: r.clinicaCodigo,
    });
    setTicketRejeitado(false);
    setSessao(lerTicketRecuperacao());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credencial) return;
    setErroGeral(null);

    // O ticket vale 5 minutos: se já passou, nem tenta (o servidor recusaria de qualquer jeito).
    if (!token && !lerTicketRecuperacao()) {
      setTicketRejeitado(true);
      return;
    }

    const novos = {
      senha: senha.length < SENHA_MIN_CARACTERES
        ? `Use pelo menos ${SENHA_MIN_CARACTERES} caracteres.`
        : undefined,
      confirmacao: confirmacao !== senha ? 'As senhas não coincidem.' : undefined,
    };
    setErros(novos);
    if (novos.senha || novos.confirmacao) return;

    try {
      await redefinirM.mutateAsync({ token: credencial, novaSenha: senha });
      limparTicketRecuperacao();
      setConcluido(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        const porCampo = err.fieldErrors();
        if (porCampo.novaSenha) {
          setErros({ senha: porCampo.novaSenha });
          return;
        }
        // Ticket do código: 400 sem erro de campo = venceu ou já foi usado.
        if (!token) {
          limparTicketRecuperacao();
          setTicketRejeitado(true);
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

  if (!token && (!sessao || ticketRejeitado)) {
    const pedirNovo = () =>
      navigate(comCodigo('/recuperar-senha', codigo || clinicaDigitada.trim().toLowerCase()));

    if (ticketRejeitado) {
      return (
        <AuthShell title="Código vencido ou já usado" focusKey="ticket-vencido">
          <PainelEstado
            tom="aviso"
            icone={AlertTriangle}
            acoes={
              <div className="space-y-3">
                <Button type="button" fullWidth size="lg" onClick={pedirNovo}>
                  Pedir novo código
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  onClick={() => {
                    setTicketRejeitado(false);
                    setSessao(null);
                  }}
                >
                  Digitar outro código
                </Button>
              </div>
            }
          >
            Por segurança, depois de aceito o código vale por 5 minutos e só pode ser usado uma vez. Peça
            um novo para continuar.
          </PainelEstado>
          <VoltarLogin codigo={codigo} />
        </AuthShell>
      );
    }

    return (
      <AuthShell
        title="Digite o código"
        subtitle="Use o código de 6 dígitos do e-mail de recuperação."
        focusKey="codigo"
      >
        <CodigoRecuperacao
          email={emailCodigo}
          clinicaCodigo={clinicaDigitada}
          onValidado={codigoAceito}
          campos={
            <>
              <Input
                label="Código da clínica"
                autoComplete="organization"
                value={clinicaDigitada}
                onChange={(e) => setClinicaDigitada(e.target.value)}
                placeholder="minhaclinica"
                hint="Opcional. Informe se você usa mais de uma clínica ou consultório."
                leadingIcon={<Building2 className="w-4 h-4" strokeWidth={1.75} />}
              />
              <Input
                label="E-mail"
                type="email"
                required
                autoComplete="email"
                value={emailCodigo}
                onChange={(e) => setEmailCodigo(e.target.value)}
                placeholder="voce@email.com"
                leadingIcon={<Mail className="w-4 h-4" strokeWidth={1.75} />}
              />
            </>
          }
          ajudaVencido={<>Se o código venceu ou já foi usado, peça um novo.</>}
        />
        <div className="flex justify-center">
          <Link
            to={comCodigo('/recuperar-senha', codigo || clinicaDigitada.trim().toLowerCase())}
            className="text-sm font-semibold text-bokka-primary-text hover:text-bokka-primary-text-hover"
          >
            Não recebeu o código? Pedir novo
          </Link>
        </div>
        <VoltarLogin codigo={codigo} />
      </AuthShell>
    );
  }

  if (token && !linkValido) {
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
      {sessao && (
        <p className="text-center text-sm text-bokka-ink-2">
          Olá, <span className="font-semibold text-bokka-ink">{sessao.nomeUsuario ?? 'tudo certo'}</span>
          {sessao.clinicaNome && (
            <>
              {' · '}
              {sessao.clinicaNome}
            </>
          )}
        </p>
      )}

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
