import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Building2, KeyRound, Mail, MailCheck } from 'lucide-react';
import { AuthShell, PainelEstado } from '../components/AuthShell';
import { CodigoRecuperacao } from '../components/CodigoRecuperacao';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Field';
import { ApiError } from '../lib/api';
import { lerClinicaSalva } from '../lib/clinicaStorage';
import { guardarTicketRecuperacao } from '../lib/ticketRecuperacao';
import { normalizeEmail, validateEmail } from '../lib/utils';
import { useRecuperarSenha } from '../services/authService';
import type { ValidarCodigoRecuperacaoResponseDTO } from '../types';

const ESPERA_REENVIO_S = 60;
const MSG_LIMITE = 'Muitas tentativas. Aguarde alguns minutos e tente de novo.';
const MSG_FALHA = 'Não foi possível enviar agora. Tente novamente em instantes.';

const VoltarLogin = ({ codigo }: { codigo: string }) => (
  <div className="flex justify-center">
    <Link
      to={`/login${codigo ? `?c=${encodeURIComponent(codigo)}` : ''}`}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-bokka-primary-text hover:text-bokka-primary-text-hover"
    >
      <ArrowLeft className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
      Voltar para o login
    </Link>
  </div>
);

export const RecuperarSenha = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [clinicaCodigo, setClinicaCodigo] = useState(
    () => params.get('c')?.trim() || lerClinicaSalva(),
  );
  const [email, setEmail] = useState('');
  const [erroEmail, setErroEmail] = useState<string | undefined>();
  const [erro, setErro] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [restante, setRestante] = useState(0);
  const [mostrarCodigo, setMostrarCodigo] = useState(false);
  // Cada envio gera um código novo e invalida o anterior: o campo recomeça vazio.
  const [envios, setEnvios] = useState(0);
  const recuperarM = useRecuperarSenha();

  const codigoLimpo = clinicaCodigo.trim().toLowerCase();

  // Contagem regressiva do "Enviar novamente" (sem aria-live: não fala a cada segundo)
  useEffect(() => {
    if (restante <= 0) return;
    const t = window.setTimeout(() => setRestante((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [restante]);

  const enviar = async () => {
    setErro(null);
    try {
      await recuperarM.mutateAsync({
        email: normalizeEmail(email),
        clinicaCodigo: codigoLimpo || undefined,
      });
      setEnviado(true);
      setEnvios((n) => n + 1);
      setRestante(ESPERA_REENVIO_S);
    } catch (err) {
      setErro(err instanceof ApiError && err.status === 429 ? MSG_LIMITE : MSG_FALHA);
    }
  };

  // O ticket vai só para a memória do app (nunca URL ou storage) e a tela de redefinição o recolhe de lá.
  const codigoValidado = (r: ValidarCodigoRecuperacaoResponseDTO) => {
    guardarTicketRecuperacao({
      ticket: r.ticket,
      nomeUsuario: r.nomeUsuario,
      clinicaNome: r.clinicaNome,
      clinicaCodigo: r.clinicaCodigo,
    });
    const clinica = (r.clinicaCodigo ?? codigoLimpo).toLowerCase();
    navigate(`/redefinir-senha${clinica ? `?c=${encodeURIComponent(clinica)}` : ''}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateEmail(email, { required: true })) {
      setErroEmail('Informe um e-mail válido.');
      return;
    }
    setErroEmail(undefined);
    void enviar();
  };

  if (enviado) {
    return (
      <AuthShell title="Confira seu e-mail" focusKey="enviado">
        <PainelEstado
          tom="info"
          icone={MailCheck}
          acoes={
            <div className="space-y-3">
              <p className="text-xs text-bokka-ink-3">
                Não chegou? Olhe a caixa de spam ou a aba de promoções.
              </p>
              {erro && (
                <div
                  role="alert"
                  className="text-sm text-bokka-danger-ink bg-bokka-danger-soft border border-bokka-danger/20 rounded-md px-3 py-2"
                >
                  {erro}
                </div>
              )}
              <Button
                type="button"
                variant="secondary"
                fullWidth
                loading={recuperarM.isPending}
                disabled={restante > 0}
                onClick={() => void enviar()}
              >
                {restante > 0 ? `Enviar novamente em ${restante} s` : 'Enviar novamente'}
              </Button>
            </div>
          }
        >
          Se os dados estiverem corretos, enviamos as instruções de recuperação para o seu e-mail. O
          link vale por 30 minutos e o código de 6 dígitos, por 15.
        </PainelEstado>

        <div className="border-t border-bokka-border pt-5">
          {mostrarCodigo ? (
            <CodigoRecuperacao
              key={envios}
              email={email}
              clinicaCodigo={codigoLimpo}
              onValidado={codigoValidado}
              autoFocus
              ajudaVencido={
                <>Se o código venceu ou já foi usado, use “Enviar novamente” acima para receber um novo.</>
              }
            />
          ) : (
            <Button
              type="button"
              fullWidth
              size="lg"
              onClick={() => setMostrarCodigo(true)}
              icon={<KeyRound className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />}
            >
              Tenho um código
            </Button>
          )}
        </div>
        <VoltarLogin codigo={codigoLimpo} />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Recuperar senha"
      subtitle="Informe seu e-mail e enviaremos um link para criar uma nova senha."
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {erro && (
          <div
            role="alert"
            className="text-sm text-bokka-danger-ink bg-bokka-danger-soft border border-bokka-danger/20 rounded-md px-3 py-2"
          >
            {erro}
          </div>
        )}

        <Input
          label="Código da clínica"
          autoComplete="organization"
          value={clinicaCodigo}
          onChange={(e) => setClinicaCodigo(e.target.value)}
          placeholder="minhaclinica"
          hint="Opcional. Se você usa mais de uma clínica ou consultório, informe o código para localizar o cadastro certo."
          leadingIcon={<Building2 className="w-4 h-4" strokeWidth={1.75} />}
        />

        <Input
          label="E-mail"
          type="email"
          required
          autoFocus
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@email.com"
          error={erroEmail}
          aria-invalid={!!erroEmail}
          leadingIcon={<Mail className="w-4 h-4" strokeWidth={1.75} />}
        />

        <Button type="submit" loading={recuperarM.isPending} fullWidth size="lg">
          Enviar link de recuperação
        </Button>
      </form>

      <VoltarLogin codigo={codigoLimpo} />
    </AuthShell>
  );
};
