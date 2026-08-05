import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { PermissaoEnum } from '../types';

interface RequirePermissionProps {
  permissao: PermissaoEnum;
  /** Se true, redireciona pro dashboard. Padrão: mostra tela "sem permissão". */
  redirect?: boolean;
  children: ReactNode;
}

/**
 * Envolve rotas que exigem uma permissão específica. Se o usuário não tem
 * a permissão, mostra uma tela explicativa (ou redireciona pro dashboard).
 */
export const RequirePermission = ({
  permissao,
  redirect = false,
  children,
}: RequirePermissionProps) => {
  const { hasPermissao } = useAuth();

  if (hasPermissao(permissao)) return <>{children}</>;

  if (redirect) return <Navigate to="/" replace />;

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 rounded-2xl bg-bokka-surface-3 text-bokka-ink-3 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7" strokeWidth={1.75} />
        </div>
        <h2 className="text-xl font-bold text-bokka-ink">Sem acesso a esta área</h2>
        <p className="text-sm text-bokka-ink-3 mt-2">
          Seu perfil atual não tem permissão para acessar este módulo. Fale com o proprietário da
          clínica para ajustar suas permissões em Usuários &amp; Permissões.
        </p>
      </div>
    </div>
  );
};
