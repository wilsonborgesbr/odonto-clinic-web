import { useState } from 'react';
import type { ReactNode } from 'react';
import { KeyRound } from 'lucide-react';
import { Button } from './ui/Button';
import { InputOtp } from './ui/InputOtp';
import { ApiError } from '../lib/api';
import { normalizeEmail, validateEmail } from '../lib/utils';
import { useValidarCodigoRecuperacao } from '../services/authService';
import type { ValidarCodigoRecuperacaoResponseDTO } from '../types';

const TAMANHO = 6;
const MSG_INVALIDO = 'Código inválido ou expirado. Verifique os dados ou solicite um novo.';
// Texto próprio (não o do servidor): explica o bloqueio sem pedir para tentar de novo agora.
const MSG_LIMITE =
  'Muitas tentativas. Por segurança, bloqueamos esta verificação por um tempo. Se ainda precisar, volte mais tarde e peça um novo código.';
const MSG_FALHA = 'Não foi possível validar agora. Tente novamente em instantes.';

interface CodigoRecuperacaoProps {
  email: string;
  clinicaCodigo?: string;
  /** Chamado com o ticket quando o código é aceito. O ticket não é guardado aqui. */
  onValidado: (r: ValidarCodigoRecuperacaoResponseDTO) => void;
  /** Campos extras dentro do formulário, acima do código (ex.: e-mail e clínica na tela de redefinição). */
  campos?: ReactNode;
  /** Mostrado abaixo do erro quando o código pode ter vencido (ex.: o botão "Enviar novamente"). */
  ajudaVencido?: ReactNode;
  autoFocus?: boolean;
}

/**
 * Entrada e validação do código de 6 dígitos de recuperação de senha.
 * O erro é sempre neutro (não diz se o e-mail existe); 429 tem texto próprio e trava o botão.
 * O código fica só no state deste componente: não vai para storage nem para a URL.
 */
export const CodigoRecuperacao = ({
  email,
  clinicaCodigo,
  onValidado,
  campos,
  ajudaVencido,
  autoFocus,
}: CodigoRecuperacaoProps) => {
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [limite, setLimite] = useState(false);
  const validarM = useValidarCodigoRecuperacao();

  const mudar = (v: string) => {
    setCodigo(v);
    if (erro) setErro(null);
  };

  const validar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (limite) return;

    if (validateEmail(email, { required: true })) {
      setErro('Informe o e-mail que você usou para pedir a recuperação.');
      return;
    }
    // Só dígitos, sem espaço nem hífen: com espaço o backend responde 400 de validação.
    const limpo = codigo.replace(/\D/g, '');
    if (limpo.length !== TAMANHO) {
      setErro(`Digite os ${TAMANHO} dígitos do código.`);
      return;
    }

    setErro(null);
    try {
      const r = await validarM.mutateAsync({
        email: normalizeEmail(email),
        clinicaCodigo: clinicaCodigo?.trim().toLowerCase() || undefined,
        codigo: limpo,
      });
      if (r.valido && r.ticket) {
        onValidado(r);
        return;
      }
      setErro(MSG_INVALIDO);
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setLimite(true);
        setErro(MSG_LIMITE);
      } else if (err instanceof ApiError && err.status === 400) {
        // O texto vem em `mensagem` e é o mesmo para qualquer falha; `mensagem` objeto é erro de campo.
        const texto = err.payload && typeof err.payload.mensagem === 'string' ? err.payload.mensagem : null;
        setErro(texto || MSG_INVALIDO);
      } else {
        setErro(MSG_FALHA);
      }
    }
  };

  return (
    <form onSubmit={validar} className="space-y-4" noValidate>
      {campos}

      <InputOtp
        label="Código de 6 dígitos"
        hint="Digite o código do e-mail ou cole aqui. Espaços e traços são ignorados."
        value={codigo}
        onChange={mudar}
        length={TAMANHO}
        error={erro ?? undefined}
        disabled={limite || validarM.isPending}
        autoFocus={autoFocus}
      />

      {erro && !limite && ajudaVencido && <div className="text-xs text-bokka-ink-3">{ajudaVencido}</div>}

      <Button
        type="submit"
        fullWidth
        size="lg"
        loading={validarM.isPending}
        disabled={limite}
        icon={<KeyRound className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />}
      >
        Validar código
      </Button>
    </form>
  );
};
