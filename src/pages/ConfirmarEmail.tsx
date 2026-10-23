import { useSearchParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, Check, Loader2 } from 'lucide-react';
import { AuthShell, PainelEstado } from '../components/AuthShell';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useConfirmarEmail } from '../services/authService';

/** Tela pública (logado ou não): consome o link de confirmação de e-mail ao abrir. */
export const ConfirmarEmail = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const token = params.get('token')?.trim() || null;
  const confirmarQ = useConfirmarEmail(token);

  const irParaPainel = (
    <Button
      type="button"
      fullWidth
      size="lg"
      onClick={() => navigate(isAuthenticated ? '/' : '/login', { replace: true })}
    >
      Acessar meu painel
    </Button>
  );

  if (token && confirmarQ.isLoading) {
    return (
      <AuthShell title="Confirmando seu e-mail">
        <PainelEstado
          tom="info"
          icone={Loader2}
          chipClassName="[&>svg]:animate-spin motion-reduce:[&>svg]:animate-none"
        >
          Só um instante...
        </PainelEstado>
      </AuthShell>
    );
  }

  if (token && confirmarQ.isSuccess) {
    const jaConfirmado = confirmarQ.data.jaConfirmado === true;
    return (
      <AuthShell
        title={jaConfirmado ? 'E-mail já confirmado' : 'E-mail confirmado!'}
        focusKey={jaConfirmado ? 'ja-confirmado' : 'confirmado'}
      >
        <PainelEstado
          tom="sucesso"
          icone={Check}
          grande
          chipClassName={jaConfirmado ? undefined : 'motion-safe:animate-[bokka-eye-pop_300ms_ease-out]'}
          acoes={irParaPainel}
        >
          {jaConfirmado
            ? 'Este e-mail já tinha sido confirmado. Está tudo certo.'
            : 'Obrigado! Sua conta está verificada e a recuperação de senha por e-mail está ativa.'}
        </PainelEstado>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Link inválido ou expirado" focusKey="invalido">
      <PainelEstado
        tom="aviso"
        icone={AlertTriangle}
        acoes={
          <Button
            type="button"
            variant="secondary"
            fullWidth
            size="lg"
            onClick={() => navigate('/login')}
          >
            Ir para o login
          </Button>
        }
      >
        Entre no Bokka e use o aviso no topo do painel para pedir um novo link de confirmação.
      </PainelEstado>
    </AuthShell>
  );
};
